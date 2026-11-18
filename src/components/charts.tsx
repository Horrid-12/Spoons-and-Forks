import { useEffect, useRef, useState } from 'react';
import type { DayStats } from '../lib/stats';

export const shortDayLabel = (day: string): string =>
  new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Keeps SVG text at a fixed size while the plot scales with its container. */
const useChartWidth = (fallback: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(120, Math.round(el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

const niceMax = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
};

export interface BarPoint { label: string; value: number; logged: boolean; isToday?: boolean }

/** Responsive daily bar chart with an optional dashed target reference line. */
export const BarChart = ({ data, target, color = '#243F83', height = 190 }: {
  data: BarPoint[]; target?: number; color?: string; height?: number;
}) => {
  const { ref, width: W } = useChartWidth(640);
  const H = height;
  const padL = 38;
  const padR = 10;
  const padT = 12;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = niceMax(Math.max(target ?? 0, ...data.map(d => d.value), 0) * 1.08);
  const step = plotW / Math.max(data.length, 1);
  const barW = Math.max(2, Math.min(26, step * 0.66));
  const y = (value: number) => padT + plotH - (value / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const targetY = target && target <= max ? y(target) : null;

  return (
    <div ref={ref} className="w-full" style={{ height }}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Daily values chart" style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map(f => {
        const gy = padT + plotH * (1 - f);
        return (
          <g key={f}>
            <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--outlineVariant)" strokeWidth="1" strokeDasharray={f === 0 ? undefined : '3 5'} opacity=".7" />
            <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="var(--onSurfaceVariant)">{Math.round(max * f)}</text>
          </g>
        );
      })}
      {targetY !== null && (
        <g>
          <line x1={padL} y1={targetY} x2={W - padR} y2={targetY} stroke="#78952D" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={W - padR} y={targetY - 5} textAnchor="end" fontSize="9" fontWeight="700" fill="#78952D">TARGET {target}</text>
        </g>
      )}
      {data.map((d, i) => {
        const cx = padL + step * i + step / 2;
        if (!d.logged) {
          return <circle key={i} cx={cx} cy={padT + plotH} r="1.6" fill="var(--onSurfaceVariant)" opacity=".45"><title>{`${d.label}: not logged`}</title></circle>;
        }
        const top = y(d.value);
        const h = Math.max(1.5, padT + plotH - top);
        return (
          <g key={i}>
            <rect x={cx - barW / 2} y={top} width={barW} height={h} rx="2" fill={color} opacity={d.isToday ? .5 : 1}>
              <title>{`${d.label}: ${Math.round(d.value).toLocaleString()}${d.isToday ? ' (today, still in progress)' : ''}`}</title>
            </rect>
            {(i % labelEvery === 0 || i === data.length - 1) && (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--onSurfaceVariant)">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
    </div>
  );
};

/** Compact line/area chart. `null` entries render as gaps, never zero values. */
export const Sparkline = ({ values, color = '#78952D', target, height = 72 }: {
  values: (number | null)[]; color?: string; target?: number; height?: number;
}) => {
  const { ref, width: W } = useChartWidth(320);
  const H = height;
  const pad = 5;
  const max = niceMax(Math.max(target ?? 0, ...values.filter((v): v is number => v !== null), 0) * 1.1);
  const x = (i: number) => pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const segments: { points: string; area: string }[] = [];
  let run: { i: number; v: number }[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const line = run.map(p => `${x(p.i)},${y(p.v)}`).join(' ');
    const base = y(0);
    segments.push({
      points: line,
      area: `${x(run[0].i)},${base} ${line} ${x(run[run.length - 1].i)},${base}`,
    });
    run = [];
  };
  values.forEach((v, i) => { if (v === null) flush(); else run.push({ i, v }); });
  flush();
  const targetY = target && target <= max ? y(target) : null;

  return (
    <div ref={ref} className="w-full" style={{ height }}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Trend chart" style={{ overflow: 'visible' }}>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--outlineVariant)" strokeWidth="1" />
      {targetY !== null && <line x1={pad} y1={targetY} x2={W - pad} y2={targetY} stroke="#243F83" strokeWidth="1" strokeDasharray="4 4" opacity=".6" />}
      {segments.map((seg, i) => (
        <g key={i}>
          <polygon points={seg.area} fill={color} opacity=".13" />
          <polyline points={seg.points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {segments.length === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--onSurfaceVariant)">No logged days in this period</text>}
    </svg>
    </div>
  );
};

/** Donut chart for macro calorie distribution. */
export const DonutChart = ({ segments, size = 116, label = 'Macro split' }: {
  segments: { label: string; value: number; color: string }[]; size?: number; label?: string;
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 116 116" width="100%" height="100%" role="img" aria-label="Macro distribution">
        <g transform="rotate(-90 58 58)">
          <circle cx="58" cy="58" r={R} fill="none" strokeWidth="15" style={{ stroke: 'color-mix(in srgb, var(--card), black 12%)' }} />
          {total > 0 && segments.map(seg => {
            const length = (seg.value / total) * C;
            const circle = (
              <circle key={seg.label} cx="58" cy="58" r={R} fill="none" strokeWidth="15" stroke={seg.color}
                strokeDasharray={`${Math.max(0, length - 1.5)} ${C}`} strokeDashoffset={-offset}>
                <title>{`${seg.label}: ${Math.round((seg.value / total) * 100)}% of macro calories`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        </g>
        <text x="58" y="55" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--onSurfaceVariant)">{total > 0 ? 'ENERGY' : '—'}</text>
        <text x="58" y="68" textAnchor="middle" fontSize="9" fill="var(--onSurfaceVariant)">{total > 0 ? label : 'no data'}</text>
      </svg>
    </div>
  );
};

/** Calendar heatmap: cobalt intensity shows how many entries were logged each day. */
export const CalendarHeatmap = ({ days }: { days: DayStats[] }) => {
  const shade = (count: number): string => {
    if (count <= 0) return 'color-mix(in srgb, var(--card), black 8%)';
    if (count === 1) return 'color-mix(in srgb, var(--card) 55%, #243F83)';
    if (count === 2) return 'color-mix(in srgb, var(--card) 30%, #243F83)';
    if (count === 3) return 'color-mix(in srgb, var(--card) 12%, #243F83)';
    return '#243F83';
  };
  return (
    <div>
      <div className="grid grid-cols-7 gap-1" role="img" aria-label="Logging activity heatmap">
        {days.map(day => (
          <div key={day.day} className="aspect-square rounded-[3px] border" style={{ background: shade(day.count), borderColor: 'color-mix(in srgb, var(--outlineVariant) 60%, transparent)' }}
            title={`${shortDayLabel(day.day)}: ${day.logged ? `${day.count} ${day.count === 1 ? 'entry' : 'entries'} · ${Math.round(day.calories).toLocaleString()} kcal` : 'not logged'}`} />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px]" style={{ color: 'var(--onSurfaceVariant)' }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(n => <span key={n} className="w-3 h-3 rounded-[2px] border" style={{ background: shade(n), borderColor: 'color-mix(in srgb, var(--outlineVariant) 60%, transparent)' }} />)}
        <span>More</span>
      </div>
    </div>
  );
};
