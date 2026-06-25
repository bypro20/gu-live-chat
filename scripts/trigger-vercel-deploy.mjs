#!/usr/bin/env node
/**
 * Production deploy — GitHub master'dan (yerel dosya yüklemez).
 *
 *   npm run deploy:prod
 *   node scripts/trigger-vercel-deploy.mjs
 *
 * Kod değişikliği varsa önce commit + push yapın; push tek başına da Vercel'i tetikler.
 * Env-only güncellemelerden sonra bu script ile redeploy edin.
 */
import { execSync } from 'child_process'
import {
  loadVercelToken,
  triggerGitProductionDeploy,
  waitForDeployment,
} from './lib/vercel-git-deploy.mjs'

function gitStatus() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    const ahead = Number(
      execSync(`git rev-list --count origin/${branch}..HEAD 2>/dev/null || echo 0`, {
        encoding: 'utf8',
      }).trim()
    )
    const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    return { branch, ahead, dirty: Boolean(dirty) }
  } catch {
    return { branch: 'master', ahead: 0, dirty: false }
  }
}

async function main() {
  const push = process.argv.includes('--push')
  const noWait = process.argv.includes('--no-wait')
  const status = gitStatus()

  if (status.dirty) {
    console.warn('⚠️  Commit edilmemiş değişiklikler var — deploy edilen kod GitHub master olacak.')
  }

  if (push && status.ahead > 0) {
    console.log(`git push origin ${status.branch} (${status.ahead} commit)...`)
    execSync(`git push origin ${status.branch}`, { stdio: 'inherit' })
    console.log('Push tamam — Vercel otomatik deploy başlatmış olabilir.')
  } else if (status.ahead > 0) {
    console.log(`ℹ️  ${status.ahead} push edilmemiş commit var. --push ile gönderebilirsiniz.`)
  }

  console.log('Vercel production deploy (GitHub master)...')
  const token = loadVercelToken()
  const dep = await triggerGitProductionDeploy({ token })
  const id = dep.id
  const url = dep.url || dep.alias?.[0] || id
  console.log('  started:', url)

  if (noWait) {
    console.log('Deploy arka planda devam ediyor (--no-wait).')
    return
  }

  console.log('  bekleniyor...')
  const ready = await waitForDeployment(token, id)
  console.log(`✅ Production hazır: ${ready.url || url}`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
