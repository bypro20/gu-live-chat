#!/usr/bin/env node
/** Mixkit/Pexels stok videoları indir (tarayıcı ile). */
import { chromium } from 'playwright'
import { mkdirSync, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, 'stock')
mkdirSync(OUT, { recursive: true })

const CLIPS = [
  { name: '01-businessman-phone.mp4', page: 'https://mixkit.co/free-stock-video/well-dressed-businessman-sending-messages-on-his-cell-phone-4805/' },
  { name: '02-whatsapp-man.mp4', page: 'https://mixkit.co/free-stock-video/man-answering-a-whatsapp-41165/' },
  { name: '03-programmer-phone.mp4', page: 'https://mixkit.co/free-stock-video/programmer-using-his-cell-phone-while-programming-at-his-desk-41638/' },
  { name: '04-office-texting.mp4', page: 'https://mixkit.co/free-stock-video/hands-shown-texting-on-a-smartphone-144/' },
  { name: '05-working-phone.mp4', page: 'https://mixkit.co/free-stock-video/person-working-while-scrolling-on-social-networks-4908/' },
  { name: '06-woman-whatsapp.mp4', page: 'https://mixkit.co/free-stock-video/woman-sending-messages-on-whatsapp-zoom-shot-51123/' },
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://mixkit.co/' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const f = createWriteStream(dest)
      res.pipe(f)
      f.on('finish', () => f.close(() => resolve(dest)))
    }).on('error', reject)
  })
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ acceptDownloads: true })
const page = await ctx.newPage()

for (const clip of CLIPS) {
  const dest = join(OUT, clip.name)
  try {
    await page.goto(clip.page, { waitUntil: 'networkidle', timeout: 90000 })
    const href = await page.evaluate(() => {
      const a = document.querySelector('a[href*="assets.mixkit.co/videos/download"]')
      return a?.href || document.querySelector('video source')?.src || document.querySelector('video')?.src
    })
    if (!href) throw new Error('download link not found')
    console.log('⬇️ ', clip.name, href.slice(0, 80))
    await download(href, dest)
    console.log('✅', dest)
  } catch (e) {
    console.error('❌', clip.name, e.message)
  }
}

await browser.close()
console.log('Done')
