import { Settings, FoodEntry } from '../types';

interface MacroDashboardProps {
  entries: FoodEntry[];
  targets: Settings['targets'];
}

const StatBar = ({
  label,
  current,
  target,
  unit,
  color
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) => {
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] sm:text-xs uppercase tracking-widest font-mono font-bold" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>{label}</span>
        <span className="font-mono text-xs sm:text-sm" style={{ color: 'var(--onSurface, #dcddde)' }}>
          <span style={{ color }} className="font-bold">{current.toLocaleString()}</span>
          <span style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}> / {target.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)' }}>
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export const MacroDashboard = ({ entries, targets }: MacroDashboardProps) => {
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="p-5 rounded-3xl shadow-lg" style={{ backgroundColor: 'var(--card, #2f3136)', border: '1px solid var(--outlineVariant, #44464E)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 shadow-sm transition-all" style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)', border: '1px solid var(--outlineVariant, #44464E)' }}>
          <StatBar label="Calories" current={totals.calories} target={targets.calories} unit="" color="var(--accent, #5865F2)" />
        </div>
        <div className="rounded-2xl p-4 shadow-sm transition-all" style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)', border: '1px solid var(--outlineVariant, #44464E)' }}>
          <StatBar label="Protein" current={totals.protein} target={targets.protein} unit="g" color="var(--accent, #5865F2)" />
        </div>
        <div className="rounded-2xl p-4 shadow-sm transition-all" style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)', border: '1px solid var(--outlineVariant, #44464E)' }}>
          <StatBar label="Carbs" current={totals.carbs} target={targets.carbs} unit="g" color="var(--accent, #5865F2)" />
        </div>
        <div className="rounded-2xl p-4 shadow-sm transition-all" style={{ backgroundColor: 'var(--surfaceContainerLow, #1B1B1D)', border: '1px solid var(--outlineVariant, #44464E)' }}>
          <StatBar label="Fats" current={totals.fat} target={targets.fat} unit="g" color="var(--accent, #5865F2)" />
        </div>
      </div>
    </div>
  );
};
