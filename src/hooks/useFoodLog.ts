import { useState, useEffect, useCallback } from 'react';
import { FoodEntry } from '../types';
import { getLogicalDayString } from '../lib/dayLogic';

const STORAGE_KEY = 'nutrack-log';

export const useFoodLog = (dayStartHour: number) => {
  const [entries, setEntries] = useState<FoodEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load food log", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: FoodEntry) => {
    setEntries(prev => [entry, ...prev]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<FoodEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const currentDayString = getLogicalDayString(Date.now(), dayStartHour);
  const todaysEntries = entries.filter(
    e => getLogicalDayString(e.timestamp, dayStartHour) === currentDayString
  );

  return { entries, todaysEntries, addEntry, deleteEntry, updateEntry };
};
