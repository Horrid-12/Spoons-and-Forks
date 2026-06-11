import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { FoodEntry } from '../types';

interface TodaysLogProps {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<FoodEntry>) => void;
}

export const TodaysLog = ({ entries, onDelete, onUpdate }: TodaysLogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const startEdit = (entry: FoodEntry) => {
    setEditingId(entry.id);
    setEditValue(String(entry.calories));
  };

  const commitEdit = (id: string) => {
    const num = Math.max(0, Math.round(Number(editValue) || 0));
    onUpdate(id, { calories: num });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="p-4 rounded-3xl shadow-lg space-y-3" style={{ backgroundColor: 'var(--card, #2f3136)', border: '1px solid var(--outlineVariant, #44464E)' }}>
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-3 pb-1.5 text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
        <div className="col-span-3 sm:col-span-2">Time</div>
        <div className="col-span-5 sm:col-span-6">Description</div>
        <div className="col-span-2 text-right">Cals</div>
        <div className="col-span-2 text-right hidden sm:block">P / C / F</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Entries List */}
      <div className="space-y-1.5">
        {entries.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs uppercase tracking-widest rounded-2xl" style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px dashed var(--outlineVariant, #44464E)' }}>
            No entries logged for this cycle
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-sm rounded-xl group shadow-sm transition-all"
              style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)' }}
            >
              <div className="col-span-3 sm:col-span-2 font-mono text-xs" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                {formatTime(entry.timestamp)}
              </div>
              <div className="col-span-5 sm:col-span-6 truncate font-semibold" style={{ color: 'var(--onSurface, #dcddde)' }} title={entry.description}>
                {entry.description}
              </div>
              <div className="col-span-2 text-right font-mono font-bold" style={{ color: 'var(--accent, #5865F2)' }}>
                {editingId === entry.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(entry.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="w-16 px-1.5 py-0.5 text-xs font-mono text-right focus:outline-none rounded-md"
                      style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--accent, #5865F2)', color: 'var(--onSurface, #dcddde)' }}
                    />
                    <button
                      onClick={() => commitEdit(entry.id)}
                      className="hover:opacity-80 p-1.5"
                      style={{ color: '#10B981' }}
                      aria-label="Save calories"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="hover:opacity-80 p-1.5"
                      style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}
                      aria-label="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(entry)}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit calories"
                    title="Tap to edit calories"
                  >
                    <span>{entry.calories}</span>
                    <Pencil className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              <div className="col-span-2 text-right font-mono text-xs hidden sm:block" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                {entry.protein}<span style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>p</span> / {entry.carbs}<span style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>c</span> / {entry.fat}<span style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>f</span>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => onDelete(entry.id)}
                  className="hover:opacity-80 p-2 rounded-full transition-colors"
                  style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
