#!/usr/bin/env node
/** Gu Chat uygulama ikonları — resources/icon.png → Android mipmap */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconPath = join(root, 'resources/icon.png')
const resDir = join(root, 'android/app/src/main/res')

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

for (const [folder, size] of Object.entries(sizes)) {
  const dir = join(resDir, folder)
  await mkdir(dir, { recursive: true })
  const buf = await sharp(iconPath).resize(size, size, { fit: 'cover' }).png().toBuffer()
  await writeFile(join(dir, 'ic_launcher.png'), buf)
  await writeFile(join(dir, 'ic_launcher_round.png'), buf)
  await writeFile(join(dir, 'ic_launcher_foreground.png'), buf)
}

await sharp(iconPath).resize(512, 512).png().toFile(join(root, 'resources/icon-512.png'))

const splashSizes = {
  'drawable-port-mdpi': 480,
  'drawable-port-hdpi': 720,
  'drawable-port-xhdpi': 960,
  'drawable-port-xxhdpi': 1280,
  'drawable-port-xxxhdpi': 1920,
}

for (const [folder, height] of Object.entries(splashSizes)) {
  const dir = join(resDir, folder)
  await mkdir(dir, { recursive: true })
  const width = Math.round(height * 0.5625)
  const logoSize = Math.round(height * 0.28)
  const logo = await sharp(iconPath).resize(logoSize, logoSize, { fit: 'cover' }).png().toBuffer()
  await sharp({
    create: { width, height, channels: 4, background: { r: 11, g: 18, b: 32, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(join(dir, 'splash.png'))
}

console.log('Gu Chat icons generated from resources/icon.png')
