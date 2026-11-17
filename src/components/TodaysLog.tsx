import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { FoodEntry } from '../types';

interface TodaysLogProps { entries: FoodEntry[]; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<FoodEntry>) => void; }

export const TodaysLog = ({ entries, onDelete, onUpdate }: TodaysLogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const startEdit = (entry: FoodEntry) => { setEditingId(entry.id); setEditValue(String(entry.calories)); };
  const commitEdit = (id: string) => { onUpdate(id, { calories: Math.max(0, Math.round(Number(editValue) || 0)) }); setEditingId(null); };
  const cancelEdit = () => { setEditingId(null); setEditValue(''); };

  return (
    <div className="coastal-card p-3 sm:p-4 space-y-3">
      <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-[10px] uppercase tracking-wider font-bold border-b" style={{ color: 'var(--onSurfaceVariant)', borderColor: 'var(--outlineVariant)' }}>
        <div className="col-span-3 sm:col-span-2">Time</div>
        <div className="col-span-5 sm:col-span-6">Description</div>
        <div className="col-span-2 text-right">Cals</div>
        <div className="col-span-2 text-right hidden sm:block">P / C / F</div>
        <div className="col-span-2 text-right">Action</div>
      </div>
      <div className="space-y-1.5">
        {entries.length === 0 ? (
          <div className="p-9 text-center rounded-xl" style={{ color: 'var(--onSurfaceVariant)', border: '1px dashed var(--outlineVariant)' }}>
            <div className="text-3xl mb-2" style={{ color: 'var(--accent)' }}>✳</div>
            <p className="display-font text-lg">Nothing on the table yet</p>
            <p className="text-xs mt-1">Add your first meal above.</p>
          </div>
        ) : entries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-2 px-3 py-3 items-center text-sm rounded-xl transition-colors" style={{ background: index % 2 === 0 ? 'color-mix(in srgb, var(--card), black 6%)' : 'color-mix(in srgb, var(--card), black 10%)', border: '1px solid color-mix(in srgb, var(--card), black 18%)' }}>
            <div className="col-span-3 sm:col-span-2 text-xs tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{formatTime(entry.timestamp)}</div>
            <div className="col-span-5 sm:col-span-6 truncate font-semibold" style={{ color: 'var(--onSurface)' }} title={entry.description}>{entry.description}</div>
            <div className="col-span-2 text-right font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              {editingId === entry.id ? (
                <div className="flex items-center justify-end gap-1">
                  <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commitEdit(entry.id); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-16 px-1.5 py-0.5 text-xs text-right rounded-md focus:outline-none" style={{ background: 'color-mix(in srgb, var(--card), black 12%)', border: '1px solid var(--accent)', color: 'var(--onSurface)' }} />
                  <button onClick={() => commitEdit(entry.id)} className="p-1" style={{ color: 'var(--accent)' }} aria-label="Save calories"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={cancelEdit} className="p-1" style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Cancel"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => startEdit(entry)} className="inline-flex items-center gap-1" aria-label="Edit calories" title="Tap to edit calories">
                  <span>{entry.calories}</span><Pencil className="w-3 h-3 opacity-40" />
                </button>
              )}
            </div>
            <div className="col-span-2 text-right text-xs hidden sm:block tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>
              {entry.protein}p / {entry.carbs}c / {entry.fat}f
            </div>
            <div className="col-span-2 flex justify-end">
              <button onClick={() => onDelete(entry.id)} className="p-2 rounded-full" style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Delete entry"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
