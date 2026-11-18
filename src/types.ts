export interface FoodEntry {
  id: string;
  timestamp: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type AiProvider = 'groq' | 'gemini';

export interface Settings {
  accentColor: string;
  bgColor: string;
  cardColor: string;
  fontColor: string;
  dayStartHour: number;
  aiProvider: AiProvider;
  groqApiKey: string;
  groqModel: string;
  geminiApiKey: string;
  geminiModel: string;
  targets: MacroTargets;
  useSystemTheme: boolean;
}
