/**
 * Quick Turso connectivity test.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/test-turso.mjs
 */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) { console.error('❌  TURSO_DATABASE_URL not set'); process.exit(1); }
if (!authToken) { console.error('❌  TURSO_AUTH_TOKEN not set'); process.exit(1); }

console.log('🔗  Connecting to:', url);
console.log('🔑  Auth token starts with:', authToken.slice(0, 12) + '…');

const db = createClient({ url, authToken });

try {
  // 1. Basic ping
  const ping = await db.execute('SELECT 1 AS ok');
  console.log('✅  Ping OK:', ping.rows);

  // 2. List tables
  const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
  console.log('📋  Tables:', tables.rows.map(r => r.name));

  // 3. Count rows in each known table (if they exist)
  const knownTables = ['attempts', 'rag_chunks', 'rag_questions'];
  for (const t of knownTables) {
    const exists = tables.rows.some(r => r.name === t);
    if (exists) {
      const cnt = await db.execute(`SELECT COUNT(*) as c FROM ${t}`);
      console.log(`  ${t}: ${cnt.rows[0].c} rows`);
    } else {
      console.log(`  ${t}: (table does not exist yet)`);
    }
  }

  console.log('\n✅  All checks passed — DB is reachable and responsive.');
} catch (err) {
  console.error('❌  Error:', err.message);
  process.exit(1);
}
