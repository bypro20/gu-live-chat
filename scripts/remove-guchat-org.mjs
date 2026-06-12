#!/usr/bin/env node
/** guchat.org — Vercel projesinden domain kaldır */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const TEAM = 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const OLD_DOMAIN = 'guchat.org'

function loadToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  return JSON.parse(readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')).token
}

const TOKEN = loadToken()

async function api(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  console.log(`Removing ${OLD_DOMAIN} from project...`)
  const del = await api(
    `/v9/projects/${PROJECT}/domains/${OLD_DOMAIN}?teamId=${TEAM}`,
    { method: 'DELETE' }
  )
  console.log('DELETE project domain:', del.status, JSON.stringify(del.data).slice(0, 200))

  const delTeam = await api(`/v6/domains/${OLD_DOMAIN}?teamId=${TEAM}`, { method: 'DELETE' })
  console.log('DELETE team domain:', delTeam.status, JSON.stringify(delTeam.data).slice(0, 200))

  const { data: domains } = await api(`/v9/projects/${PROJECT}/domains?teamId=${TEAM}`)
  console.log('\nRemaining domains:')
  for (const d of domains.domains || []) {
    console.log(' ', d.name, d.verified ? '✓' : '?')
  }
}

main().catch(console.error)
