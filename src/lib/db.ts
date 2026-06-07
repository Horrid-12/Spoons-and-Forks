import Database from '@tauri-apps/plugin-sql';
import type { FoodEntry, Settings, MacroTargets } from '../types';

const DB_URL = 'sqlite:spoons-and-forks.db';

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load(DB_URL);
  await migrate(_db);
  return _db;
}

async function migrate(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS entries (
      id          TEXT PRIMARY KEY,
      timestamp   INTEGER NOT NULL,
      description TEXT NOT NULL,
      calories    REAL NOT NULL,
      protein     REAL NOT NULL,
      carbs       REAL NOT NULL,
      fat         REAL NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_entries_ts ON entries(timestamp)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

const SETTINGS_DEFAULTS: Settings = {
  accentColor: '#34d399',
  bgColor: '#09090b',
  cardColor: '#18181b',
  fontColor: '#d4d4d8',
  dayStartHour: 5,
  geminiApiKey: '',
  targets: { calories: 2500, protein: 150, carbs: 300, fat: 80 },
};

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    `SELECT key, value FROM settings`
  );
  if (rows.length === 0) {
    await saveSettings(SETTINGS_DEFAULTS);
    return SETTINGS_DEFAULTS;
  }
  const obj: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    try { obj[key] = JSON.parse(value); } catch { /* skip malformed */ }
  }
  return {
    ...SETTINGS_DEFAULTS,
    ...obj,
    targets: { ...SETTINGS_DEFAULTS.targets, ...(obj.targets as Partial<MacroTargets> | undefined) },
  } as Settings;
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDb();
  const pairs: [string, unknown][] = [
    ['accentColor', s.accentColor],
    ['bgColor', s.bgColor],
    ['cardColor', s.cardColor],
    ['fontColor', s.fontColor],
    ['dayStartHour', s.dayStartHour],
    ['geminiApiKey', s.geminiApiKey],
    ['targets', s.targets],
  ];
  await db.execute('BEGIN');
  try {
    for (const [k, v] of pairs) {
      await db.execute(
        `INSERT INTO settings(key,value) VALUES($1,$2)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
        [k, JSON.stringify(v)]
      );
    }
    await db.execute('COMMIT');
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }
}

interface EntryRow {
  id: string;
  timestamp: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function rowToEntry(r: EntryRow): FoodEntry {
  return {
    id: r.id,
    timestamp: Number(r.timestamp),
    description: r.description,
    calories: Number(r.calories),
    protein: Number(r.protein),
    carbs: Number(r.carbs),
    fat: Number(r.fat),
  };
}

export async function loadEntries(): Promise<FoodEntry[]> {
  const db = await getDb();
  const rows = await db.select<EntryRow[]>(
    `SELECT id, timestamp, description, calories, protein, carbs, fat
     FROM entries ORDER BY timestamp DESC`
  );
  return rows.map(rowToEntry);
}

export async function insertEntry(e: FoodEntry): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO entries(id,timestamp,description,calories,protein,carbs,fat)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [e.id, e.timestamp, e.description, e.calories, e.protein, e.carbs, e.fat]
  );
}

export async function deleteEntryById(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM entries WHERE id = $1`, [id]);
}

export async function updateEntryById(id: string, patch: Partial<FoodEntry>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const k of ['description', 'calories', 'protein', 'carbs', 'fat'] as const) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = $${i++}`);
      values.push(patch[k]);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(
    `UPDATE entries SET ${fields.join(', ')} WHERE id = $${i}`,
    values
  );
}

export async function importFromLocalStorage(): Promise<boolean> {
  let imported = false;
  const oldEntries = localStorage.getItem('nutrack-log');
  if (oldEntries) {
    try {
      const parsed = JSON.parse(oldEntries) as FoodEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const db = await getDb();
        await db.execute('BEGIN');
        try {
          for (const e of parsed) {
            await db.execute(
              `INSERT OR IGNORE INTO entries(id,timestamp,description,calories,protein,carbs,fat)
               VALUES($1,$2,$3,$4,$5,$6,$7)`,
              [e.id, e.timestamp, e.description, e.calories, e.protein, e.carbs, e.fat]
            );
          }
          await db.execute('COMMIT');
          imported = true;
        } catch (e) {
          await db.execute('ROLLBACK');
          throw e;
        }
      }
    } catch (e) {
      console.error('Failed to import entries from localStorage', e);
    }
    localStorage.removeItem('nutrack-log');
  }

  const oldSettings = localStorage.getItem('spoons-and-forks-settings');
  if (oldSettings) {
    try {
      const parsed = JSON.parse(oldSettings) as Partial<Settings>;
      const current = await loadSettings();
      await saveSettings({ ...current, ...parsed, targets: { ...current.targets, ...(parsed.targets ?? {}) } });
      imported = true;
    } catch (e) {
      console.error('Failed to import settings from localStorage', e);
    }
    localStorage.removeItem('spoons-and-forks-settings');
  }
  return imported;
}
