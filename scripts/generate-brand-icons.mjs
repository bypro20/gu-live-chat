#!/usr/bin/env node
/**
 * Gu Live Chat markasından favicon, apple-touch-icon ve app-icon PNG/ICO üretir.
 * Çalıştır: node scripts/generate-brand-icons.mjs
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'lib/brand/gu-chat-icon.svg')
const svg = readFileSync(svgPath)

const outputs = [
  { path: join(root, 'app/icon.png'), size: 32 },
  { path: join(root, 'app/apple-icon.png'), size: 180 },
  { path: join(root, 'public/app-icon.png'), size: 512 },
  { path: join(root, 'public/favicon-32.png'), size: 32 },
  { path: join(root, 'public/favicon-16.png'), size: 16 },
]

for (const { path, size } of outputs) {
  await sharp(svg).resize(size, size).png().toFile(path)
  console.log('wrote', path)
}

// favicon.ico — 16 + 32 px katmanlı
const png16 = await sharp(svg).resize(16, 16).png().toBuffer()
const png32 = await sharp(svg).resize(32, 32).png().toBuffer()
writeFileSync(join(root, 'app/favicon.ico'), buildIco([png16, png32]))
console.log('wrote app/favicon.ico')

copyFileSync(join(root, 'lib/brand/gu-chat-icon.svg'), join(root, 'app/icon.svg'))
console.log('wrote app/icon.svg')

/** Minimal ICO encoder (PNG içerikli) */
function buildIco(pngBuffers) {
  const sizes = pngBuffers.map((b) => b.length)
  const headerSize = 6 + pngBuffers.length * 16
  let offset = headerSize
  const parts = []

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngBuffers.length, 4)

  pngBuffers.forEach((buf, i) => {
    const dim = i === 0 ? 16 : 32
    const entryOffset = 6 + i * 16
    header.writeUInt8(dim, entryOffset)
    header.writeUInt8(dim, entryOffset + 1)
    header.writeUInt8(0, entryOffset + 2)
    header.writeUInt8(0, entryOffset + 3)
    header.writeUInt16LE(1, entryOffset + 4)
    header.writeUInt16LE(32, entryOffset + 6)
    header.writeUInt32LE(buf.length, entryOffset + 8)
    header.writeUInt32LE(offset, entryOffset + 12)
    offset += buf.length
    parts.push(buf)
  })

  return Buffer.concat([header, ...parts])
}
