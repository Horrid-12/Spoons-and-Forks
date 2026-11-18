import type { FoodEntry, AiProvider } from '../types';

const GEMINI_API_URL_BASE = 'https://generativelanguage.googleapis.com/v1/models';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const AI_PROVIDERS: Record<AiProvider, string> = {
  groq: 'Groq',
  gemini: 'Gemini',
};

/** Fast, production Groq text models (verified against console.groq.com/docs/models). */
export const GROQ_MODELS: Record<string, string> = {
  'llama-3.1-8b-instant': 'Llama 3.1 8B · fastest',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B · balanced',
  'openai/gpt-oss-120b': 'GPT-OSS 120B · detailed',
};

export const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';

/** Gemini models currently offered in Settings. */
export const GEMINI_MODELS: Record<string, string> = {
  'gemini-4-hydrogen': 'Gemini 4 Hydrogen',
  'gemini-3.8-flash': 'Gemini 3.8 Flash',
  'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite',
};

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

/** Old IDs users may still have stored locally or in Supabase. */
const LEGACY_GEMINI_MODELS: Record<string, string> = {
  'gemini-3.5-flash': 'gemini-4-hydrogen',
  'gemini-3.1-flash-lite': 'gemini-3.5-flash-lite',
};

export const normalizeGroqModel = (model: string | null | undefined): string => {
  if (model && model in GROQ_MODELS) return model;
  return DEFAULT_GROQ_MODEL;
};

/** Resolve any stored Gemini model ID to a currently supported one. */
export const normalizeGeminiModel = (model: string | null | undefined): string => {
  if (!model) return DEFAULT_GEMINI_MODEL;
  if (model in GEMINI_MODELS) return model;
  return LEGACY_GEMINI_MODELS[model] ?? DEFAULT_GEMINI_MODEL;
};

/** The subset of Settings the AI layer owns. Both keys are kept for failover. */
export interface StoredAiSettings {
  aiProvider: AiProvider;
  groqApiKey: string;
  groqModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

/** Normalize AI fields at every persistence/network boundary. */
export const normalizeAiSettings = (s: Partial<StoredAiSettings> | null | undefined): StoredAiSettings => ({
  aiProvider: s?.aiProvider === 'gemini' ? 'gemini' : 'groq',
  groqApiKey: typeof s?.groqApiKey === 'string' ? s.groqApiKey : '',
  groqModel: normalizeGroqModel(s?.groqModel),
  geminiApiKey: typeof s?.geminiApiKey === 'string' ? s.geminiApiKey : '',
  geminiModel: normalizeGeminiModel(s?.geminiModel),
});

/** Only these statuses are worth retrying; ordinary client errors are not. */
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
/** Capacity failures are provider-wide, so sibling models are skipped. */
const CAPACITY_STATUSES = new Set([429, 503]);
const REQUEST_TIMEOUT_MS: Record<AiProvider, number> = { groq: 20_000, gemini: 30_000 };
const MAX_RETRIES_PER_MODEL = 1;

class AiHttpError extends Error {
  readonly retryAfterMs: number;

