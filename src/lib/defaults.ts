import type { Settings, MacroTargets } from '../types';
import { DEFAULT_GEMINI_MODEL, DEFAULT_GROQ_MODEL } from './ai';

export const DEFAULT_TARGETS: MacroTargets = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fat: 80,
};

export const COASTAL_PALETTE = {
  accent: '#78952D',
  blue: '#243F83',
  background: '#F5F0E5',
  card: '#FFFDF7',
  ink: '#25345B',
  muted: '#6F7890',
  line: '#D7CEB9',
};

export const DEFAULT_SETTINGS: Settings = {
  accentColor: COASTAL_PALETTE.accent,
  bgColor: COASTAL_PALETTE.background,
  cardColor: COASTAL_PALETTE.card,
  fontColor: COASTAL_PALETTE.ink,
  dayStartHour: 5,
  aiProvider: 'groq',
  groqApiKey: '',
  groqModel: DEFAULT_GROQ_MODEL,
  geminiApiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  targets: DEFAULT_TARGETS,
  useSystemTheme: false,
};
