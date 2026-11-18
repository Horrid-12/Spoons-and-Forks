import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, Flame, Sprout, CalendarDays, Clock3 } from 'lucide-react';
import type { FoodEntry, MacroTargets } from '../types';
import { computeStats, PERIOD_LABELS, type Period, type Delta } from '../lib/stats';
import { BarChart, Sparkline, DonutChart, CalendarHeatmap, shortDayLabel } from './charts';
import { CheckerStrip, CitrusIcon, EmptyPlate, Ornament, SectionTitle } from './decor';

interface StatisticsViewProps {
  entries: FoodEntry[];
  targets: MacroTargets;
  dayStartHour: number;
  onBack: () => void;
}

const PREVIOUS_LABEL: Record<Period, string> = {
  '7d': 'previous 7 days',
  '30d': 'previous 30 days',
  '90d': 'previous 90 days',
  all: 'entire logged history',
};

const round = (value: number) => Math.round(value).toLocaleString();

const CardHeading = ({ kicker, title, icon }: { kicker: string; title: string; icon?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 mb-3">
    <div className="min-w-0">
      <p className="coastal-kicker mb-0.5 flex items-center gap-1.5"><Ornament className="w-2 h-2 shrink-0" style={{ color: '#A9C448' }} />{kicker}</p>
      <h3 className="text-base font-semibold leading-tight">{title}</h3>
    </div>
    {icon && <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8EEDB', color: '#243F83' }}>{icon}</div>}
  </div>
);

const MiniStat = ({ label, value, unit, caption }: { label: string; value: string; unit?: string; caption?: string }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-[.12em] font-bold truncate" style={{ color: 'var(--onSurfaceVariant)' }}>{label}</p>
    <p className="display-font text-lg font-bold leading-tight tabular-nums mt-0.5" style={{ color: 'var(--onBackground)' }}>
      {value}{unit && <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--onSurfaceVariant)' }}>{unit}</span>}
    </p>
    {caption && <p className="text-[10px] truncate" style={{ color: 'var(--onSurfaceVariant)' }} title={caption}>{caption}</p>}
  </div>
);

const DeltaBadge = ({ delta, previousLabel }: { delta: Delta | null; previousLabel: string }) => {
  if (!delta) return <span className="text-[10px]" style={{ color: 'var(--onSurfaceVariant)' }}>No prior data</span>;
  const Icon = delta.percent > 0 ? ArrowUpRight : delta.percent < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }} title={`Previous: ${round(delta.previous)} · ${previousLabel}`}>
      <Icon className="w-3 h-3" style={{ color: delta.percent > 0 ? '#78952D' : delta.percent < 0 ? '#243F83' : undefined }} />
      {Math.abs(delta.percent).toFixed(0)}% <span className="font-normal opacity-70">vs prev</span>
    </span>
  );
};

const MetricTile = ({ label, value, unit, delta, previousLabel }: {
  label: string; value: string; unit?: string; delta?: Delta | null; previousLabel: string;
}) => (
  <div className="coastal-card p-3 min-w-0">
    <p className="text-[10px] uppercase tracking-[.12em] font-bold truncate" style={{ color: 'var(--onSurfaceVariant)' }}>{label}</p>
    <p className="display-font text-xl sm:text-2xl font-bold leading-tight tabular-nums mt-1" style={{ color: 'var(--onBackground)' }}>
      {value}{unit && <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--onSurfaceVariant)' }}>{unit}</span>}
    </p>
    <div className="mt-1">{delta !== undefined ? <DeltaBadge delta={delta} previousLabel={previousLabel} /> : <span className="text-[10px]" style={{ color: 'var(--onSurfaceVariant)' }}>Recorded entries</span>}</div>
  </div>
);

