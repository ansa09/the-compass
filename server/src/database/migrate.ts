import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import getDb from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('🔄 Running database migrations...\n');

  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');

  try {
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      db.exec(statement);
    }

    console.log('✅ Database migrations completed successfully!\n');
    console.log('Tables created:');
    console.log('  • users');
    console.log('  • criteria');
    console.log('  • onboarding_responses');
    console.log('  • partners');
    console.log('  • ratings');
    console.log('  • rating_scores');
    console.log('  • journal_entries\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
