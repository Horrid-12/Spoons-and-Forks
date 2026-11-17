import { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import { FoodEntry } from '../types';
import { getLogicalDayString, getReadableDay } from '../lib/dayLogic';
import { CheckerStrip, Ornament } from './decor';

interface HistoryModalProps { isOpen: boolean; onClose: () => void; entries: FoodEntry[]; dayStartHour: number; onDelete: (id: string) => void; }

export const HistoryModal = ({ isOpen, onClose, entries, dayStartHour, onDelete }: HistoryModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1)).map(([day, items]) => ({
      day, items: items.sort((a, b) => b.timestamp - a.timestamp),
      totals: items.reduce((acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 }),
    }));
  }, [entries, dayStartHour]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (day: string) => setExpanded(prev => { const next = new Set(prev); if (next.has(day)) next.delete(day); else next.add(day); return next; });
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <AnimatedModal isOpen={isOpen} className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--outlineVariant)', boxShadow: '0 20px 60px rgba(30,40,65,.18)' }}>
      <CheckerStrip className="h-[5px] shrink-0 opacity-80" style={{ backgroundSize: '10px 10px' }} />
      <div className="flex items-center justify-between p-4 shrink-0 border-b" style={{ borderColor: 'var(--outlineVariant)' }}>
        <div><p className="coastal-kicker mb-0.5 flex items-center gap-1.5"><Ornament className="w-2 h-2" style={{ color: '#A9C448' }} />The archive</p><h2 className="text-xl font-semibold">Food history</h2></div>
        <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Close history"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 overflow-y-auto flex-1 space-y-3">
        {grouped.length === 0 ? <div className="p-10 text-center rounded-xl" style={{ color: 'var(--onSurfaceVariant)', border: '1px dashed var(--outlineVariant)' }}>Your story starts with the next meal.</div> : grouped.map(({ day, items, totals }) => {
          const isExpanded = expanded.has(day);
          return (
            <div key={day} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--outlineVariant)' }}>
              <button onClick={() => toggle(day)} className="w-full grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center text-left" style={{ background: 'color-mix(in srgb, var(--card), black 8%)' }}>
                <div className="col-span-1" style={{ color: 'var(--onSurfaceVariant)' }}>{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</div>
                <div className="col-span-5 sm:col-span-4 font-semibold text-sm">{getReadableDay(day)}</div>
                <div className="col-span-2 text-center text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>{items.length} {items.length === 1 ? 'item' : 'items'}</div>
                <div className="col-span-2 text-right font-bold text-sm" style={{ color: 'var(--accent)' }}>{totals.calories}</div>
                <div className="col-span-2 sm:col-span-3 text-right text-xs hidden sm:block" style={{ color: 'var(--onSurfaceVariant)' }}>{totals.protein}p / {totals.carbs}c / {totals.fat}f</div>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="px-3 py-1.5 space-y-0" style={{ borderTop: '1px solid var(--outlineVariant)', background: 'var(--card)' }}>
                    {items.map((entry, i) => <div key={entry.id} className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center text-xs border-b last:border-b-0" style={{ borderColor: 'color-mix(in srgb, var(--outlineVariant) 55%, transparent)', background: i % 2 === 0 ? 'var(--card)' : 'color-mix(in srgb, var(--card), #F5F0E5 55%)' }}>
                      <div className="col-span-2 tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{formatTime(entry.timestamp)}</div>
                      <div className="col-span-7 sm:col-span-6 truncate" title={entry.description}>{entry.description}</div>
                      <div className="col-span-2 text-right font-bold" style={{ color: 'var(--accent)' }}>{entry.calories}</div>
                      <div className="col-span-1 flex justify-end"><button onClick={() => onDelete(entry.id)} className="p-1" style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Delete entry"><X className="w-3 h-3" /></button></div>
                    </div>)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AnimatedModal>
  );
};