  constructor(readonly provider: AiProvider, readonly status: number, detail: string, retryAfterMs = 0) {
    super(`${AI_PROVIDERS[provider]} API ${status}: ${detail}`);
    this.retryAfterMs = retryAfterMs;
  }
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
/** Exponential backoff with jitter, so concurrent clients do not retry in lockstep. */
const backoffMs = (attempt: number, retryAfterMs = 0): number => {
  const base = 700 * 2 ** attempt;
  const jittered = base + Math.random() * base * 0.5;
  return Math.max(jittered, Math.min(retryAfterMs, 8_000));
};

interface MacroResponse {
  edible: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

const buildPrompt = (text: string): string => `You are a strict food classifier and macro estimator for a calorie-tracking app.

Step 1: Determine if the user's input describes something edible (a food, drink, ingredient, meal, or supplement meant for human consumption).

- If the input is NOT edible (examples: metal, plastic, rocks, wood, glass, paper, dirt, sand, poison, cleaning supplies, inedible objects, random non-food nouns with no edible interpretation), you MUST set "edible" to false and return all macro fields as 0.
- If the input IS edible, set "edible" to true and provide a reasonable macro estimate using typical serving sizes. If the description is vague, assume an average single-person portion.

User input: "${text}"

Respond with ONLY a raw JSON object in this exact shape, no markdown, no prose, no code fences:
{"edible": <true|false>, "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>}

All five fields are required. Values are: calories in kcal, protein/carbs/fat in grams.`;

interface AiTarget {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

/** One HTTP attempt. Provider differences are confined to this function. */
const requestText = async ({ provider, model, apiKey }: AiTarget, prompt: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS[provider]);
  try {
    let response: Response;
    let textOut: string | undefined;

    if (provider === 'groq') {
      response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_completion_tokens: 200,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new AiHttpError(provider, response.status, detail.slice(0, 200), retryAfterMs(response));
      }
      const data = await response.json();
      textOut = data?.choices?.[0]?.message?.content;
      if (!textOut) throw new Error('Empty response from Groq API');
    } else {
      response = await fetch(`${GEMINI_API_URL_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new AiHttpError(provider, response.status, detail.slice(0, 200), retryAfterMs(response));
      }
      const data = await response.json();
      textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOut) throw new Error('Empty response from Gemini API');
    }
    return textOut;
  } finally {
    clearTimeout(timer);
  }
};

const retryAfterMs = (response: Response): number => {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
};

const parseMacroResponse = (
  textOut: string,
  userInput: string,
  provider: AiProvider,
): Omit<FoodEntry, 'id' | 'timestamp' | 'description'> => {
  const match = textOut.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*?\}/);
  if (!match) throw new Error(`${AI_PROVIDERS[provider]} returned non-JSON: ${textOut.slice(0, 120)}`);

  let parsed: MacroResponse;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error(`Failed to parse ${AI_PROVIDERS[provider]} JSON: ${match[0].slice(0, 120)}`);
  }

  if (parsed.edible === false) {
    throw new Error(`"${userInput}" is not an edible item. Only food, drinks, and supplements can be logged.`);
  }

  return {
    calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
    protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
  };
};

const isTransient = (error: unknown): boolean =>
  error instanceof AiHttpError
    ? TRANSIENT_STATUSES.has(error.status)
    : error instanceof TypeError || (error instanceof Error && error.name === 'AbortError');

const modelsFor = (provider: AiProvider, ai: StoredAiSettings): string[] => {
  const configured = provider === 'groq' ? ai.groqModel : ai.geminiModel;
  const all = Object.keys(provider === 'groq' ? GROQ_MODELS : GEMINI_MODELS);
  return [configured, ...all.filter(id => id !== configured)];
};

/**
 * Estimate macros from free text. The configured provider is tried first; if it
 * is unavailable, the other provider's key (when present) is used as a fallback.
 * Only transient failures are retried, and capacity failures skip sibling models.
 */
export const parseFoodWithAI = async (
  text: string,
  settings: StoredAiSettings,
): Promise<Omit<FoodEntry, 'id' | 'timestamp' | 'description'>> => {
  const ai = normalizeAiSettings(settings);
  const primary = ai.aiProvider;
  const secondary: AiProvider = primary === 'groq' ? 'gemini' : 'groq';
  const plans: AiTarget[] = [];

  const addPlan = (provider: AiProvider) => {
    const apiKey = provider === 'groq' ? ai.groqApiKey : ai.geminiApiKey;
    if (apiKey.trim()) {
      plans.push({ provider, apiKey: apiKey.trim(), model: provider === 'groq' ? ai.groqModel : ai.geminiModel });
    }
  };
  addPlan(primary);
  addPlan(secondary);

  if (plans.length === 0) {
    throw new Error('No AI API key configured. Add a Groq key (recommended) or a Gemini key in Settings.');
  }

  const prompt = buildPrompt(text);
  let lastFailure = '';
  let attempts = 0;

  for (const plan of plans) {
    let abandonProvider = false;
    for (let modelIndex = 0; modelIndex < modelsFor(plan.provider, ai).length && !abandonProvider; modelIndex++) {
      const model = modelsFor(plan.provider, ai)[modelIndex];
      const retries = modelIndex === 0 ? MAX_RETRIES_PER_MODEL : 0;
      let capacityExhausted = false;

      for (let retry = 0; retry <= retries; retry++) {
        attempts++;
        try {
          const output = await requestText({ ...plan, model }, prompt);
          return parseMacroResponse(output, text, plan.provider);
        } catch (error) {
          if (error instanceof AiHttpError && (error.status === 401 || error.status === 403)) {
            lastFailure = error.message;
            abandonProvider = true; // Bad key: sibling models will fail too.
            break;
          }
          if (error instanceof AiHttpError && (error.status === 400 || error.status === 404)) {
            lastFailure = error.message;
            break; // Model-level problem: try another model with the same key.
          }
          if (!(error instanceof AiHttpError) && !isTransient(error)) throw error;

          lastFailure = error instanceof Error ? error.message : String(error);
          const status = error instanceof AiHttpError ? error.status : 0;
          const retryAfter = error instanceof AiHttpError ? error.retryAfterMs : 0;

          if (CAPACITY_STATUSES.has(status)) {
            if (retry < retries) await sleep(backoffMs(retry, retryAfter));
            else capacityExhausted = true; // Provider-wide congestion; skip sibling models.
          } else if (retry < retries) {
            await sleep(backoffMs(retry, retryAfter));
          }
        }
      }
      if (capacityExhausted) abandonProvider = true;
    }
  }

  const subject = plans.length > 1 ? 'Both AI providers are' : `${AI_PROVIDERS[plans[0].provider]} is`;
  throw new Error(
    `${subject} temporarily unavailable after ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}. ` +
    `${lastFailure.slice(0, 140)} Try again in a minute, or switch providers in Settings.`,
  );
};
