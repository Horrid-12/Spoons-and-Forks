import { useState, useEffect } from 'react';
import { Settings, FoodEntry } from '../types';

interface MacroDashboardProps { entries: FoodEntry[]; targets: Settings['targets']; }

const StatBar = ({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 50);
    return () => clearTimeout(timer);
  }, [percentage]);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--onSurfaceVariant)' }}>{label}</span>
        <span className="text-xs sm:text-sm tabular-nums">
          <span className="font-bold" style={{ color }}>{current.toLocaleString()}</span>
          <span style={{ color: 'var(--onSurfaceVariant)' }}> / {target.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--card), black 22%)' }}>
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${animatedPercentage}%`, background: color }} />
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

  const stats = [
    { label: 'Calories', value: totals.calories, target: targets.calories, unit: ' kcal' },
    { label: 'Protein', value: totals.protein, target: targets.protein, unit: ' g' },
    { label: 'Carbs', value: totals.carbs, target: targets.carbs, unit: ' g' },
    { label: 'Fats', value: totals.fat, target: targets.fat, unit: ' g' },
  ];

  return (
    <div className="coastal-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="coastal-kicker">The daily balance</p>
          <p className="text-sm mt-1" style={{ color: 'var(--onSurfaceVariant)' }}>A simple read on what you've had</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ color: '#243F83', background: '#E8EEDB' }}>
          <span className="text-lg">✳</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="rounded-xl p-3.5"
            style={{
              background: 'color-mix(in srgb, var(--card), black 10%)',
              border: '1px solid color-mix(in srgb, var(--card), black 20%)',
            }}
          >
            <StatBar
              label={stat.label}
              current={stat.value}
              target={stat.target}
              unit={stat.unit}
              color={index === 0 ? 'var(--primary, #243F83)' : 'var(--accent, #78952D)'}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
