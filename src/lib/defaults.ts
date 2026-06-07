import type { Settings, MacroTargets } from '../types';

export const DEFAULT_TARGETS: MacroTargets = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fat: 80,
};

export const DEFAULT_SETTINGS: Settings = {
  accentColor: '#34d399',
  bgColor: '#09090b',
  cardColor: '#18181b',
  fontColor: '#d4d4d8',
  dayStartHour: 5,
  geminiApiKey: '',
  targets: DEFAULT_TARGETS,
};
