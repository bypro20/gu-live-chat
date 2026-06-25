/**
 * GitHub master ref'inden production deploy — yerel dosya yüklemez.
 * Untracked klasörler (pion-ai vb.) build'i bozmaz.
 */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_5gbzCiGoSSKTC6ONZjWLZigV'
export const VERCEL_PROJECT_ID =
  process.env.VERCEL_PROJECT_ID || 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
export const VERCEL_GITHUB_REPO_ID = Number(process.env.VERCEL_GITHUB_REPO_ID || 1260043940)
export const VERCEL_GIT_REF = process.env.VERCEL_GIT_REF || 'master'

export function loadVercelToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  try {
    const auth = JSON.parse(
      readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')
    )
    return auth.token
  } catch {
    throw new Error('VERCEL_TOKEN bulunamadı (env veya vercel login)')
  }
}

export async function vercelApi(token, path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  return data
}

/** Vercel Git entegrasyonu üzerinden production deploy tetikler. */
export async function triggerGitProductionDeploy(options = {}) {
  const token = options.token || loadVercelToken()
  const ref = options.ref || VERCEL_GIT_REF
  const teamId = options.teamId || VERCEL_TEAM_ID
  const project = options.projectId || VERCEL_PROJECT_ID

  const deployment = await vercelApi(token, `/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'gu-live-chat',
      project,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: VERCEL_GITHUB_REPO_ID,
        ref,
      },
    }),
  })

  return deployment
}

export async function waitForDeployment(token, deploymentId, options = {}) {
  const teamId = options.teamId || VERCEL_TEAM_ID
  const timeoutMs = options.timeoutMs || 10 * 60 * 1000
  const pollMs = options.pollMs || 8000
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const dep = await vercelApi(
      token,
      `/v13/deployments/${deploymentId}?teamId=${teamId}`
    )
    const state = dep.readyState || dep.state
    if (state === 'READY') return dep
    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`Deploy ${state}: ${dep.url || deploymentId}`)
    }
    await new Promise((r) => setTimeout(r, pollMs))
  }

  throw new Error(`Deploy zaman aşımı: ${deploymentId}`)
}
