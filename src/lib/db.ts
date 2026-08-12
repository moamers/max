import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "max.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  var __maxDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      income REAL,
      source TEXT NOT NULL DEFAULT 'sheet',
      source_filename TEXT,
      source_sheet_name TEXT,
      sheet_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(label)
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
      section TEXT NOT NULL,
      week_number INTEGER,
      description TEXT,
      note TEXT,
      amount REAL NOT NULL,
      tag TEXT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
      section TEXT NOT NULL,
      week_number INTEGER,
      budgeted_amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS period_summaries (
      period_id INTEGER PRIMARY KEY REFERENCES periods(id) ON DELETE CASCADE,
      total_fixed REAL,
      total_variable REAL,
      total_weekly REAL,
      income REAL,
      final_position REAL
    );

    CREATE INDEX IF NOT EXISTS idx_line_items_period ON line_items(period_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_id);
  `);

  const periodColumns = db.prepare(`PRAGMA table_info(periods)`).all() as { name: string }[];
  if (!periodColumns.some((c) => c.name === "sheet_order")) {
    db.exec(`ALTER TABLE periods ADD COLUMN sheet_order INTEGER NOT NULL DEFAULT 0`);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__maxDb) {
    globalThis.__maxDb = createDb();
  }
  return globalThis.__maxDb;
}
