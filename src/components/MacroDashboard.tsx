import { useState, useEffect } from 'react';
import { Settings, FoodEntry } from '../types';
import { CitrusIcon, Ornament, CornerTicks } from './decor';

interface MacroDashboardProps { entries: FoodEntry[]; targets: Settings['targets']; }

const COBALT = '#243F83';
const OLIVE = '#78952D';
const CITRUS = '#A9C448';
const SEAFOAM = '#6F7890';

/** Compact horizontal progress bar for a supporting macro. */
const MacroBar = ({ label, current, target, unit, color, textColor }: {
  label: string; current: number; target: number; unit: string; color: string; textColor?: string;
}) => {
  const [animated, setAnimated] = useState(0);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percentage), 60);
    return () => clearTimeout(timer);
  }, [percentage]);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-[.14em] font-bold" style={{ color: 'var(--onSurfaceVariant)' }}>{label}</span>
        <span className="text-xs tabular-nums">
          <span className="font-bold" style={{ color: textColor ?? color }}>{current.toLocaleString()}</span>
          <span style={{ color: 'var(--onSurfaceVariant)' }}> / {target.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--card), black 16%)' }}>
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${animated}%`, background: color }} />
      </div>
    </div>
  );
};

/** The hero calorie ring: primary visual anchor of the macro panel. */
const CalorieRing = ({ current, target }: { current: number; target: number }) => {
  const [animated, setAnimated] = useState(0);
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percentage), 60);
    return () => clearTimeout(timer);
  }, [percentage]);

  const R = 46;
  const CIRC = 2 * Math.PI * R;
  const over = target > 0 && current > target;

  return (
    <div className="relative w-[104px] h-[104px] shrink-0" role="img" aria-label={`${Math.round(percentage)}% of calorie target`}>
      <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90">
        <circle cx="52" cy="52" r={R} fill="none" strokeWidth="8" style={{ stroke: 'color-mix(in srgb, var(--card), black 14%)' }} />
        <circle
          cx="52" cy="52" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={over ? 'var(--error)' : COBALT}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC - (animated / 100) * CIRC}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display-font text-[22px] font-bold leading-none tabular-nums" style={{ color: 'var(--onBackground)' }}>
          {current.toLocaleString()}
        </span>
        <span className="text-[9px] uppercase tracking-[.12em] font-bold mt-0.5" style={{ color: 'var(--onSurfaceVariant)' }}>
          of {target.toLocaleString()}
        </span>
        <span className="text-[9px] font-bold tabular-nums mt-0.5 px-1.5 rounded" style={{ color: over ? 'var(--error)' : OLIVE, background: over ? 'color-mix(in srgb, var(--error) 12%, var(--card))' : '#E8EEDB' }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export const MacroDashboard = ({ entries, targets }: MacroDashboardProps) => {
  const totals = entries.reduce((acc, entry) => ({
    calories: acc.calories + entry.calories,
    protein: acc.protein + entry.protein,
    carbs: acc.carbs + entry.carbs,
    fat: acc.fat + entry.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="coastal-card p-4 relative">
      <CornerTicks />
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="coastal-kicker mb-0.5 flex items-center gap-1.5">
            <Ornament className="w-2 h-2 shrink-0" style={{ color: '#A9C448' }} />
            The daily balance
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--onSurfaceVariant)' }}>A simple read on what you've had</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ color: COBALT, background: '#E8EEDB' }}>
          <CitrusIcon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <CalorieRing current={totals.calories} target={targets.calories} />
        <div className="flex-1 min-w-0 space-y-3">
          <MacroBar label="Protein" current={totals.protein} target={targets.protein} unit="g" color={OLIVE} />
          <MacroBar label="Carbs" current={totals.carbs} target={targets.carbs} unit="g" color={CITRUS} textColor={OLIVE} />
          <MacroBar label="Fats" current={totals.fat} target={targets.fat} unit="g" color={SEAFOAM} />
        </div>
      </div>
    </div>
  );
};
