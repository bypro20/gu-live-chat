#!/usr/bin/env node
/** Vercel auth URL'lerini www.gulivechat.com yap (Google OAuth callback) */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const TEAM = 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const WWW = 'https://www.gulivechat.com'
const TOKEN = process.env.VERCEL_TOKEN || JSON.parse(
  readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')
).token

async function upsert(key, value) {
  const list = await fetch(`https://api.vercel.com/v9/projects/${PROJECT}/env?teamId=${TEAM}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then((r) => r.json())
  const existing = list.envs?.find((e) => e.key === key)
  if (existing) {
    await fetch(`https://api.vercel.com/v9/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    console.log('updated', key)
  } else {
    await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview', 'development'] }),
    })
    console.log('created', key)
  }
}

for (const key of ['NEXTAUTH_URL', 'AUTH_URL', 'NEXT_PUBLIC_APP_URL']) {
  await upsert(key, WWW)
}
console.log('✅ Auth URLs →', WWW)
