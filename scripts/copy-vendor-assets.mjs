import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vendorDir = join(root, 'public', 'vendor')
const source = join(root, 'node_modules', 'html-to-image', 'dist', 'html-to-image.js')
const target = join(vendorDir, 'html-to-image.min.js')

try {
  mkdirSync(vendorDir, { recursive: true })
  copyFileSync(source, target)
} catch (err) {
  console.warn('[copy-vendor-assets] html-to-image copy skipped:', err instanceof Error ? err.message : err)
}
