import Database from '@tauri-apps/plugin-sql';
import type { FoodEntry, Settings, MacroTargets } from '../types';
import { supabase } from './supabaseClient';

const DB_URL = 'sqlite:spoons-and-forks.db';

let _db: Database | null = null;
let _dbLock: Promise<void> = Promise.resolve();

function withDbLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = _dbLock.then(fn, fn);
  _dbLock = run.then(() => {}, () => {});
  return run;
}

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
  accentColor: '#5865F2',
  bgColor: '#202225',
  cardColor: '#2f3136',
  fontColor: '#dcddde',
  dayStartHour: 5,
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash',
  targets: { calories: 2500, protein: 150, carbs: 300, fat: 80 },
  useSystemTheme: false,
};

export async function loadSettings(): Promise<Settings> {
  return withDbLock(async () => {
    const db = await getDb();
    const rows = await db.select<{ key: string; value: string }[]>(
      `SELECT key, value FROM settings`
    );
    if (rows.length === 0) {
      await saveSettingsRaw(db, SETTINGS_DEFAULTS);
      return SETTINGS_DEFAULTS;
    }
    const obj: Record<string, unknown> = {};
    for (const { key, value } of rows) {
      try { obj[key] = JSON.parse(value); } catch {}
    }
    return {
      ...SETTINGS_DEFAULTS,
      ...obj,
      targets: { ...SETTINGS_DEFAULTS.targets, ...(obj.targets as Partial<MacroTargets> | undefined) },
    } as Settings;
  });
}

async function saveSettingsRaw(db: Database, s: Settings): Promise<void> {
  const pairs: [string, unknown][] = [
    ['accentColor', s.accentColor],
    ['bgColor', s.bgColor],
    ['cardColor', s.cardColor],
    ['fontColor', s.fontColor],
    ['dayStartHour', s.dayStartHour],
    ['geminiApiKey', s.geminiApiKey],
    ['targets', s.targets],
  ];
  for (const [k, v] of pairs) {
    await db.execute(
      `INSERT INTO settings(key,value) VALUES($1,$2)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      [k, JSON.stringify(v)]
    );
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await withDbLock(async () => {
    const db = await getDb();
    await saveSettingsRaw(db, s);
  });
  await pushSettingsToSupabase(s);
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
  return withDbLock(async () => {
    const db = await getDb();
    const rows = await db.select<EntryRow[]>(
      `SELECT id, timestamp, description, calories, protein, carbs, fat
       FROM entries ORDER BY timestamp DESC`
    );
    return rows.map(rowToEntry);
  });
}

export async function testSupabaseConnection(): Promise<string> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) return `AUTH ERROR: ${authErr.message}`;
    if (!user) return 'NOT SIGNED IN';

    const { data, error } = await supabase.from('entries').select('id').limit(1);
    if (error) return `TABLE ERROR: ${error.message} (code: ${error.code})`;
    return `OK — user: ${user.email}, rows: ${data?.length ?? 0}`;
  } catch (e) {
    return `NETWORK ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function pushLocalToSupabase(): Promise<{ pushed: number; errors: string[] }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { pushed: 0, errors: [] };

    const local = await loadEntries();
    const localIds = new Set(local.map(e => e.id));

    const rows = local.map(e => ({
      id: e.id,
      user_id: user.id,
      timestamp: e.timestamp,
      description: e.description,
      calories: Number(e.calories),
      protein: Number(e.protein),
      carbs: Number(e.carbs),
      fat: Number(e.fat),
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('entries').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.warn('[sync] pushLocalToSupabase batch failed:', error.message);
        const errors: string[] = [];
        let pushed = 0;
        for (const row of rows) {
          const { error: singleErr } = await supabase.from('entries').upsert(row, { onConflict: 'id' });
          if (singleErr) {
            errors.push(`${row.description}: ${singleErr.message}`);
          } else {
            pushed++;
          }
        }
        return { pushed, errors };
      }
    }

    const { data: remote, error: fetchErr } = await supabase
      .from('entries').select('id').eq('user_id', user.id);
    if (!fetchErr && remote) {
      for (const r of remote) {
        if (!localIds.has(r.id)) {
          await supabase.from('entries').delete().eq('id', r.id);
        }
      }
    }

    return { pushed: rows.length, errors: [] };
  } catch (e) {
    console.warn('[sync] pushLocalToSupabase failed:', e);
    return { pushed: 0, errors: [e instanceof Error ? e.message : String(e)] };
  }
}

export async function syncToSupabase(entry: FoodEntry, action: 'insert' | 'update' | 'delete') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[sync] Not signed in, skipping sync');
      return;
    }

    if (action === 'delete') {
      const { data, error } = await supabase.from('entries').delete()
        .eq('id', entry.id)
        .select();
      if (error) {
        console.warn('[sync] Supabase delete failed:', error.message, error.code);
      } else {
        console.log(`[sync] Supabase delete OK: ${data?.length ?? 0} row(s) removed for id=${entry.id}`);
      }
    } else {
      const { error } = await supabase.from('entries').upsert({
        ...entry,
        user_id: user.id,
      }, { onConflict: 'id' });
      if (error) console.warn('[sync] Supabase upsert failed:', error.message, error.code);
    }
  } catch (e) {
    console.warn('[sync] Supabase sync failed (local save unaffected):', e);
  }
}

