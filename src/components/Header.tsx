import { Settings as SettingsIcon, Utensils, History, User, LogOut } from 'lucide-react';
import { getReadableDay, getLogicalDayString } from '../lib/dayLogic';
import { supabase } from '../lib/supabaseClient';
import type { User as UserType } from '@supabase/supabase-js';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  user: UserType | null;
  dayStartHour: number;
}

export const Header = ({ onOpenSettings, onOpenHistory, onOpenAuth, user, dayStartHour }: HeaderProps) => {
  const todayString = getLogicalDayString(Date.now(), dayStartHour);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:block">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="p-2 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-400 transition-colors rounded-xl"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="p-2 text-zinc-400 hover:text-[var(--accent)] border border-zinc-800 hover:border-[var(--accent)] transition-colors rounded-xl"
            aria-label="Sign in"
            title="Sign in"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
