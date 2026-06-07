import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import { loadSettings, saveSettings } from '../lib/db';

export const useSettings = () => {
  const [settings, setSettingsState] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    loadSettings().then(s => { if (active) setSettingsState(s); });
    return () => { active = false; };
  }, []);

  const setSettings = useCallback(async (updater: Settings | ((prev: Settings) => Settings)) => {
    const current = settings ?? await loadSettings();
    const next = typeof updater === 'function' ? updater(current) : updater;
    setSettingsState(next);
    await saveSettings(next);
  }, [settings]);

  return { settings, setSettings, loading: settings === null };
};
