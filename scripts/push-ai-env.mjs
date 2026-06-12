#!/usr/bin/env node
/**
 * Yerel .env dosyasındaki AI anahtarlarını Vercel Production'a yükler.
 * Kullanım: node scripts/push-ai-env.mjs
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const ENV_FILES = ['.env', '.env.local']

const AI_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'OLLAMA_BASE_URL',
  'OLLAMA_API_KEY',
]

function parseEnvFile(path) {
  const out = {}
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (val) out[key] = val
    }
  } catch {
    /* missing file */
  }
  return out
}

const merged = {}
for (const f of ENV_FILES) {
  Object.assign(merged, parseEnvFile(resolve(ROOT, f)))
}

let pushed = 0
for (const key of AI_KEYS) {
  let val = merged[key]
  if (!val && key === 'GOOGLE_AI_API_KEY' && merged.GEMINI_API_KEY) {
    val = merged.GEMINI_API_KEY
  }
  if (!val) {
    console.log(`⏭  ${key} — yerelde yok, atlandı`)
    continue
  }
  const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'production', '--force'], {
    cwd: ROOT,
    input: val,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (res.status === 0) {
    console.log(`✓  ${key} → Vercel Production`)
    pushed++
  } else {
    console.error(`✗  ${key} — ${res.stderr || res.stdout}`)
  }
}

console.log(`\n${pushed} anahtar Vercel'e gönderildi.`)
if (pushed > 0) {
  console.log('Son adım: npx vercel --prod')
}
