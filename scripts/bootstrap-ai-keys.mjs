#!/usr/bin/env node
/**
 * Groq + OpenRouter ücretsiz API anahtarı oluşturmayı dener (Google SSO).
 * Çıktı: .env.ai.generated (gitignore'a ekli)
 */
import { chromium } from 'playwright'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = resolve(import.meta.dirname, '../.env.ai.generated')
const keys = {}

async function tryGroq(page) {
  console.log('→ Groq console açılıyor...')
  await page.goto('https://console.groq.com/keys', { waitUntil: 'networkidle', timeout: 60000 })

  if (page.url().includes('login') || page.url().includes('sign')) {
    console.log('  Giriş gerekli — Google ile deneniyor...')
    const googleBtn = page.getByRole('button', { name: /google/i }).or(page.locator('text=/Google/i')).first()
    if (await googleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await googleBtn.click()
      await page.waitForTimeout(8000)
    }
  }

  await page.waitForTimeout(3000)
  if (!page.url().includes('console.groq.com')) {
    console.log('  Groq giriş tamamlanamadı:', page.url())
    return
  }

  const createBtn = page.getByRole('button', { name: /create api key/i }).first()
  if (await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await createBtn.click()
    await page.waitForTimeout(1000)
    const nameInput = page.locator('input[type="text"]').last()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('guchat-platform')
    }
    const confirm = page.getByRole('button', { name: /create|submit|save/i }).last()
    if (await confirm.isVisible().catch(() => false)) await confirm.click()
    await page.waitForTimeout(2000)
  }

  const body = await page.content()
  const match = body.match(/gsk_[A-Za-z0-9]{20,}/)
  if (match) {
    keys.GROQ_API_KEY = match[0]
    console.log('  ✓ Groq anahtarı alındı')
  } else {
    // Mevcut anahtar tablosundan kopyala butonu
    const copyBtn = page.locator('[data-testid="copy"], button:has-text("Copy")').first()
    if (await copyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyBtn.click()
      console.log('  (Mevcut anahtar var — panodan okuyamıyoruz)')
    } else {
      console.log('  Groq anahtarı bulunamadı — manuel oluşturun')
    }
  }
}

async function tryOpenRouter(page) {
  console.log('→ OpenRouter keys açılıyor...')
  await page.goto('https://openrouter.ai/settings/keys', { waitUntil: 'networkidle', timeout: 60000 })

  if (page.url().includes('sign') || page.url().includes('login')) {
    const googleBtn = page.getByRole('button', { name: /google/i }).or(page.locator('text=/Google/i')).first()
    if (await googleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await googleBtn.click()
      await page.waitForTimeout(8000)
    }
  }

  await page.waitForTimeout(3000)
  const createBtn = page.getByRole('button', { name: /create key|new key|generate/i }).first()
  if (await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await createBtn.click()
    await page.waitForTimeout(2000)
  }

  const body = await page.content()
  const match = body.match(/sk-or-v1-[A-Za-z0-9_-]{20,}/)
  if (match) {
    keys.OPENROUTER_API_KEY = match[0]
    console.log('  ✓ OpenRouter anahtarı alındı')
  } else {
    console.log('  OpenRouter anahtarı bulunamadı')
  }
}

async function main() {
  const userDataDir = process.env.PLAYWRIGHT_USER_DATA || `${process.env.HOME}/.config/guchat-playwright`
  console.log('Tarayıcı profili:', userDataDir)

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })

  const page = browser.pages()[0] || (await browser.newPage())

  try {
    await tryGroq(page)
    await tryOpenRouter(page)
  } finally {
    await browser.close()
  }

  if (Object.keys(keys).length === 0) {
    console.log('\nOtomatik anahtar alınamadı.')
    process.exit(1)
  }

  const lines = Object.entries(keys).map(([k, v]) => `${k}=${v}`)
  writeFileSync(OUT, lines.join('\n') + '\n')
  console.log(`\n${OUT} dosyasına yazıldı:`)
  for (const k of Object.keys(keys)) console.log(`  ${k}=***`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
