#!/usr/bin/env node
/** gulivechat.com mobil görünüm — reklam için gerçek site ekran görüntüsü */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, 'assets')
mkdirSync(OUT, { recursive: true })

const BASE = process.env.GULIVECHAT_URL || 'https://www.gulivechat.com'

async function shot(page, name, path, opts = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(opts.wait ?? 2500)
  if (opts.scroll) await page.evaluate((y) => window.scrollTo(0, y), opts.scroll)
  if (opts.waitAfterScroll) await page.waitForTimeout(opts.waitAfterScroll)
  await page.screenshot({ path: join(OUT, name), fullPage: false })
  console.log('📸', name)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  locale: 'tr-TR',
})
const page = await ctx.newPage()

try {
  await shot(page, 'home-hero.png', '/')
  await shot(page, 'home-pricing.png', '/', { scroll: 2200, waitAfterScroll: 1500 })
  await shot(page, 'features.png', '/ozellikler', { wait: 3000 })
} finally {
  await browser.close()
}

console.log('✅ Görseller:', OUT)
