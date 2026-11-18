import type { FoodEntry, MacroTargets } from '../types';
import { getLogicalDayString } from './dayLogic';

export type Period = '7d' | '30d' | '90d' | 'all';

export const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

const PERIOD_LENGTH: Record<Exclude<Period, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
/** Guard against pathological datasets with timestamps decades in the past. */
const MAX_ALL_TIME_DAYS = 4000;

export interface DayStats {
  day: string;
  logged: boolean;
  entries: FoodEntry[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

export interface Delta {
  current: number;
  previous: number;
  percent: number;
}

export interface StatsSummary {
  period: Period;
  days: DayStats[];
  todayKey: string;
  overview: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    totalMeals: number;
    activeDays: number;
    deltas: {
      avgCalories: Delta | null;
      avgProtein: Delta | null;
      avgCarbs: Delta | null;
      avgFat: Delta | null;
      totalMeals: Delta | null;
      activeDays: Delta | null;
    };
  };
  calories: {
    target: number;
    avg: number;
    highest: DayStats | null;
    lowest: DayStats | null;
    withinTargetDays: number;
    withinTargetPercent: number;
    series: DayStats[];
  };
  macros: {
    avg: { protein: number; carbs: number; fat: number };
    completion: { protein: number; carbs: number; fat: number };
    distribution: { key: string; label: string; grams: number; share: number; color: string }[];
    series: DayStats[];
  };
  consistency: {
    currentStreak: number;
    longestStreak: number;
    activeDays: number;
    avgEntriesPerDay: number;
    heatmap: DayStats[];
  };
  patterns: {
    frequent: { label: string; count: number; avgCalories: number }[];
    avgCaloriesPerEntry: number;
    timeOfDay: { label: string; count: number; percent: number }[];
    weekday: { avgCalories: number; days: number };
    weekend: { avgCalories: number; days: number };
  };
}

const blankDay = (day: string): DayStats => ({
  day, logged: false, entries: [], calories: 0, protein: 0, carbs: 0, fat: 0, count: 0,
});

/** Logical day key for a date N calendar days before `now` (respects dayStartHour). */
export const dayKeyForOffset = (now: number, offset: number, dayStartHour: number): string => {
  const date = new Date(now);
  date.setDate(date.getDate() - offset);
  return getLogicalDayString(date.getTime(), dayStartHour);
};

/** Shift a YYYY-MM-DD logical day key by whole calendar days. */
export const shiftDayKey = (day: string, delta: number): string => {
  const [year, month, date] = day.split('-').map(Number);
  const d = new Date(year, month - 1, date + delta, 12);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const groupByDay = (entries: FoodEntry[], dayStartHour: number): Map<string, DayStats> => {
  const map = new Map<string, DayStats>();
  for (const entry of entries) {
    if (!Number.isFinite(entry.timestamp)) continue;
    const key = getLogicalDayString(entry.timestamp, dayStartHour);
    let day = map.get(key);
    if (!day) { day = blankDay(key); map.set(key, day); }
    day.logged = true;
    day.entries.push(entry);
    day.count += 1;
    day.calories += entry.calories || 0;
    day.protein += entry.protein || 0;
    day.carbs += entry.carbs || 0;
    day.fat += entry.fat || 0;
  }
  return map;
};

const keysForPeriod = (period: Period, now: number, dayStartHour: number, earliest?: string): string[] => {
  if (period === 'all') {
    if (!earliest) return [dayKeyForOffset(now, 0, dayStartHour)];
    const keys: string[] = [];
    for (let i = 0; i < MAX_ALL_TIME_DAYS; i++) {
      const key = dayKeyForOffset(now, i, dayStartHour);
      if (key < earliest) break;
      keys.push(key);
    }
    return keys.reverse(); // ascending
  }
  const length = PERIOD_LENGTH[period];
  const keys: string[] = [];
  for (let i = length - 1; i >= 0; i--) keys.push(dayKeyForOffset(now, i, dayStartHour));
  return keys; // ascending
};

const previousKeys = (period: Period, now: number, dayStartHour: number): string[] => {
  if (period === 'all') return [];
  const length = PERIOD_LENGTH[period];
  const keys: string[] = [];
  for (let i = length * 2 - 1; i >= length; i--) keys.push(dayKeyForOffset(now, i, dayStartHour));
  return keys;
};

const daysFromKeys = (keys: string[], byDay: Map<string, DayStats>): DayStats[] =>
  keys.map(key => byDay.get(key) ?? blankDay(key));

const mean = (total: number, count: number): number => (count > 0 ? total / count : 0);

const makeDelta = (current: number, previous: number): Delta | null => {
  if (previous <= 0) return null;
  return { current, previous, percent: ((current - previous) / previous) * 100 };
};

const streakFromDays = (days: DayStats[], todayKey: string): { current: number; longest: number } => {
  const logged = new Set(days.filter(d => d.logged).map(d => d.day));
  let cursor = todayKey;
  // A streak survives until the end of today; yesterday keeps it alive if today is still open.
  if (!logged.has(cursor)) cursor = shiftDayKey(cursor, -1);
  let current = 0;
  while (logged.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.logged ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return { current, longest };
};

const timeBucket = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
};

/**
 * Compute every statistic locally from existing entries.
 * Days without entries are *missing*, never zero-calorie days: they are
 * excluded from nutritional averages. The current logical day is also
 * excluded from daily averages because it is still in progress.
 */
export const computeStats = (
  entries: FoodEntry[],
  targets: MacroTargets,
  dayStartHour: number,
  period: Period,
  now: number = Date.now(),
): StatsSummary => {
  const byDay = groupByDay(entries, dayStartHour);
  const todayKey = getLogicalDayString(now, dayStartHour);
  const allKeys = [...byDay.keys()].sort();
  const days = daysFromKeys(keysForPeriod(period, now, dayStartHour, allKeys[0]), byDay);
  const previousDays = daysFromKeys(previousKeys(period, now, dayStartHour), byDay);

  const loggedDays = days.filter(d => d.logged);
  // Today is incomplete: keep it in charts/heatmap/streaks, exclude from averages.
  const completeDays = loggedDays.filter(d => d.day !== todayKey);
  const activeDays = loggedDays.length;
  const completeActiveDays = completeDays.length;
  const totalEntries = loggedDays.reduce((sum, d) => sum + d.count, 0);

  const sumOf = (list: DayStats[], key: 'calories' | 'protein' | 'carbs' | 'fat') =>
    list.reduce((sum, d) => sum + d[key], 0);

  const avgCalories = mean(sumOf(completeDays, 'calories'), completeActiveDays);
  const avgProtein = mean(sumOf(completeDays, 'protein'), completeActiveDays);
  const avgCarbs = mean(sumOf(completeDays, 'carbs'), completeActiveDays);
  const avgFat = mean(sumOf(completeDays, 'fat'), completeActiveDays);

  const prevLogged = previousDays.filter(d => d.logged);
  const prevCount = prevLogged.length;
  const prevAvg = (key: 'calories' | 'protein' | 'carbs' | 'fat') => mean(sumOf(prevLogged, key), prevCount);
  const prevEntries = prevLogged.reduce((sum, d) => sum + d.count, 0);

  // Calorie analytics: only complete, logged days count toward the target rate.
  const withinTarget = completeDays.filter(d => d.calories <= targets.calories);
  const ranked = [...completeDays].sort((a, b) => b.calories - a.calories);
  const streaks = streakFromDays(days, todayKey);
  // Macro distribution from average daily macro calories (4/4/9 kcal per gram).
  const macroKcal = [
    { key: 'protein', label: 'Protein', grams: avgProtein, kcal: avgProtein * 4, color: '#78952D' },
    { key: 'carbs', label: 'Carbs', grams: avgCarbs, kcal: avgCarbs * 4, color: '#A9C448' },
    { key: 'fat', label: 'Fats', grams: avgFat, kcal: avgFat * 9, color: '#243F83' },
  ];
  const macroKcalTotal = macroKcal.reduce((sum, m) => sum + m.kcal, 0);
  const distribution = macroKcal.map(m => ({
    key: m.key, label: m.label, grams: m.grams,
    share: macroKcalTotal > 0 ? (m.kcal / macroKcalTotal) * 100 : 0,
    color: m.color,
  }));

  // Eating patterns use the exact logged descriptions — no invented categories.
  const descriptionMap = new Map<string, { label: string; count: number; calories: number; latest: number }>();
  const buckets = new Map<string, number>();
  let weekdayCalories = 0;
  let weekdayCount = 0;
  let weekendCalories = 0;
  let weekendCount = 0;
  let allEntryCalories = 0;
  for (const day of days) {
    const weekday = new Date(day.day + 'T12:00:00').getDay();
    if (day.logged && day.day !== todayKey) {
      if (weekday === 0 || weekday === 6) { weekendCalories += day.calories; weekendCount += 1; }
      else { weekdayCalories += day.calories; weekdayCount += 1; }
    }
    for (const entry of day.entries) {
      allEntryCalories += entry.calories || 0;
      const label = (entry.description || '').trim().replace(/\s+/g, ' ');
      if (label) {
        const key = label.toLowerCase();
        const existing = descriptionMap.get(key);
        if (existing) {
          existing.count += 1;
          existing.calories += entry.calories || 0;
          if (entry.timestamp >= existing.latest) { existing.latest = entry.timestamp; existing.label = label; }
        } else {
          descriptionMap.set(key, { label, count: 1, calories: entry.calories || 0, latest: entry.timestamp });
        }
      }
      const bucket = timeBucket(new Date(entry.timestamp).getHours());
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
  }
  const frequent = [...descriptionMap.values()]
    .sort((a, b) => b.count - a.count || b.latest - a.latest)
    .slice(0, 6)
    .map(item => ({ label: item.label, count: item.count, avgCalories: item.calories / item.count }));
  const bucketOrder = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const timeOfDay = bucketOrder.map(label => ({
    label,
    count: buckets.get(label) ?? 0,
    percent: totalEntries > 0 ? ((buckets.get(label) ?? 0) / totalEntries) * 100 : 0,
  }));

  return {
    period,
    days,
    todayKey,
    overview: {
      avgCalories, avgProtein, avgCarbs, avgFat,
      totalMeals: totalEntries,
      activeDays,
      deltas: {
        avgCalories: makeDelta(avgCalories, prevAvg('calories')),
        avgProtein: makeDelta(avgProtein, prevAvg('protein')),
        avgCarbs: makeDelta(avgCarbs, prevAvg('carbs')),
        avgFat: makeDelta(avgFat, prevAvg('fat')),
        totalMeals: makeDelta(totalEntries, prevEntries),
        activeDays: makeDelta(activeDays, prevCount),
      },
    },
    calories: {
      target: targets.calories,
      avg: avgCalories,
      highest: ranked[0] ?? null,
      lowest: ranked.length > 1 ? ranked[ranked.length - 1] : null,
      withinTargetDays: withinTarget.length,
      withinTargetPercent: completeActiveDays > 0 ? (withinTarget.length / completeActiveDays) * 100 : 0,
      series: days,
    },
    macros: {
      avg: { protein: avgProtein, carbs: avgCarbs, fat: avgFat },
      completion: {
        protein: targets.protein > 0 ? (avgProtein / targets.protein) * 100 : 0,
        carbs: targets.carbs > 0 ? (avgCarbs / targets.carbs) * 100 : 0,
        fat: targets.fat > 0 ? (avgFat / targets.fat) * 100 : 0,
      },
      distribution,
      series: days,
    },
    consistency: {
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      activeDays,
      avgEntriesPerDay: mean(totalEntries, activeDays),
      // All-time heatmaps are capped in the view for readability; stats remain all-time.
      heatmap: days,
    },
    patterns: {
      frequent,
      avgCaloriesPerEntry: mean(allEntryCalories, totalEntries),
      timeOfDay,
      weekday: { avgCalories: mean(weekdayCalories, weekdayCount), days: weekdayCount },
      weekend: { avgCalories: mean(weekendCalories, weekendCount), days: weekendCount },
    },
  };
};
