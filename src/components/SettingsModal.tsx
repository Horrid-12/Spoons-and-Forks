import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, User, LogOut } from 'lucide-react';
import { Settings } from '../types';
import { GEMINI_MODELS } from '../lib/ai';
import { isAndroid } from '../lib/platform';
import { supabase } from '../lib/supabaseClient';
import type { User as UserType } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings | ((prev: Settings) => Settings)) => void | Promise<void>;
  syncStatus: string;
  syncError: string;
  user: UserType | null;
  onSync: () => Promise<void>;
  onAuthChange: () => void;
}

const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="relative w-8 h-8 rounded-xl overflow-hidden cursor-pointer shadow-inner"
          style={{ backgroundColor: value, border: '1px solid var(--outlineVariant, #44464E)' }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none"
            aria-label={`Pick ${label}`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 font-mono text-xs focus:outline-none rounded-xl"
          style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
        />
      </div>
    </div>
  );
};

export const SettingsModal = ({ isOpen, onClose, settings, onSave, syncStatus, syncError, user, onSync, onAuthChange }: SettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaveError('');
      setSaving(true);
      await onSave(localSettings);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Sign out?')) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      onAuthChange();
    } finally {
      setSigningOut(false);
    }
  };

  const handleResetToDefaults = () => {
    setLocalSettings({
      ...localSettings,
      accentColor: '#5865F2',
      bgColor: '#202225',
      cardColor: '#2f3136',
      fontColor: '#dcddde',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--background, #202225) 80%, transparent)' }}>
      <div className="w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl" style={{ backgroundColor: 'var(--card, #2f3136)', border: '1px solid var(--outlineVariant, #44464E)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--outlineVariant, #44464E)' }}>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--onSurface, #dcddde)' }}>
            System Configuration
          </h2>
          <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant, #8e9297)' }} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
              Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={localSettings.geminiApiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })}
                placeholder="AIza..."
                className="flex-1 px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
                style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-2 transition-colors rounded-xl"
                style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px solid var(--outlineVariant, #44464E)' }}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
              AI Model
            </label>
            <div className="flex gap-2">
              {Object.entries(GEMINI_MODELS).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setLocalSettings({ ...localSettings, geminiModel: id })}
                  className="flex-1 py-2 px-2 rounded-xl font-mono text-[11px] transition-all"
                  style={{
                    backgroundColor: localSettings.geminiModel === id ? 'var(--accent, #5865F2)' : 'var(--surfaceContainerLowest, #0C0E14)',
                    color: localSettings.geminiModel === id ? 'var(--onPrimary, #FFFFFF)' : 'var(--onSurfaceVariant, #8e9297)',
                    border: `1px solid ${localSettings.geminiModel === id ? 'var(--accent, #5865F2)' : 'var(--outlineVariant, #44464E)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cloud Sync */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
              Cloud Sync
            </label>
            <div className="space-y-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>Status</span>
                <span className="text-xs font-mono" style={{ color: syncStatus.startsWith('OK') ? 'var(--accent, #5865F2)' : syncError ? 'var(--error, #F2B8B5)' : 'var(--onSurfaceVariant, #8e9297)' }}>
                  {syncError || syncStatus || 'Not connected'}
                </span>
              </div>
              {user && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>Account</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--onSurface, #dcddde)' }}>{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={onSync}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-mono font-bold rounded-xl transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent, #5865F2)', color: 'var(--onPrimary, #FFFFFF)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Now
                </button>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-mono rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurfaceVariant, #8e9297)' }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={onAuthChange}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-mono rounded-xl transition-opacity hover:opacity-90"
                    style={{ border: '1px solid var(--accent, #5865F2)', color: 'var(--accent, #5865F2)' }}
                  >
                    <User className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Theme — Monet toggle (Android only) */}
          {isAndroid() && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                Theme
              </label>
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)' }}>
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: 'var(--onSurface, #dcddde)' }}>System Colors (Monet)</div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>Use your wallpaper's color palette</div>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, useSystemTheme: !localSettings.useSystemTheme })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: localSettings.useSystemTheme ? 'var(--accent, #5865F2)' : 'var(--surfaceContainerHigh, #272A31)' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-transform shadow-sm"
                    style={{
                      backgroundColor: 'var(--onPrimary, #FFFFFF)',
                      transform: localSettings.useSystemTheme ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Interface Aesthetics — Desktop only */}
          {!isAndroid() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                  Interface Aesthetics
                </label>
                <button
                  onClick={handleResetToDefaults}
                  className="text-[10px] uppercase tracking-widest font-mono px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent, #5865F2)', border: '1px solid var(--accent, #5865F2)' }}
                >
                  Reset to Default
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <ColorRow
                  label="Accent Color"
                  value={localSettings.accentColor}
                  onChange={(v) => setLocalSettings({ ...localSettings, accentColor: v })}
                />
                <ColorRow
                  label="Background"
                  value={localSettings.bgColor}
                  onChange={(v) => setLocalSettings({ ...localSettings, bgColor: v })}
                />
                <ColorRow
                  label="Card Color"
                  value={localSettings.cardColor}
                  onChange={(v) => setLocalSettings({ ...localSettings, cardColor: v })}
                />
                <ColorRow
                  label="Font"
                  value={localSettings.fontColor}
                  onChange={(v) => setLocalSettings({ ...localSettings, fontColor: v })}
                />
              </div>
            </div>
          )}

          {/* Daily Cycle */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
              Daily Cycle Start (0-23)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={localSettings.dayStartHour}
              onChange={(e) => setLocalSettings({ ...localSettings, dayStartHour: Math.max(0, Math.min(23, Number(e.target.value))) })}
              className="w-full px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
              style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
            />
          </div>

          {/* Macro Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                Cal Target
              </label>
              <input
                type="number"
                value={localSettings.targets.calories}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, calories: Number(e.target.value) } })}
                className="w-full px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
                style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                Protein Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.protein}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, protein: Number(e.target.value) } })}
                className="w-full px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
                style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                Carbs Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.carbs}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, carbs: Number(e.target.value) } })}
                className="w-full px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
                style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                Fats Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.fat}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, fat: Number(e.target.value) } })}
                className="w-full px-3 py-2 font-mono text-sm focus:outline-none rounded-xl"
                style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4" style={{ borderTop: '1px solid var(--outlineVariant, #44464E)' }}>
          {saveError && (
            <span className="text-[10px] font-mono mr-auto" style={{ color: 'var(--error, #F2B8B5)' }}>{saveError}</span>
          )}
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50"
            style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-xs uppercase tracking-widest font-bold hover:opacity-90 rounded-2xl disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent, #5865F2)', color: 'var(--onPrimary, #FFFFFF)' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
