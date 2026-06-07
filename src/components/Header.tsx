import { Settings as SettingsIcon, Utensils, History } from 'lucide-react';
import { getReadableDay, getLogicalDayString } from '../lib/dayLogic';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  dayStartHour: number;
}

export const Header = ({ onOpenSettings, onOpenHistory, dayStartHour }: HeaderProps) => {
  const todayString = getLogicalDayString(Date.now(), dayStartHour);

  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2">
        <Utensils className="w-5 h-5 text-[var(--accent)]" />
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 uppercase font-sans">
          Spoons and Forks<span className="text-[var(--accent)]">.</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            {getReadableDay(todayString)}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">
            CYCLE STARTS {String(dayStartHour).padStart(2, '0')}:00
          </span>
        </div>
        <button
          onClick={onOpenHistory}
          className="p-2 text-zinc-400 hover:text-[var(--accent)] border border-zinc-800 hover:border-[var(--accent)] transition-colors rounded-xl"
          aria-label="Open History"
          title="History"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-[var(--accent)] border border-zinc-800 hover:border-[var(--accent)] transition-colors rounded-xl"
          aria-label="Open Settings"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