export const StatisticsView = ({ entries, targets, dayStartHour, onBack }: StatisticsViewProps) => {
  const [period, setPeriod] = useState<Period>('30d');
  const [now] = useState(() => Date.now());
  const stats = useMemo(
    () => computeStats(entries, targets, dayStartHour, period, now),
    [entries, targets, dayStartHour, period, now],
  );

  const previousLabel = PREVIOUS_LABEL[period];
  const completeDays = stats.days.filter(d => d.logged && d.day !== stats.todayKey);
  const hasEntries = entries.length > 0;
  const hasPeriodEntries = stats.overview.activeDays > 0;
  const heatmapDays = period === 'all' ? stats.consistency.heatmap.slice(-182) : stats.consistency.heatmap;
  const timeMax = Math.max(1, ...stats.patterns.timeOfDay.map(b => b.count));
  const macroSeries: { label: string; color: string; values: (number | null)[]; avg: number; target: number; completion: number }[] = [
    { label: 'Protein', color: '#78952D', values: stats.macros.series.map(d => d.logged ? d.protein : null), avg: stats.macros.avg.protein, target: targets.protein, completion: stats.macros.completion.protein },
    { label: 'Carbs', color: '#A9C448', values: stats.macros.series.map(d => d.logged ? d.carbs : null), avg: stats.macros.avg.carbs, target: targets.carbs, completion: stats.macros.completion.carbs },
    { label: 'Fats', color: '#6F7890', values: stats.macros.series.map(d => d.logged ? d.fat : null), avg: stats.macros.avg.fat, target: targets.fat, completion: stats.macros.completion.fat },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold mb-3 px-2 py-1.5 rounded-md" style={{ color: '#243F83', background: '#E8EEDB' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to journal
        </button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionTitle kicker="The pantry ledger" title="Statistics & insights" />
          </div>
          <p className="text-[11px] max-w-sm" style={{ color: 'var(--onSurfaceVariant)' }}>
            Figures come from your own logged entries. Days without entries are never counted as zero intake.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(key => (
            <button key={key} onClick={() => setPeriod(key)} aria-pressed={period === key}
              className="text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: period === key ? '#243F83' : 'color-mix(in srgb, var(--card), black 7%)',
                color: period === key ? '#FFFDF7' : 'var(--onSurfaceVariant)',
                border: `1px solid ${period === key ? '#243F83' : 'var(--outlineVariant)'}`,
              }}>
              {PERIOD_LABELS[key]}
            </button>
          ))}
          <span className="text-[11px] ml-1" style={{ color: 'var(--onSurfaceVariant)' }}>
            {period === 'all' ? 'Entire history' : `Compared with the ${previousLabel}`}
          </span>
        </div>
        <CheckerStrip className="h-[5px] mt-4 rounded-full opacity-70" style={{ backgroundSize: '10px 10px' }} />
      </div>

      {!hasEntries && (
        <div className="coastal-card p-5 flex flex-col sm:flex-row items-center gap-4">
          <EmptyPlate className="w-36 h-auto shrink-0" />
          <div>
            <p className="display-font text-lg font-semibold">The ledger is empty</p>
            <p className="text-xs mt-1" style={{ color: 'var(--onSurfaceVariant)' }}>Log a meal on the journal page and the charts will fill in as your history grows.</p>
          </div>
        </div>
      )}
      {hasEntries && !hasPeriodEntries && (
        <div className="coastal-card p-4 text-sm" style={{ color: 'var(--onSurfaceVariant)' }}>
          No entries in {PERIOD_LABELS[period].toLowerCase()}. Try a longer period to see your history.
        </div>
      )}

      <section>
        <SectionTitle kicker="At a glance" title="Overview" aside="Averages use logged days only" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricTile label="Avg daily calories" value={round(stats.overview.avgCalories)} unit="kcal" delta={stats.overview.deltas.avgCalories} previousLabel={previousLabel} />
          <MetricTile label="Avg daily protein" value={round(stats.overview.avgProtein)} unit="g" delta={stats.overview.deltas.avgProtein} previousLabel={previousLabel} />
          <MetricTile label="Avg daily carbs" value={round(stats.overview.avgCarbs)} unit="g" delta={stats.overview.deltas.avgCarbs} previousLabel={previousLabel} />
          <MetricTile label="Avg daily fats" value={round(stats.overview.avgFat)} unit="g" delta={stats.overview.deltas.avgFat} previousLabel={previousLabel} />
          <MetricTile label="Logged meals" value={round(stats.overview.totalMeals)} delta={stats.overview.deltas.totalMeals} previousLabel={previousLabel} />
          <MetricTile label="Active days" value={round(stats.overview.activeDays)} delta={stats.overview.deltas.activeDays} previousLabel={previousLabel} />
        </div>
      </section>

      <section className="coastal-card p-4">
        <CardHeading kicker="Energy" title="Daily calorie intake" icon={<Flame className="w-4 h-4" />} />
        <div className="h-[190px] w-full">
          <BarChart
            data={stats.calories.series.map(d => ({ label: shortDayLabel(d.day), value: d.calories, logged: d.logged, isToday: d.day === stats.todayKey }))}
            target={targets.calories}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--outlineVariant)' }}>
          <MiniStat label="Daily average" value={round(stats.calories.avg)} unit="kcal" caption="Complete logged days" />
          <MiniStat label="Highest day" value={stats.calories.highest ? round(stats.calories.highest.calories) : '—'} unit="kcal" caption={stats.calories.highest ? shortDayLabel(stats.calories.highest.day) : 'No complete days'} />
          <MiniStat label="Lowest day" value={stats.calories.lowest ? round(stats.calories.lowest.calories) : '—'} unit="kcal" caption={stats.calories.lowest ? shortDayLabel(stats.calories.lowest.day) : 'No complete days'} />
          <MiniStat label="At or under target" value={`${Math.round(stats.calories.withinTargetPercent)}%`} caption={`${stats.calories.withinTargetDays} of ${completeDays.length} complete days`} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <section className="coastal-card p-4">
          <CardHeading kicker="The balance" title="Macro trends" icon={<Sprout className="w-4 h-4" />} />
          <div className="space-y-3">
            {macroSeries.map(macro => (
              <div key={macro.label}>
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold" style={{ color: macro.color }}>{macro.label}</span>
                  <span className="text-[11px] tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>
                    <strong style={{ color: 'var(--onSurface)' }}>{round(macro.avg)}g</strong> avg · {round(macro.target)}g target · {Math.round(macro.completion)}% complete
                  </span>
                </div>
                <div className="h-[60px]"><Sparkline values={macro.values} color={macro.color} target={macro.target} /></div>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--onSurfaceVariant)' }}>Gaps are unlogged days, not zero intake. Dashed line = daily target.</p>
        </section>

        <section className="coastal-card p-4">
          <CardHeading kicker="Where energy comes from" title="Macro distribution" icon={<CitrusIcon className="w-4 h-4" />} />
          {stats.macros.distribution.every(d => d.grams === 0) ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>No macro data in this period yet.</div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <DonutChart segments={stats.macros.distribution.map(d => ({ label: d.label, value: d.share, color: d.color }))} />
                <div className="flex-1 min-w-0 space-y-2">
                  {stats.macros.distribution.map(d => (
                    <div key={d.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 min-w-0" style={{ color: 'var(--onSurface)' }}>
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                        <span className="truncate">{d.label}</span>
                      </span>
                      <span className="tabular-nums shrink-0" style={{ color: 'var(--onSurfaceVariant)' }}>
                        <strong style={{ color: 'var(--onSurface)' }}>{Math.round(d.share)}%</strong> · {round(d.grams)}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t space-y-2" style={{ borderColor: 'var(--outlineVariant)' }}>
                <p className="coastal-kicker mb-1">Average vs daily target</p>
                {stats.macros.distribution.map((d, i) => {
                  const completion = [stats.macros.completion.protein, stats.macros.completion.carbs, stats.macros.completion.fat][i];
                  return (
                    <div key={d.key} className="flex items-center gap-2">
                      <span className="w-14 text-[10px]" style={{ color: 'var(--onSurfaceVariant)' }}>{d.label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--card), black 14%)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, completion)}%`, background: d.color }} />
                      </div>
                      <span className="w-10 text-right text-[10px] tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{Math.round(completion)}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--onSurfaceVariant)' }}>Share of estimated macro calories (4 / 4 / 9 kcal per gram).</p>
            </>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <section className="coastal-card p-4">
          <CardHeading kicker="Keeping at it" title="Logging consistency" icon={<CalendarDays className="w-4 h-4" />} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <MiniStat label="Current streak" value={String(stats.consistency.currentStreak)} unit="days" />
            <MiniStat label="Longest streak" value={String(stats.consistency.longestStreak)} unit="days" />
            <MiniStat label="Active days" value={String(stats.consistency.activeDays)} />
            <MiniStat label="Entries per day" value={stats.consistency.avgEntriesPerDay.toFixed(1)} caption="On active days" />
          </div>
          <div className="pt-3 border-t" style={{ borderColor: 'var(--outlineVariant)' }}>
            <p className="coastal-kicker mb-2">Activity calendar {period === 'all' ? '· last 26 weeks shown' : `· ${PERIOD_LABELS[period].toLowerCase()}`}</p>
            <CalendarHeatmap days={heatmapDays} />
          </div>
        </section>

        <section className="coastal-card p-4">
          <CardHeading kicker="From the notebook" title="Most logged entries" icon={<Ornament className="w-4 h-4" style={{ color: '#A9C448' }} />} />
          {stats.patterns.frequent.length === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>No descriptions logged in this period.</div>
          ) : (
            <>
              <p className="text-[10px] mb-2" style={{ color: 'var(--onSurfaceVariant)' }}>Exact text as you wrote it — not standardized foods.</p>
              <div className="space-y-1">
                {stats.patterns.frequent.map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs" style={{ background: i % 2 === 0 ? 'var(--card)' : 'color-mix(in srgb, var(--card), #F5F0E5 60%)' }}>
                    <span className="w-5 h-5 shrink-0 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: '#243F83', color: '#FFFDF7' }}>{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate font-semibold" title={item.label}>{item.label}</span>
                    <span className="shrink-0 tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{item.count}×</span>
                    <span className="shrink-0 font-bold tabular-nums w-14 text-right" style={{ color: '#78952D' }}>{round(item.avgCalories)} kcal</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--outlineVariant)' }}>
            <MiniStat label="Average calories per entry" value={round(stats.patterns.avgCaloriesPerEntry)} unit="kcal" caption="Across entries in this period" />
          </div>
        </section>
      </div>

      <section className="coastal-card p-4">
        <CardHeading kicker="Daily rhythm" title="Eating patterns" icon={<Clock3 className="w-4 h-4" />} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
          <div>
            <p className="coastal-kicker mb-2.5">Entries by time of day</p>
            <div className="space-y-2">
              {stats.patterns.timeOfDay.map(bucket => (
                <div key={bucket.label}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span style={{ color: 'var(--onSurface)' }}>{bucket.label}</span>
                    <span className="tabular-nums" style={{ color: 'var(--onSurfaceVariant)' }}>{bucket.count} · {Math.round(bucket.percent)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--card), black 12%)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(bucket.count / timeMax) * 100}%`, background: bucket.label === 'Morning' || bucket.label === 'Afternoon' ? '#A9C448' : '#243F83' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="coastal-kicker mb-2.5">Weekday vs weekend</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Weekdays', data: stats.patterns.weekday, color: '#243F83' },
                { label: 'Weekends', data: stats.patterns.weekend, color: '#78952D' },
              ].map(group => (
                <div key={group.label} className="rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--card), #F5F0E5 55%)', border: '1px solid var(--outlineVariant)' }}>
                  <p className="text-[11px] font-bold" style={{ color: group.color }}>{group.label}</p>
                  <p className="display-font text-lg font-bold leading-tight mt-1 tabular-nums">{round(group.data.avgCalories)} <span className="text-[10px] font-semibold" style={{ color: 'var(--onSurfaceVariant)' }}>kcal / day</span></p>
                  <p className="text-[10px]" style={{ color: 'var(--onSurfaceVariant)' }}>{group.data.days} logged days</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: 'var(--onSurfaceVariant)' }}>Averages exclude today while it is still in progress.</p>
          </div>
        </div>
      </section>

      <p className="text-[10px] leading-relaxed px-1 pb-2" style={{ color: 'var(--onSurfaceVariant)' }}>
        All figures are calculated locally from entries you logged. Calorie and macro values are AI-generated estimates, so these insights are for personal reflection, not medical or dietary advice. Days without entries are missing data, not zero intake.
      </p>
    </div>
  );
};
