import { Settings as SettingsIcon, Utensils, History, User, LogOut } from 'lucide-react';
import { getReadableDay, getLogicalDayString } from '../lib/dayLogic';
import { supabase } from '../lib/supabaseClient';
import type { User as UserType } from '@supabase/supabase-js';
import { CitrusIcon, CheckerStrip } from './decor';

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
    <header className="pt-4 sm:pt-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center shadow-sm shrink-0" style={{ background: '#243F83', color: '#FFFDF7' }}>
            <Utensils className="w-[18px] h-[18px]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#FFFDF7', border: '1px solid #D7CEB9' }}>
              <CitrusIcon className="w-3 h-3" style={{ color: '#78952D' }} />
            </span>
          </div>
          <div>
            <p className="coastal-kicker mb-0.5">A daily food journal</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none" style={{ color: 'var(--onBackground)' }}>
              Spoons <span style={{ color: 'var(--accent)' }}>&</span> Forks
            </h1>
          </div>
          {updateAvailable && (
            <button onClick={onUpdate} className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md" style={{ background: '#E8EEDB', color: '#43551E' }} title={`Update v${updateVersion} available`}>
              Update
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--onBackground)' }}>{getReadableDay(todayString)}</span>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--onSurfaceVariant)' }}>Cycle starts {String(dayStartHour).padStart(2, '0')}:00</span>
          </div>
          {[
            { label: 'History', onClick: onOpenHistory, Icon: History },
            { label: 'Settings', onClick: onOpenSettings, Icon: SettingsIcon },
          ].map(({label, onClick, Icon}) => (
            <button key={label} onClick={onClick} aria-label={label} title={label} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs hidden lg:block" style={{ color: 'var(--onSurfaceVariant)' }}>{user.email}</span>
              <button onClick={handleSignOut} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }} aria-label="Sign out" title="Sign out"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: '#243F83', background: '#FFFDF7', border: '1px solid var(--outlineVariant)' }} aria-label="Sign in" title="Sign in"><User className="w-4 h-4" /></button>
          )}
        </div>
      </div>
      {/* Azulejo checkerboard separator under the masthead */}
      <CheckerStrip className="h-[5px] rounded-full opacity-70" style={{ backgroundSize: '10px 10px' }} />
    </header>
  );
};
