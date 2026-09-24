import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postgres from 'postgres';
import { testConsentPostgres } from '../test-consent-postgres.mjs';

// This runner accepts no database URL and reads no environment files.
const require = createRequire(import.meta.url);
const binaryModule = new URL('./binary.js', pathToFileURL(require.resolve('embedded-postgres')));
const bin = await (await import(binaryModule.href)).default();
const root = fileURLToPath(new URL('../../', import.meta.url));
const testRoot = path.join(root, '.consent-test-data');
await mkdir(testRoot, { recursive: true });
const dir = await mkdtemp(path.join(testRoot, 'postgres-'));
const portProbe = net.createServer();
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));

const run = async (exe, args) => {
  const child = spawn(exe, args, { windowsHide: true, stdio: 'pipe' });
  let log = '';
  child.stdout.on('data', b => { log = (log + b).slice(-16000); });
  child.stderr.on('data', b => { log = (log + b).slice(-16000); });
  const [code] = await once(child, 'exit');
  if (code) throw new Error(log);
};
await run(bin.initdb, ['-D', dir, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C']);
const server = spawn(bin.postgres, ['-D', dir, '-p', String(port), '-h', '127.0.0.1'], { windowsHide: true, stdio: 'pipe' });
server.stdout.resume(); server.stderr.resume();
const sql = postgres({ host: '127.0.0.1', port, username: 'postgres', database: 'postgres', max: 4, onnotice: () => {} });
try {
  for (let i = 0; i < 50; i++) {
    try { await sql`select 1`; break; }
    catch (e) { if (i === 49) throw e; await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  // Abort before any DDL if something else won the race for this local port.
  const [location] = await sql`show data_directory`;
  assert.equal(path.resolve(location.data_directory).toLowerCase(), path.resolve(dir).toLowerCase());
  const files = [
    'supabase/test/consent-bootstrap.sql',
    'supabase/migrations/20260920223354_fd80c9a2-60db-4b1c-9c60-978ac1ad40b1.sql',
    'supabase/migrations/20260921160205_18115f60-a987-42e3-8f51-fd2b0f8efc64.sql',
    'supabase/migrations/20260921161247_aa58477f-0a1e-4c3d-9102-85bcd614c8be.sql',
    'supabase/migrations/20260922084232_a2f426cb-ace2-4748-a5b0-6fd73c322224.sql',
    'scripts/migrations-pending/2026-09-23-atomic-consent.sql',
    // Applying the additive repair a second time must be harmless.
    'scripts/migrations-pending/2026-09-23-atomic-consent.sql',
  ];
  const connection = await sql.reserve();
  try {
    for (const file of files) await connection.unsafe(await readFile(path.join(root, file), 'utf8'));
  } finally { connection.release(); }
  const [version] = await sql`select version()`;
  const results = await testConsentPostgres(sql);
  await writeFile(path.join(testRoot, 'results.json'), JSON.stringify({ engine: version.version, results }, null, 2));
  if (results.some(r => !r.passed)) process.exitCode = 1;
} finally {
  await sql.end();
  const stopped = server.exitCode === null ? once(server, 'exit') : Promise.resolve();
  if (server.exitCode === null) await run(bin.pg_ctl, ['-D', dir, '-m', 'fast', 'stop']);
  await stopped;
}
