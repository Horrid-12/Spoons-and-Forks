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
    <div className="p-4 bg-[var(--card)] border border-zinc-800 rounded-3xl shadow-lg space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-3 pb-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
        <div className="col-span-2 sm:col-span-1.5">Time</div>
        <div className="col-span-6 sm:col-span-5.5">Description</div>
        <div className="col-span-2 text-right">Cals</div>
        <div className="col-span-2 text-right hidden sm:block">P / C / F</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Entries List */}
      <div className="space-y-1.5">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-800 rounded-2xl">
            // No entries logged for this cycle
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-sm bg-zinc-950/20 border border-zinc-800 hover:border-[var(--accent)]/40 transition-all rounded-xl group shadow-sm"
            >
              <div className="col-span-2 sm:col-span-1.5 font-mono text-xs text-zinc-500">
                {formatTime(entry.timestamp)}
              </div>
              <div className="col-span-6 sm:col-span-5.5 text-zinc-100 truncate font-semibold" title={entry.description}>
                {entry.description}
              </div>
              <div className="col-span-2 text-right font-mono text-[var(--accent)] font-bold">
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
                      className="w-16 bg-zinc-950 border border-[var(--accent)] text-zinc-100 px-1.5 py-0.5 text-xs font-mono text-right focus:outline-none rounded-md"
                    />
                    <button
                      onClick={() => commitEdit(entry.id)}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5"
                      aria-label="Save calories"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                      aria-label="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(entry)}
                    className="inline-flex items-center gap-1 hover:text-[var(--accent)] opacity-70 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit calories"
                    title="Click to edit calories"
                  >
                    <span>{entry.calories}</span>
                    <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              <div className="col-span-2 text-right font-mono text-xs text-zinc-400 hidden sm:block">
                {entry.protein}<span className="text-zinc-600">p</span> / {entry.carbs}<span className="text-zinc-600">c</span> / {entry.fat}<span className="text-zinc-600">f</span>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-full hover:bg-zinc-900/50 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
