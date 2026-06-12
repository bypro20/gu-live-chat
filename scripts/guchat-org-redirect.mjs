#!/usr/bin/env node
/** guchat.org → www.gulivechat.com redirect (eski bookmark / OAuth) */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const TEAM = 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const OLD = 'guchat.org'
const TARGET = 'www.gulivechat.com'

const TOKEN = process.env.VERCEL_TOKEN || JSON.parse(
  readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')
).token

async function api(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  const add = await api(`/v10/projects/${PROJECT}/domains?teamId=${TEAM}`, {
    method: 'POST',
    body: JSON.stringify({ name: OLD }),
  })
  console.log('Add domain:', add.status, JSON.stringify(add.data).slice(0, 120))

  const patch = await api(`/v10/projects/${PROJECT}/domains/${OLD}?teamId=${TEAM}`, {
    method: 'PATCH',
    body: JSON.stringify({ redirect: TARGET, redirectStatusCode: 308 }),
  })
  console.log('Redirect →', TARGET, ':', patch.status, JSON.stringify(patch.data).slice(0, 120))
}

main().catch(console.error)
