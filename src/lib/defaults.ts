import type { Settings, MacroTargets } from '../types';

export const DEFAULT_TARGETS: MacroTargets = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fat: 80,
};

export const DEFAULT_SETTINGS: Settings = {
  accentColor: '#5865F2',
  bgColor: '#202225',
  cardColor: '#2f3136',
  fontColor: '#dcddde',
  dayStartHour: 5,
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash',
  targets: DEFAULT_TARGETS,
  useSystemTheme: true,
};
