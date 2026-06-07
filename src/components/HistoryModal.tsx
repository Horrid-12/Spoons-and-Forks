import { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { FoodEntry } from '../types';
import { getLogicalDayString, getReadableDay } from '../lib/dayLogic';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: FoodEntry[];
  dayStartHour: number;
  onDelete: (id: string) => void;
}

export const HistoryModal = ({ isOpen, onClose, entries, dayStartHour, onDelete }: HistoryModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const grouped = useMemo(() => {
    const map = new Map<string, FoodEntry[]>();
    for (const entry of entries) {
      const day = getLogicalDayString(entry.timestamp, dayStartHour);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, items]) => ({
        day,
        items: items.sort((a, b) => b.timestamp - a.timestamp),
        totals: items.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ),
      }));
  }, [entries, dayStartHour]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (day: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  if (!isOpen) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--card)] border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
            Food History
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {grouped.length === 0 ? (
            <div className="p-10 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-800 rounded-2xl">
              // No history yet
            </div>
          ) : (
            grouped.map(({ day, items, totals }) => {
              const isOpen = expanded.has(day);
              return (
                <div key={day} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/20">
                  <button
                    onClick={() => toggle(day)}
                    className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-900/30 transition-colors text-left"
                  >
                    <div className="col-span-1 text-zinc-500">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="col-span-5 sm:col-span-4 text-zinc-100 font-semibold text-sm">
                      {getReadableDay(day)}
                    </div>
                    <div className="col-span-2 text-center text-xs text-zinc-500 font-mono">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </div>
                    <div className="col-span-2 text-right font-mono text-[var(--accent)] font-bold text-sm">
                      {totals.calories}
                    </div>
                    <div className="col-span-2 sm:col-span-3 text-right font-mono text-xs text-zinc-500 hidden sm:block">
                      {totals.protein}p / {totals.carbs}c / {totals.fat}f
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-800 bg-zinc-950/30 px-3 py-2 space-y-1.5">
                      {items.map(entry => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs bg-zinc-950/40 border border-zinc-800 rounded-xl"
                        >
                          <div className="col-span-2 sm:col-span-2 font-mono text-zinc-500">
                            {formatTime(entry.timestamp)}
                          </div>
                          <div className="col-span-7 sm:col-span-6 text-zinc-300 truncate" title={entry.description}>
                            {entry.description}
                          </div>
                          <div className="col-span-2 text-right font-mono text-[var(--accent)] font-bold">
                            {entry.calories}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => onDelete(entry.id)}
                              className="text-zinc-600 hover:text-rose-400 p-1 rounded-full hover:bg-zinc-900/50 transition-colors"
                              aria-label="Delete entry"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
