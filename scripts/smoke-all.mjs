#!/usr/bin/env node
/** Tüm production smoke testleri — tek komut */
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const steps = [
  ['Health', 'node', ['-e', `
    const checks = async () => {
      const h = await fetch('https://www.gulivechat.com/api/health').then(r=>r.json());
      if (!h.ok || !h.db) throw new Error('api/health');
      const r = await fetch('https://gu-live-chat-socket-production.up.railway.app/health').then(r=>r.json());
      if (r.status !== 'ok') throw new Error('railway health');
      const poll = await fetch('https://www.gulivechat.com/socket.io/?EIO=4&transport=polling', { headers: { Origin: 'https://www.gulivechat.com' } });
      if (poll.status === 308) throw new Error('socket.io 308 redirect');
      const body = await poll.text();
      if (!body.startsWith('0{')) throw new Error('socket.io handshake');
      console.log('✓ health + socket handshake');
    };
    checks().catch(e=>{ console.error('✗', e.message); process.exit(1); });
  `]],
  ['Visitor auth', 'node', ['scripts/smoke-socket-auth.mjs']],
  ['Screen pipeline', 'node', ['scripts/smoke-screen-monitoring.mjs']],
]

let failed = 0
for (const [label, cmd, args] of steps) {
  process.stdout.write(`\n— ${label}…\n`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: root })
  if (r.status !== 0) failed++
}

if (failed) {
  console.error(`\n✗ ${failed} test grubu başarısız\n`)
  process.exit(1)
}
console.log('\n✅ Tüm production kontrolleri geçti.\n')
