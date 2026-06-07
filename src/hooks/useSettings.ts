import { useState, useEffect } from 'react';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  accentColor: '#34d399',
  bgColor: '#09090b',
  cardColor: '#18181b',
  fontColor: '#d4d4d8',
  dayStartHour: 5,
  geminiApiKey: '',
  targets: {
    calories: 2500,
    protein: 150,
    carbs: 300,
    fat: 80,
  },
};

const STORAGE_KEY = 'spoons-and-forks-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed, 
          targets: { ...DEFAULT_SETTINGS.targets, ...parsed.targets } 
        };
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
};
