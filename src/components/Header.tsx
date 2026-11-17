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
    <header className="flex flex-wrap items-center justify-between gap-4 py-5 sm:py-6 mb-5 border-b" style={{ borderColor: 'var(--outlineVariant)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: '#243F83', color: '#FFFDF7' }}>
          <Utensils className="w-5 h-5" />
        </div>
        <div>
          <p className="coastal-kicker mb-0.5">A daily food journal</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--onBackground)' }}>
            Spoons <span style={{ color: 'var(--accent)' }}>&</span> Forks
          </h1>
        </div>
        {updateAvailable && (
          <button onClick={onUpdate} className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full" style={{ background: '#E8EEDB', color: '#43551E' }} title={`Update v${updateVersion} available`}>
            Update
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--onBackground)' }}>{getReadableDay(todayString)}</span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--onSurfaceVariant)' }}>Cycle starts {String(dayStartHour).padStart(2, '0')}:00</span>
        </div>
        {[
          { label: 'History', onClick: onOpenHistory, Icon: History },
          { label: 'Settings', onClick: onOpenSettings, Icon: SettingsIcon },
        ].map(({label, onClick, Icon}) => (
          <button key={label} onClick={onClick} aria-label={label} title={label} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }}>
            <Icon className="w-4 h-4" />
          </button>
        ))}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs hidden lg:block" style={{ color: 'var(--onSurfaceVariant)' }}>{user.email}</span>
            <button onClick={handleSignOut} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }} aria-label="Sign out" title="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }} aria-label="Sign in" title="Sign in"><User className="w-4 h-4" /></button>
        )}
      </div>
    </header>
  );
};
