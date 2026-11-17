import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { FoodEntry } from '../types';
import { EmptyPlate, Ornament } from './decor';

interface TodaysLogProps { entries: FoodEntry[]; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<FoodEntry>) => void; }

export const TodaysLog = ({ entries, onDelete, onUpdate }: TodaysLogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const startEdit = (entry: FoodEntry) => { setEditingId(entry.id); setEditValue(String(entry.calories)); };
  const commitEdit = (id: string) => { onUpdate(id, { calories: Math.max(0, Math.round(Number(editValue) || 0)) }); setEditingId(null); };
  const cancelEdit = () => { setEditingId(null); setEditValue(''); };

  return (
    <div className="coastal-card overflow-hidden flex flex-col flex-1">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-[.14em] font-bold border-b shrink-0" style={{ color: 'var(--onSurfaceVariant)', borderColor: 'var(--outlineVariant)', background: 'color-mix(in srgb, var(--card), black 6%)' }}>
        <div className="col-span-2">Time</div>
        <div className="col-span-6 sm:col-span-5">Description</div>
        <div className="col-span-2 text-right">Cals</div>
        <div className="col-span-2 text-right hidden sm:block">P / C / F</div>
        <div className="col-span-2 sm:col-span-1 text-right" aria-hidden="true">&nbsp;</div>
      </div>
      {entries.length === 0 ? (
        <div className="px-6 py-7 flex-1 flex flex-col items-center justify-center text-center">
          <EmptyPlate className="w-44 h-auto mb-2" />
          <p className="display-font text-lg leading-tight flex items-center justify-center gap-1.5" style={{ color: 'var(--onBackground)' }}>
            <Ornament className="w-2.5 h-2.5" style={{ color: '#A9C448' }} />
            Nothing on the table yet
            <Ornament className="w-2.5 h-2.5" style={{ color: '#A9C448' }} />
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--onSurfaceVariant)' }}>Add your first meal above and set the table.</p>
        </div>
      ) : (
        <div className="flex-1">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-12 gap-2 px-4 py-2 items-center text-sm border-b last:border-b-0 transition-colors"
              style={{
                borderColor: 'color-mix(in srgb, var(--outlineVariant) 55%, transparent)',
                background: index % 2 === 0 ? 'var(--card)' : 'color-mix(in srgb, var(--card), #F5F0E5 55%)',
              }}
            >
              <div className="col-span-2 text-xs tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{formatTime(entry.timestamp)}</div>
              <div className="col-span-6 sm:col-span-5 min-w-0 font-semibold leading-snug" style={{ color: 'var(--onSurface)' }}>
                <span className="block truncate" title={entry.description}>{entry.description}</span>
              </div>
              <div className="col-span-2 text-right font-bold tabular-nums" style={{ color: '#243F83' }}>
                {editingId === entry.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commitEdit(entry.id); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-14 px-1.5 py-0.5 text-xs text-right rounded-md focus:outline-none" style={{ background: 'color-mix(in srgb, var(--card), black 12%)', border: '1px solid var(--accent)', color: 'var(--onSurface)' }} />
                    <button onClick={() => commitEdit(entry.id)} className="p-1" style={{ color: 'var(--accent)' }} aria-label="Save calories"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1" style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Cancel"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(entry)} className="inline-flex items-center justify-end gap-1 group" aria-label="Edit calories" title="Tap to edit calories">
                    <span className="text-[13px] sm:text-sm">{entry.calories}</span>
                    <Pencil className="w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity" />
                  </button>
                )}
              </div>
              <div className="col-span-2 text-right text-xs hidden sm:block tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>
                {entry.protein}<span style={{ color: '#78952D' }}>p</span> · {entry.carbs}<span style={{ color: '#A9C448' }}>c</span> · {entry.fat}<span style={{ color: '#6F7890' }}>f</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Delete entry"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
