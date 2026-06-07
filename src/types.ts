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

export interface Settings {
  accentColor: string;
  bgColor: string;
  cardColor: string;
  fontColor: string;
  dayStartHour: number;
  geminiApiKey: string;
  targets: MacroTargets;
}
