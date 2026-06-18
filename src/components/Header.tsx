import { Settings as SettingsIcon, Utensils, History, User, LogOut } from 'lucide-react';
import { getReadableDay, getLogicalDayString } from '../lib/dayLogic';
import { supabase } from '../lib/supabaseClient';
import type { User as UserType } from '@supabase/supabase-js';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onUpdate: () => void;
  updateAvailable: boolean;
  updateVersion: string;
  user: UserType | null;
  dayStartHour: number;
}

export const Header = ({ onOpenSettings, onOpenHistory, onOpenAuth, onUpdate, updateAvailable, updateVersion, user, dayStartHour }: HeaderProps) => {
  const todayString = getLogicalDayString(Date.now(), dayStartHour);

  const handleSignOut = async () => {
    if (!window.confirm('Sign out?')) return;
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2">
        <Utensils className="w-5 h-5" style={{ color: 'var(--accent, #5865F2)' }} />
        <h1 className="text-2xl font-extrabold tracking-tight uppercase font-sans" style={{ color: 'var(--onBackground, #dcddde)' }}>
          Spoons and Forks<span style={{ color: 'var(--accent, #5865F2)' }}>.</span>
        </h1>
        {updateAvailable && (
          <button
            onClick={onUpdate}
            className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono font-bold rounded-full animate-pulse transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--accent, #5865F2)', color: 'var(--onPrimary, #FFFFFF)' }}
            title={`Update v${updateVersion} available`}
          >
            Update
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
            {getReadableDay(todayString)}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
            CYCLE STARTS {String(dayStartHour).padStart(2, '0')}:00
          </span>
        </div>
        <button
          onClick={onOpenHistory}
          className="p-2 transition-colors rounded-xl"
          style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px solid var(--outlineVariant, #44464E)' }}
          aria-label="Open History"
          title="History"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 transition-colors rounded-xl"
          style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px solid var(--outlineVariant, #44464E)' }}
          aria-label="Open Settings"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono hidden sm:block" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>{user.email}</span>
            <button
              onClick={handleSignOut}
              className="p-2 transition-colors rounded-xl"
              style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px solid var(--outlineVariant, #44464E)' }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="p-2 transition-colors rounded-xl"
            style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px solid var(--outlineVariant, #44464E)' }}
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
