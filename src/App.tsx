import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { Header } from './components/Header';
import { LogInput } from './components/LogInput';
import { MacroDashboard } from './components/MacroDashboard';
import { TodaysLog } from './components/TodaysLog';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { AuthModal } from './components/AuthModal';
import { useSettings } from './hooks/useSettings';
import { useFoodLog } from './hooks/useFoodLog';
import { importFromLocalStorage, pullFromSupabase } from './lib/db';
import { supabase } from './lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS } from './lib/defaults';

function App() {
  const { settings, setSettings, loading: settingsLoading } = useSettings();
  const { entries, todaysEntries, addEntry, deleteEntry, updateEntry, reload, loading: logLoading } =
    useFoodLog(settings?.dayStartHour ?? DEFAULT_SETTINGS.dayStartHour);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [synced, setSynced] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
    importFromLocalStorage().then(did => { if (did) setImported(true); });
  }, []);

  const handleAuthChange = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);

    if (data.user) {
      const count = await pullFromSupabase();
      if (count > 0) {
        setSynced(count);
        reload();
      }
    }
  }, [reload]);

  if (settingsLoading || logLoading || !settings) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">
        // initializing local store
      </div>
    );
  }

  const containerStyle = {
    '--accent': settings.accentColor,
    '--bg': settings.bgColor,
    '--card': settings.cardColor,
    '--font': settings.fontColor,
  } as CSSProperties;

  return (
    <div style={containerStyle} className="min-h-screen bg-[var(--bg)] text-[var(--font)] font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          user={user}
          dayStartHour={settings.dayStartHour}
        />

        {imported && (
          <div className="mt-3 mb-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            // imported legacy data from localStorage
          </div>
        )}

        {synced > 0 && (
          <div className="mt-3 mb-3 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
            // synced {synced} entries from cloud
          </div>
        )}

        <main className="space-y-6 md:space-y-6 pb-28 md:pb-0">
          <section className="hidden md:block">
            <LogInput onLog={addEntry} apiKey={settings.geminiApiKey} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
                // Macro Telemetry
              </h2>
              <span className="text-[10px] text-zinc-600 font-mono">
                {todaysEntries.length} entries
              </span>
            </div>
            <MacroDashboard entries={todaysEntries} targets={settings.targets} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
                // Today's Log
              </h2>
            </div>
            <TodaysLog
              entries={todaysEntries}
              onDelete={deleteEntry}
              onUpdate={updateEntry}
            />
          </section>
        </main>

        <footer className="mt-12 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest">
            Spoons and Forks v0.1.0 // Local-First
          </p>
        </footer>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={entries}
        dayStartHour={settings.dayStartHour}
        onDelete={deleteEntry}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthChange={handleAuthChange}
      />

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-t border-zinc-800 p-3">
        <LogInput onLog={addEntry} apiKey={settings.geminiApiKey} />
      </div>
    </div>
  );
}

export default App;
