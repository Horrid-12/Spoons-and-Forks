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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--background, #202225) 80%, transparent)' }}>
      <div className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl" style={{ backgroundColor: 'var(--card, #2f3136)', border: '1px solid var(--outlineVariant, #44464E)' }}>
        <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--outlineVariant, #44464E)' }}>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--onSurface, #dcddde)' }}>
            Food History
          </h2>
          <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant, #8e9297)' }} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {grouped.length === 0 ? (
            <div className="p-10 text-center font-mono text-xs uppercase tracking-widest rounded-2xl" style={{ color: 'var(--onSurfaceVariant, #8e9297)', border: '1px dashed var(--outlineVariant, #44464E)' }}>
              No history yet
            </div>
          ) : (
            grouped.map(({ day, items, totals }) => {
              const isOpen = expanded.has(day);
              return (
                <div key={day} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--outlineVariant, #44464E)' }}>
                  <button
                    onClick={() => toggle(day)}
                    className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:opacity-90 transition-colors text-left"
                    style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)' }}
                  >
                    <div className="col-span-1" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="col-span-5 sm:col-span-4 font-semibold text-sm" style={{ color: 'var(--onSurface, #dcddde)' }}>
                      {getReadableDay(day)}
                    </div>
                    <div className="col-span-2 text-center text-xs font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-sm" style={{ color: 'var(--accent, #5865F2)' }}>
                      {totals.calories}
                    </div>
                    <div className="col-span-2 sm:col-span-3 text-right font-mono text-xs hidden sm:block" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                      {totals.protein}p / {totals.carbs}c / {totals.fat}f
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-3 py-2 space-y-1.5" style={{ borderTop: '1px solid var(--outlineVariant, #44464E)', backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)' }}>
                      {items.map(entry => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs rounded-xl"
                          style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)', border: '1px solid var(--outlineVariant, #44464E)' }}
                        >
                          <div className="col-span-2 sm:col-span-2 font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
                            {formatTime(entry.timestamp)}
                          </div>
                          <div className="col-span-7 sm:col-span-6 truncate" style={{ color: 'var(--onSurface, #dcddde)' }} title={entry.description}>
                            {entry.description}
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold" style={{ color: 'var(--accent, #5865F2)' }}>
                            {entry.calories}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => onDelete(entry.id)}
                              className="hover:opacity-80 p-1 rounded-full transition-colors"
                              style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}
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
