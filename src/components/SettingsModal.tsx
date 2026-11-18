import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, User, LogOut, Download } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import { check } from '@tauri-apps/plugin-updater';
import { Settings, type AiProvider } from '../types';
import { AI_PROVIDERS, GEMINI_MODELS, GROQ_MODELS, normalizeAiSettings } from '../lib/ai';
import { isAndroid } from '../lib/platform';
import { supabase } from '../lib/supabaseClient';
import type { User as UserType } from '@supabase/supabase-js';
import { Ornament, CitrusIcon } from './decor';

interface SettingsModalProps {
  isOpen: boolean; onClose: () => void; settings: Settings;
  onSave: (newSettings: Settings | ((prev: Settings) => Settings)) => void | Promise<void>;
  syncStatus: string; syncError: string; user: UserType | null; onSync: () => Promise<void>; onAuthChange: () => void;
}

const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>{label}</span>
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden cursor-pointer shadow-inner" style={{ backgroundColor: value, border: '1px solid var(--outlineVariant)' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none" aria-label={`Pick ${label}`} />
      </div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-24 px-2 py-1 font-mono text-xs focus:outline-none rounded-lg" style={{ background: 'var(--surfaceContainerLowest)', border: '1px solid var(--outlineVariant)', color: 'var(--onSurface)' }} />
    </div>
  </div>
);

