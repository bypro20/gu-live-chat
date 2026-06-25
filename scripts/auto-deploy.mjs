#!/usr/bin/env node
/**
 * Tek komut: commit → push master → Vercel production → post-deploy.
 *
 *   npm run deploy:auto -- "fix: inbox açılmıyor"
 *   npm run deploy:auto -- --no-commit "sadece push + deploy"
 */
import { execSync } from 'child_process'
import {
  loadVercelToken,
  triggerGitProductionDeploy,
  waitForDeployment,
} from './lib/vercel-git-deploy.mjs'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim()
}

function gitStatus() {
  const branch = run('git rev-parse --abbrev-ref HEAD')
  const dirty = run('git status --porcelain')
  const ahead = Number(run(`git rev-list --count origin/${branch}..HEAD 2>/dev/null || echo 0`))
  return { branch, dirty: Boolean(dirty), ahead }
}

async function main() {
  const args = process.argv.slice(2)
  const noCommit = args.includes('--no-commit')
  const noWait = args.includes('--no-wait')
  const message = args.filter((a) => !a.startsWith('--')).join(' ').trim()

  const { branch, dirty, ahead } = gitStatus()
  if (branch !== 'master') {
    throw new Error(`Production deploy yalnızca master branch'ten yapılır (şu an: ${branch})`)
  }

  if (dirty && !noCommit) {
    if (!message) {
      throw new Error('Commit mesajı gerekli: npm run deploy:auto -- "açıklama"')
    }
    console.log('Değişiklikler commit ediliyor…')
    run('git add -A')
    execSync('git commit -F -', { input: `${message}\n`, stdio: ['pipe', 'inherit', 'inherit'] })
  } else if (dirty && noCommit) {
    console.warn('⚠️  Commit edilmemiş değişiklikler var — push edilmeyecek.')
  }

  const afterCommit = gitStatus()
  if (afterCommit.ahead > 0 || dirty === false) {
    const pushAhead = Number(run(`git rev-list --count origin/master..HEAD 2>/dev/null || echo 0`))
    if (pushAhead > 0) {
      console.log(`git push origin master (${pushAhead} commit)…`)
      execSync('git push origin master', { stdio: 'inherit' })
    }
  }

  console.log('Vercel production deploy tetikleniyor…')
  const token = loadVercelToken()
  const dep = await triggerGitProductionDeploy({ token })
  console.log('  deployment:', dep.url || dep.id)

  if (noWait) {
    console.log('Deploy arka planda (--no-wait). Post-deploy için: npm run post-deploy')
    return
  }

  console.log('Deploy tamamlanması bekleniyor…')
  await waitForDeployment(token, dep.id)

  console.log('Post-deploy kontrolleri…')
  execSync('node scripts/post-deploy.mjs', { stdio: 'inherit' })
  console.log('🚀 Production güncellendi:', process.env.PRODUCTION_URL || 'https://www.gulivechat.com')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