export async function insertEntry(e: FoodEntry): Promise<void> {
  await withDbLock(async () => {
    const db = await getDb();
    await db.execute(
      `INSERT INTO entries(id,timestamp,description,calories,protein,carbs,fat)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [e.id, e.timestamp, e.description, e.calories, e.protein, e.carbs, e.fat]
    );
  });
  await syncToSupabase(e, 'insert');
}

export async function deleteEntryById(id: string): Promise<void> {
  let entry: EntryRow[] = [];
  await withDbLock(async () => {
    const db = await getDb();
    entry = await db.select<EntryRow[]>(`SELECT * FROM entries WHERE id = $1`, [id]);
    await db.execute(`DELETE FROM entries WHERE id = $1`, [id]);
  });
  if (entry.length > 0) await syncToSupabase(rowToEntry(entry[0]), 'delete');
}

export async function updateEntryById(id: string, patch: Partial<FoodEntry>): Promise<void> {
  let entry: EntryRow[] = [];
  await withDbLock(async () => {
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
    entry = await db.select<EntryRow[]>(`SELECT * FROM entries WHERE id = $1`, [id]);
  });
  if (entry.length > 0) await syncToSupabase(rowToEntry(entry[0]), 'update');
}

export async function pullFromSupabase(): Promise<{ pulled: number; deleted: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { pulled: 0, deleted: 0 };

    const { data: remote, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id);

    if (error || !remote) return { pulled: 0, deleted: 0 };

    return await withDbLock(async () => {
      const db = await getDb();
      const remoteIds = new Set<string>(remote.map(r => r.id));
      let pulled = 0;
      let deleted = 0;

      for (const r of remote) {
        const result = await db.execute(
          `INSERT OR REPLACE INTO entries(id,timestamp,description,calories,protein,carbs,fat)
           VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [r.id, r.timestamp, r.description, r.calories, r.protein, r.carbs, r.fat]
        );
        if (result.rowsAffected > 0) pulled++;
      }

      const local = await db.select<EntryRow[]>('SELECT id FROM entries');
      for (const l of local) {
        if (!remoteIds.has(l.id)) {
          await db.execute('DELETE FROM entries WHERE id = $1', [l.id]);
          deleted++;
        }
      }

      return { pulled, deleted };
    });
  } catch (e) {
    console.warn('[sync] Supabase pull failed:', e);
    return { pulled: 0, deleted: 0 };
  }
}

export async function pushSettingsToSupabase(s: Settings): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[sync] Not signed in, skipping settings push');
      return;
    }
    const { accentColor, bgColor, cardColor, fontColor, ...syncable } = s;
    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      settings: syncable,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) console.warn('[sync] Settings push failed:', error.message, error.code);
    else console.log('[sync] Settings pushed to Supabase');
  } catch (e) {
    console.warn('[sync] Settings push failed:', e);
  }
}

export async function pullSettingsFromSupabase(): Promise<Settings | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.warn('[sync] Settings pull failed:', error.message, error.code);
      return null;
    }
    if (!data) return null;
    console.log('[sync] Settings pulled from Supabase:', data.settings);
    return data.settings as Settings;
  } catch (e) {
    console.warn('[sync] Settings pull failed:', e);
    return null;
  }
}

export async function importFromLocalStorage(): Promise<boolean> {
  let imported = false;
  const oldEntries = localStorage.getItem('nutrack-log');
  if (oldEntries) {
    try {
      const parsed = JSON.parse(oldEntries) as FoodEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        await withDbLock(async () => {
          const db = await getDb();
          for (const e of parsed) {
            await db.execute(
              `INSERT OR IGNORE INTO entries(id,timestamp,description,calories,protein,carbs,fat)
               VALUES($1,$2,$3,$4,$5,$6,$7)`,
              [e.id, e.timestamp, e.description, e.calories, e.protein, e.carbs, e.fat]
            );
          }
        });
        imported = true;
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
