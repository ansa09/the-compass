import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variable or default to root directory
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'database.sqlite');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { verbose: console.log });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    console.log(`✓ Database connected: ${DB_PATH}`);
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

export default getDb;
