import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import { Header } from './components/Header';
import { LogInput } from './components/LogInput';
import { MacroDashboard } from './components/MacroDashboard';
import { TodaysLog } from './components/TodaysLog';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { AuthModal } from './components/AuthModal';
import { useSettings } from './hooks/useSettings';
import { useFoodLog } from './hooks/useFoodLog';
import { importFromLocalStorage, pullFromSupabase, pushLocalToSupabase, testSupabaseConnection, pullSettingsFromSupabase } from './lib/db';
import { supabase } from './lib/supabaseClient';
import { isAndroid } from './lib/platform';
import type { User } from '@supabase/supabase-js';
import { PullToRefresh } from './components/PullToRefresh';
import { SectionTitle, Ornament } from './components/decor';
import { KitchenNotes } from './components/KitchenNotes';
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
  const [m3Ready, setM3Ready] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [synced, setSynced] = useState(0);
  const [syncError, setSyncError] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const syncLockRef = useRef(Promise.resolve());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const mergeSettings = useCallback((remote: typeof settings) => {
    const cur = settingsRef.current;
    if (!remote || !cur) return;
    const merged = { ...remote, accentColor: cur.accentColor, bgColor: cur.bgColor, cardColor: cur.cardColor, fontColor: cur.fontColor };
    if (!merged.geminiModel) merged.geminiModel = DEFAULT_SETTINGS.geminiModel;
    if (cur.geminiApiKey) merged.geminiApiKey = cur.geminiApiKey;
    if (cur.dayStartHour !== DEFAULT_SETTINGS.dayStartHour) merged.dayStartHour = cur.dayStartHour;
    if (JSON.stringify(cur.targets) !== JSON.stringify(DEFAULT_SETTINGS.targets)) merged.targets = cur.targets;
    setSettings(merged);
  }, [setSettings]);

  useEffect(() => {
    if (!settings) return;
    if (isAndroid() && settings.useSystemTheme) {
      let cancelled = false;
      import('tauri-plugin-m3').then(({ M3 }) => {
        if (cancelled) return;
        return M3.applyColors('dark').then(() => {
          if (cancelled) return;
          return M3.setBarColor('dark').then(() => {
            if (!cancelled) setM3Ready(true);
          });
        });
      }).catch(() => {
        if (!cancelled) setM3Ready(true);
      });
      return () => { cancelled = true; };
    } else {
      setM3Ready(true);
    }
  }, [settings]);

  useEffect(() => {
    import('@tauri-apps/plugin-updater').then(({ check }) => {
      check().then(u => {
        if (u) {
          setUpdateAvailable(true);
          setUpdateVersion(u.version);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await syncLockRef.current;
        const syncOp = (async () => {
          const status = await testSupabaseConnection();
          setSyncStatus(status);
          if (status.startsWith('OK')) {
            const { pulled } = await pullFromSupabase();
            const { pushed } = await pushLocalToSupabase();
            const remoteSettings = await pullSettingsFromSupabase();
            if (remoteSettings) mergeSettings(remoteSettings);
            reload();
            if (pulled > 0) setSynced(pulled);
            setSyncStatus(`signed in: pulled ${pulled}, pushed ${pushed}`);
          }
        })();
        syncLockRef.current = syncOp.then(() => {}, () => {});
        await syncOp;
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSyncStatus('');
      }
    });

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user);
        const syncOp = (async () => {
          const status = await testSupabaseConnection();
          setSyncStatus(status);
          if (status.startsWith('OK')) {
            const { pulled } = await pullFromSupabase();
            const { pushed } = await pushLocalToSupabase();
            const remoteSettings = await pullSettingsFromSupabase();
            if (remoteSettings) mergeSettings(remoteSettings);
            reload();
            if (pulled > 0) setSynced(pulled);
            setSyncStatus(`pulled ${pulled}, pushed ${pushed}`);
          }
        })();
        syncLockRef.current = syncOp.then(() => {}, () => {});
        await syncOp;
      }
    });
    importFromLocalStorage().then(did => { if (did) setImported(true); });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    setSynced(0);
    setSyncError('');

    if (data.user) {
      const status = await testSupabaseConnection();
      setSyncStatus(status);
      if (status.startsWith('OK')) {
        try {
          const { pulled } = await pullFromSupabase();
          if (pulled > 0) {
            setSynced(pulled);
          }
          const { pushed, errors } = await pushLocalToSupabase();
          if (pushed > 0) {
            setSyncStatus(`pulled ${pulled}, pushed ${pushed} entries`);
          }
          if (errors.length > 0) {
            setSyncError(`push errors: ${errors.join('; ')}`);
          }
          const remoteSettings = await pullSettingsFromSupabase();
          if (remoteSettings) mergeSettings(remoteSettings);
          reload();
        } catch (e) {
          setSyncError(e instanceof Error ? e.message : 'Sync failed');
        }
      } else {
        setSyncError(status);
      }
    } else {
      setSyncStatus('');
    }
  }, [reload]);

  const handleUpdate = useCallback(async () => {
    if (isAndroid()) {
      window.open('https://github.com/Horrid-12/Spoons-and-Forks/releases', '_blank');
    } else {
      import('@tauri-apps/plugin-updater').then(({ check }) => {
        check().then(u => {
          if (u) u.downloadAndInstall();
        }).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    const status = await testSupabaseConnection();
    setSyncStatus(status);
    if (status.startsWith('OK')) {
      const { pulled } = await pullFromSupabase();
      const { pushed } = await pushLocalToSupabase();
      const remoteSettings = await pullSettingsFromSupabase();
      if (remoteSettings) mergeSettings(remoteSettings);
      reload();
      if (pulled > 0) setSynced(pulled);
      setSyncStatus(`refreshed: pulled ${pulled}, pushed ${pushed}`);
    }
    if (isAndroid() && settingsRef.current?.useSystemTheme) {
      import('tauri-plugin-m3').then(({ M3 }) => {
        M3.applyColors('dark').catch(() => {});
        M3.setBarColor('dark').catch(() => {});
      }).catch(() => {});
    }
  }, [reload]);

  if (settingsLoading || logLoading || !settings || (isAndroid() && settings.useSystemTheme && !m3Ready)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-[10px] uppercase tracking-widest" style={{ backgroundColor: 'var(--background, #202225)', color: 'var(--onBackground, #dcddde)' }}>
        Getting the table ready...
      </div>
    );
  }

  const mixHex = (a: string, b: string, ratio: number): string => {
    const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [ar, ag, ab] = p(a);
    const [br, bg, bb] = p(b);
    const m = (x: number, y: number) => Math.round(x * ratio + y * (1 - ratio));
    return `#${[m(ar, br), m(ag, bg), m(ab, bb)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  };

  const useM3 = isAndroid() && settings.useSystemTheme;
  const containerStyle = (useM3
    ? {}
    : {
        '--accent': settings.accentColor,
        '--bg': settings.bgColor,
        '--card': settings.cardColor,
        '--font': settings.fontColor,
        '--primary': '#243F83',
        '--onPrimary': '#FFFDF7',
        '--surfaceContainerLowest': mixHex(settings.cardColor, '#000000', 0.94),
        '--surfaceContainerLow': mixHex(settings.cardColor, settings.bgColor, 0.13),
        '--surfaceContainerHigh': mixHex(settings.cardColor, settings.bgColor, 0.25),
        '--onSurface': settings.fontColor,
        '--onSurfaceVariant': '#6F7890',
        '--outlineVariant': '#D7CEB9',
      }) as CSSProperties;

  return (
    <div style={{ ...containerStyle, backgroundColor: useM3 ? 'var(--background)' : 'var(--bg, var(--background))', color: useM3 ? 'var(--onBackground)' : 'var(--font, var(--onBackground))', fontFamily: "'Epilogue', sans-serif" }} className="coastal-app min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-4 pb-24 md:pb-8 flex min-h-screen flex-col">
        <PullToRefresh onRefresh={handleRefresh}>
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onUpdate={handleUpdate}
          updateAvailable={updateAvailable}
          updateVersion={updateVersion}
          user={user}
          dayStartHour={settings.dayStartHour}
        />

        <main className="mt-5 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_21rem] gap-5 md:gap-6 lg:gap-7 items-start pb-4 md:pb-2">
          {/* Journal column: logging + today's table */}
          <div className="min-w-0 space-y-5 md:space-y-6 order-2 lg:order-none lg:h-full lg:flex lg:flex-col">
            <section className="hidden md:block shrink-0">
              <LogInput onLog={addEntry} apiKey={settings.geminiApiKey} model={settings.geminiModel} />
            </section>

            <section className="lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
              <SectionTitle
                kicker="Fresh from the kitchen"
                title="Today's table"
                badge={`${todaysEntries.length} ${todaysEntries.length === 1 ? 'entry' : 'entries'}`}
                aside="Tap a calorie to edit"
              />
              <TodaysLog
                entries={todaysEntries}
                onDelete={deleteEntry}
                onUpdate={updateEntry}
              />
            </section>
          </div>

          {/* Nourishment column: macros + pantry notes */}
          <aside className="min-w-0 space-y-5 md:space-y-6 order-1 lg:order-none lg:sticky lg:top-5">
            <section>
              <SectionTitle
                kicker="A little of everything"
                title="Today's nourishment"
              />
              <MacroDashboard entries={todaysEntries} targets={settings.targets} />
            </section>
            <KitchenNotes />
          </aside>
        </main>

        <footer className="mt-6 pt-4 text-center shrink-0" style={{ borderTop: '1px solid var(--outlineVariant)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] flex items-center justify-center gap-2" style={{ color: 'var(--onSurfaceVariant)' }}>
            <Ornament className="w-2 h-2" style={{ color: '#A9C448' }} />
            Made by Howwid with ♥
            <Ornament className="w-2 h-2" style={{ color: '#A9C448' }} />
          </p>
        </footer>
        </PullToRefresh>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        syncStatus={syncStatus}
        syncError={syncError}
        user={user}
        onSync={handleRefresh}
        onAuthChange={handleAuthChange}
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

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--bg, var(--background)) 96%, transparent)', borderTop: '1px solid var(--outlineVariant)' }}>
        <LogInput onLog={addEntry} apiKey={settings.geminiApiKey} model={settings.geminiModel} />
      </div>
    </div>
  );
}

export default App;
