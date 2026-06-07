import { FoodEntry } from '../types';

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

interface GeminiResponse {
  edible: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export const parseFoodWithAI = async (
  text: string,
  apiKey: string
): Promise<Omit<FoodEntry, 'id' | 'timestamp' | 'description'>> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API key is missing. Add it in Settings.');
  }

  const prompt = `You are a strict food classifier and macro estimator for a calorie-tracking app.

Step 1: Determine if the user's input describes something edible (a food, drink, ingredient, meal, or supplement meant for human consumption).

- If the input is NOT edible (examples: metal, plastic, rocks, wood, glass, paper, dirt, sand, poison, cleaning supplies, inedible objects, random non-food nouns with no edible interpretation), you MUST set "edible" to false and return all macro fields as 0.
- If the input IS edible, set "edible" to true and provide a reasonable macro estimate using typical serving sizes. If the description is vague, assume an average single-person portion.

User input: "${text}"

Respond with ONLY a raw JSON object in this exact shape, no markdown, no prose, no code fences:
{"edible": <true|false>, "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>}

All five fields are required. Values are: calories in kcal, protein/carbs/fat in grams.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOut) {
    throw new Error('Empty response from Gemini API');
  }

  const match = textOut.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error(`Gemini returned non-JSON: ${textOut.slice(0, 120)}`);
  }

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error(`Failed to parse Gemini JSON: ${match[0].slice(0, 120)}`);
  }

  if (parsed.edible === false) {
    throw new Error(`"${text}" is not an edible item. Only food, drinks, and supplements can be logged.`);
  }

  return {
    calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
    protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
  };
};