export const SettingsModal = ({ isOpen, onClose, settings, onSave, syncStatus, syncError, user, onSync, onAuthChange }: SettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  useEffect(() => { if (isOpen) setLocalSettings({ ...settings, ...normalizeAiSettings(settings) }); }, [isOpen, settings]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  const handleSave = async () => {
    try { setSaveError(''); setSaving(true); await onSave({ ...localSettings, ...normalizeAiSettings(localSettings) }); onClose(); }
    catch (e) { setSaveError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };
  const handleSignOut = async () => {
    if (!window.confirm('Sign out?')) return;
    setSigningOut(true);
    try { await supabase.auth.signOut(); onAuthChange(); }
    finally { setSigningOut(false); }
  };
  const handleCheckUpdate = async () => {
    setUpdateError(''); setUpdating(true);
    try {
      const update = await check();
      if (update) await update.downloadAndInstall();
      else setUpdateError('Already up to date');
    } catch (e) { setUpdateError(e instanceof Error ? e.message : 'Update check failed'); }
    finally { setUpdating(false); }
  };
  const handleResetToDefaults = () => setLocalSettings({ ...localSettings, accentColor: '#78952D', bgColor: '#F5F0E5', cardColor: '#FFFDF7', fontColor: '#25345B' });

  const fallbackProvider: AiProvider = localSettings.aiProvider === 'groq' ? 'gemini' : 'groq';
  const setKey = (provider: AiProvider, value: string) => setLocalSettings(
    provider === 'groq' ? { ...localSettings, groqApiKey: value } : { ...localSettings, geminiApiKey: value },
  );
  const setModel = (id: string) => setLocalSettings(
    localSettings.aiProvider === 'groq' ? { ...localSettings, groqModel: id } : { ...localSettings, geminiModel: id },
  );

  const sectionLabel = "block text-[10px] uppercase tracking-[.16em] font-bold mb-3";
  const inputStyle = { backgroundColor: 'var(--surfaceContainerLowest)', border: '1px solid var(--outlineVariant)', color: 'var(--onSurface)' };

  return (
    <AnimatedModal isOpen={isOpen} className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--outlineVariant)', boxShadow: '0 20px 60px rgba(30,40,65,.18)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--outlineVariant)' }}>
        <div><p className="coastal-kicker mb-0.5 flex items-center gap-1.5"><CitrusIcon className="w-3 h-3" style={{ color: '#78952D' }} />Make yourself at home</p><h2 className="text-xl font-semibold">Settings</h2></div>
        <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Close settings"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5 space-y-5">
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>AI provider</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(AI_PROVIDERS) as AiProvider[]).map(provider => {
              const active = localSettings.aiProvider === provider;
              return (
                <button key={provider} onClick={() => setLocalSettings({ ...localSettings, aiProvider: provider })}
                  className="rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{ background: active ? '#243F83' : 'color-mix(in srgb, var(--card), black 8%)', color: active ? '#FFFDF7' : 'var(--onSurface)', border: `1px solid ${active ? '#243F83' : 'var(--outlineVariant)'}` }}>
                  <span className="block text-xs font-bold">{AI_PROVIDERS[provider]}</span>
                  <span className="block text-[10px] opacity-75">{provider === 'groq' ? 'Fast · recommended' : 'Fallback'}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--onSurfaceVariant)' }}>Groq is used first; Gemini takes over if it is unavailable.</p>
        </section>
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>{AI_PROVIDERS[localSettings.aiProvider]} API key</label>
          <div className="flex items-center gap-2">
            <input type={showKey ? 'text' : 'password'} value={localSettings.aiProvider === 'groq' ? localSettings.groqApiKey : localSettings.geminiApiKey}
              onChange={e => setKey(localSettings.aiProvider, e.target.value)}
              placeholder={localSettings.aiProvider === 'groq' ? 'gsk_...' : 'AIza...'} className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none rounded-xl" style={inputStyle} />
            <button type="button" onClick={() => setShowKey(!showKey)} className="p-2 rounded-xl" style={{ color: 'var(--onSurfaceVariant)', border: '1px solid var(--outlineVariant)' }} aria-label={showKey ? 'Hide API key' : 'Show API key'}>{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--onSurfaceVariant)' }}>Free key: {localSettings.aiProvider === 'groq' ? 'console.groq.com/keys' : 'aistudio.google.com/apikey'}</p>
        </section>
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>{AI_PROVIDERS[localSettings.aiProvider]} model</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(localSettings.aiProvider === 'groq' ? GROQ_MODELS : GEMINI_MODELS).map(([id, label]) => {
              const active = (localSettings.aiProvider === 'groq' ? localSettings.groqModel : localSettings.geminiModel) === id;
              return <button key={id} onClick={() => setModel(id)} className="flex-1 py-2 px-2 rounded-xl text-xs transition-all" style={{ background: active ? '#243F83' : 'color-mix(in srgb, var(--card), black 8%)', color: active ? '#FFFDF7' : 'var(--onSurfaceVariant)', border: `1px solid ${active ? '#243F83' : 'var(--outlineVariant)'}` }}>{label}</button>;
            })}
          </div>
        </section>
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>Fallback key · {AI_PROVIDERS[fallbackProvider]}</label>
          <input type={showKey ? 'text' : 'password'} value={fallbackProvider === 'groq' ? localSettings.groqApiKey : localSettings.geminiApiKey}
            onChange={e => setKey(fallbackProvider, e.target.value)} placeholder={fallbackProvider === 'groq' ? 'gsk_...' : 'AIza...'}
            className="w-full px-3 py-2.5 text-sm focus:outline-none rounded-xl" style={inputStyle} />
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--onSurfaceVariant)' }}>Optional, but recommended. Used only when the primary provider fails.</p>
        </section>
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>Cloud sync</label>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--card), black 8%)', border: '1px solid var(--outlineVariant)' }}>
            <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>Status</span><span className="text-xs text-right break-all" style={{ color: syncStatus.startsWith('OK') ? 'var(--accent)' : syncError ? 'var(--error)' : 'var(--onSurfaceVariant)' }}>{syncError || syncStatus || 'Not connected'}</span></div>
            {user && <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>Account</span><span className="text-xs truncate" style={{ color: 'var(--onSurface)' }}>{user.email}</span></div>}
            <div className="flex items-center gap-2">
              <button onClick={onSync} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl" style={{ background: '#243F83', color: '#FFFDF7' }}><RefreshCw className="w-3.5 h-3.5" />Sync now</button>
              {user ? <button onClick={handleSignOut} disabled={signingOut} className="px-4 py-2.5 text-xs rounded-xl disabled:opacity-50" style={{ border: '1px solid var(--outlineVariant)', color: 'var(--onSurfaceVariant)' }}><LogOut className="w-3.5 h-3.5 inline mr-1" />Sign out</button> : <button onClick={onAuthChange} className="px-4 py-2.5 text-xs rounded-xl" style={{ border: '1px solid var(--outlineVariant)', color: 'var(--ink-blue)' }}><User className="w-3.5 h-3.5 inline mr-1" />Sign in</button>}
            </div>
          </div>
        </section>
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>Updates</label>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--card), black 8%)', border: '1px solid var(--outlineVariant)' }}>
            <button onClick={handleCheckUpdate} disabled={updating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl disabled:opacity-50" style={{ background: '#243F83', color: '#FFFDF7' }}><Download className="w-3.5 h-3.5" />{updating ? 'Checking...' : 'Check for updates'}</button>
            {updateError && <p className="text-xs" style={{ color: 'var(--error)' }}>{updateError}</p>}
          </div>
        </section>
        {!isAndroid() && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] uppercase tracking-[.16em] font-bold" style={{ color: 'var(--onSurfaceVariant)' }}>Interface colours</label>
              <button onClick={handleResetToDefaults} className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg" style={{ color: 'var(--ink-blue)', border: '1px solid var(--outlineVariant)' }}>Reset palette</button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--card), black 8%)', border: '1px solid var(--outlineVariant)' }}>
              <ColorRow label="Accent / citrus green" value={localSettings.accentColor} onChange={v => setLocalSettings({ ...localSettings, accentColor: v })} />
              <ColorRow label="Paper background" value={localSettings.bgColor} onChange={v => setLocalSettings({ ...localSettings, bgColor: v })} />
              <ColorRow label="Card / ivory" value={localSettings.cardColor} onChange={v => setLocalSettings({ ...localSettings, cardColor: v })} />
              <ColorRow label="Ink / text" value={localSettings.fontColor} onChange={v => setLocalSettings({ ...localSettings, fontColor: v })} />
            </div>
          </section>
        )}
        <section>
          <label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>Daily cycle starts at (0–23)</label>
          <input type="number" min={0} max={23} value={localSettings.dayStartHour} onChange={e => setLocalSettings({ ...localSettings, dayStartHour: Math.max(0, Math.min(23, Number(e.target.value))) })} className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none" style={inputStyle} />
        </section>
        <section className="grid grid-cols-2 gap-4">
          {([
            ['Calories', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fats (g)', 'fat'],
          ] as const).map(([label, key]) => <div key={key}><label className={sectionLabel} style={{ color: 'var(--onSurfaceVariant)' }}>{label} target</label><input type="number" value={localSettings.targets[key]} onChange={e => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, [key]: Number(e.target.value) } })} className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none" style={inputStyle} /></div>)}
        </section>
      </div>
      <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--outlineVariant)' }}>
        {saveError && <span className="text-xs mr-auto" style={{ color: 'var(--error)' }}>{saveError}</span>}
        <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-xs rounded-xl disabled:opacity-50" style={{ color: 'var(--onSurfaceVariant)' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-50" style={{ background: '#243F83', color: '#FFFDF7' }}>{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </AnimatedModal>
  );
};
