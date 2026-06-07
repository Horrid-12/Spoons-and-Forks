import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
}

const PRESET_COLORS = [
  { name: 'Cyber Mint', value: '#34d399' },
  { name: 'Crimson', value: '#f43f5e' },
  { name: 'Hot Pink', value: '#ec4899' },
  { name: 'Cyber Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
];

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const ColorRow = ({ label, value, onChange }: ColorRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-400 font-mono">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="relative w-8 h-8 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer shadow-inner"
          style={{ backgroundColor: value }}
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
          className="w-24 bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 font-mono text-xs focus:outline-none focus:border-[var(--accent)] rounded-xl"
        />
      </div>
    </div>
  );
};

export const SettingsModal = ({ isOpen, onClose, settings, onSave }: SettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card)] border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
            System Configuration
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-3">
              Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={localSettings.geminiApiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })}
                placeholder="AIza..."
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-2 text-zinc-500 hover:text-[var(--accent)] border border-zinc-800 hover:border-[var(--accent)] transition-colors rounded-xl"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
              Interface Aesthetics
            </label>
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

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-3">
              Daily Cycle Start (0-23)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={localSettings.dayStartHour}
              onChange={(e) => setLocalSettings({ ...localSettings, dayStartHour: Math.max(0, Math.min(23, Number(e.target.value))) })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
                Cal Target
              </label>
              <input
                type="number"
                value={localSettings.targets.calories}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, calories: Number(e.target.value) } })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
                Protein Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.protein}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, protein: Number(e.target.value) } })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
                Carbs Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.carbs}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, carbs: Number(e.target.value) } })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
                Fats Target (g)
              </label>
              <input
                type="number"
                value={localSettings.targets.fat}
                onChange={(e) => setLocalSettings({ ...localSettings, targets: { ...localSettings.targets, fat: Number(e.target.value) } })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent)] rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-xs uppercase tracking-widest bg-[var(--accent)] text-zinc-950 font-bold hover:opacity-90 rounded-2xl"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
