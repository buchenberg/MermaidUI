import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'mermaid-ui.db');

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Diagram {
  id: number;
  collection_id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

let db: sqlite3.Database | null = null;

export function getDb(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables
      db!.serialize(() => {
        db!.run(`
          CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
        });

        db!.run(`
          CREATE TABLE IF NOT EXISTS diagrams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) reject(err);
        });

        db!.run(`
          CREATE INDEX IF NOT EXISTS idx_diagrams_collection ON diagrams(collection_id)
        `, (err) => {
          if (err) reject(err);
        });

        // Create default collection if none exists
        db!.get('SELECT COUNT(*) as count FROM collections', (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (row.count === 0) {
            db!.run(
              'INSERT INTO collections (name, description) VALUES (?, ?)',
              ['Default Collection', 'Your default collection of diagrams'],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          } else {
            resolve();
          }
        });
      });
    });
  });
}

export function runQuery<T>(sql: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function runAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
