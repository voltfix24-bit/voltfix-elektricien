// Wegwerp-PostgreSQL + PostgREST voor de echte route-test van de formuliertest.
// Leest geen .env en accepteert geen database-URL: alles draait op 127.0.0.1.
// Gebruik: node scripts/form-test-db/run.mjs <pad-naar-postgrest-binary>
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const postgrestBin = process.argv[2]
if (!postgrestBin) throw new Error('Pad naar postgrest ontbreekt')
const root = fileURLToPath(new URL('../../', import.meta.url))
const freePort = () => new Promise((resolve) => {
  const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)) })
})
const run = async (exe, args) => {
  const c = spawn(exe, args, { stdio: 'pipe' }); let log = ''
  c.stdout.on('data', (b) => (log += b)); c.stderr.on('data', (b) => (log += b))
  const [code] = await once(c, 'exit'); if (code) throw new Error(log)
}

const dir = await mkdtemp(path.join(os.tmpdir(), 'vf-formtest-pg-'))
// PostgreSQL weigert als root te draaien: dan onder een los, onbevoegd uid.
const asUser = process.getuid?.() === 0
const pgCmd = (exe, args) => (asUser ? ['setpriv', ['--reuid=70001', '--regid=70001', '--clear-groups', exe, ...args]] : [exe, args])
if (asUser) await run('chown', ['70001:70001', dir])
const pgPort = await freePort()
await run(...pgCmd('initdb', ['-D', dir, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C']))
const pg = spawn(...pgCmd('postgres', ['-D', dir, '-p', String(pgPort), '-h', '127.0.0.1', '-k', dir]), { stdio: 'ignore' })
const sql = postgres({ host: '127.0.0.1', port: pgPort, username: 'postgres', database: 'postgres', max: 2, onnotice: () => {} })
let rest, proxy
try {
  for (let i = 0; i < 80; i++) { try { await sql`select 1`; break } catch (e) { if (i === 79) throw e; await new Promise((r) => setTimeout(r, 100)) } }
  const files = [
    'supabase/test/consent-bootstrap.sql',
    'supabase/migrations/20260920223354_fd80c9a2-60db-4b1c-9c60-978ac1ad40b1.sql',
    'supabase/migrations/20260921160205_18115f60-a987-42e3-8f51-fd2b0f8efc64.sql',
    'supabase/migrations/20260921161247_aa58477f-0a1e-4c3d-9102-85bcd614c8be.sql',
    'supabase/migrations/20260922084232_a2f426cb-ace2-4748-a5b0-6fd73c322224.sql',
    'scripts/migrations-pending/2026-09-23-atomic-consent.sql',
    'supabase/test/quote-request-columns.sql',
    'supabase/test/form-test-route-bootstrap.sql',
    // Het voorbereide script, twee keer: herhalen moet onschadelijk zijn.
    'scripts/migrations-pending/2026-09-24-form-test-links.sql',
    'scripts/migrations-pending/2026-09-24-form-test-links.sql',
  ]
  const conn = await sql.reserve()
  try { for (const f of files) { await conn.unsafe(await readFile(path.join(root, f), 'utf8')) ; console.log('toegepast', f) } }
  finally { conn.release() }

  const secret = crypto.randomBytes(32).toString('hex')
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const head = b64({ alg: 'HS256', typ: 'JWT' }), body = b64({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 3600 })
  const key = `${head}.${body}.${crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`

  const restPort = await freePort()
  const conf = path.join(dir, 'postgrest.conf')
  await writeFile(conf, [
    `db-uri = "postgres://authenticator@127.0.0.1:${pgPort}/postgres?sslmode=disable"`,
    `db-schemas = "public"`, `db-anon-role = "anon"`, `jwt-secret = "${secret}"`,
    `server-host = "127.0.0.1"`, `server-port = ${restPort}`, `db-pool = 20`,
  ].join('\n'))
  rest = spawn(postgrestBin, [conf], { stdio: 'pipe' })
  let restLog = ''; rest.stdout.on('data', (b) => (restLog += b)); rest.stderr.on('data', (b) => (restLog += b))
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${restPort}/`); if (r.ok) break } catch {}
    if (i === 79) throw new Error('PostgREST start niet\n' + restLog)
    await new Promise((r) => setTimeout(r, 150))
  }
  // Supabase-client praat met /rest/v1; PostgREST luistert op de wortel.
  const proxyPort = await freePort()
  proxy = http.createServer((req, res) => {
    const target = (req.url ?? '/').replace(/^\/rest\/v1/, '') || '/'
    const up = http.request({ host: '127.0.0.1', port: restPort, path: target, method: req.method, headers: req.headers }, (r) => {
      res.writeHead(r.statusCode ?? 500, r.headers); r.pipe(res)
    })
    up.on('error', (e) => { res.writeHead(502); res.end(String(e)) })
    req.pipe(up)
  }).listen(proxyPort, '127.0.0.1')
  await once(proxy, 'listening')

  const test = spawn('bunx', ['vitest', 'run', '--config', 'vitest.local.config.ts', 'src/lib/form-test-route.pg.test.ts'], {
    cwd: root, stdio: 'inherit',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, VF_FT_REST: `http://127.0.0.1:${proxyPort}`, VF_FT_KEY: key,
      VF_FT_PG: `postgres://postgres@127.0.0.1:${pgPort}/postgres` },
  })
  const [code] = await once(test, 'exit')
  const [v] = await sql`select version()`
  console.log('Database:', v.version)
  process.exitCode = code ?? 1
} finally {
  proxy?.close(); rest?.kill('SIGTERM')
  await sql.end()
  await run(...pgCmd('pg_ctl', ['-D', dir, '-m', 'fast', 'stop'])).catch(() => pg.kill('SIGKILL'))
}
