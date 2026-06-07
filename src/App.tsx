import { useState, CSSProperties } from 'react';
import { Header } from './components/Header';
import { LogInput } from './components/LogInput';
import { MacroDashboard } from './components/MacroDashboard';
import { TodaysLog } from './components/TodaysLog';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { useSettings } from './hooks/useSettings';
import { useFoodLog } from './hooks/useFoodLog';

function App() {
  const { settings, setSettings } = useSettings();
  const { entries, todaysEntries, addEntry, deleteEntry, updateEntry } = useFoodLog(settings.dayStartHour);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
          dayStartHour={settings.dayStartHour}
        />

        <main className="space-y-6">
          <section>
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
    </div>
  );
}

export default App;
