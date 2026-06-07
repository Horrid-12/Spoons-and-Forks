import { useState, useEffect, useCallback, useMemo } from 'react';
import { FoodEntry } from '../types';
import { getLogicalDayString } from '../lib/dayLogic';
import {
  loadEntries,
  insertEntry,
  deleteEntryById,
  updateEntryById,
} from '../lib/db';

export const useFoodLog = (dayStartHour: number) => {
  const [entries, setEntries] = useState<FoodEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    loadEntries().then(es => { if (active) setEntries(es); });
    return () => { active = false; };
  }, []);

  const addEntry = useCallback(async (entry: FoodEntry) => {
    await insertEntry(entry);
    setEntries(prev => prev ? [entry, ...prev] : [entry]);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await deleteEntryById(id);
    setEntries(prev => prev ? prev.filter(e => e.id !== id) : prev);
  }, []);

  const updateEntry = useCallback(async (id: string, patch: Partial<FoodEntry>) => {
    await updateEntryById(id, patch);
    setEntries(prev => prev ? prev.map(e => e.id === id ? { ...e, ...patch } : e) : prev);
  }, []);

  const todaysEntries = useMemo(() => {
    if (!entries) return [];
    const today = getLogicalDayString(Date.now(), dayStartHour);
    return entries.filter(
      e => getLogicalDayString(e.timestamp, dayStartHour) === today
    );
  }, [entries, dayStartHour]);

  return {
    entries: entries ?? [],
    todaysEntries,
    addEntry,
    deleteEntry,
    updateEntry,
    loading: entries === null,
  };
};
