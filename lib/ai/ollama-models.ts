import type { AiModelTier, ModelPreset } from './models'

const CACHE_TTL_MS = 5 * 60 * 1000

type OllamaTagsResponse = {
  models?: Array<{ name: string; size?: number }>
}

type OpenAiModelsResponse = {
  data?: Array<{ id: string }>
}

let cachedPresets: ModelPreset[] | null = null
let cachedAt = 0
let lastFetchError: string | null = null

function ollamaRootUrl(): string | null {
  const raw = process.env.OLLAMA_BASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/v1\/?$/, '').replace(/\/$/, '')
}

function authHeaders(): HeadersInit {
  const key = process.env.OLLAMA_API_KEY?.trim()
  if (!key || key === 'ollama') return {}
  return { Authorization: `Bearer ${key}` }
}

/** Model adından parametre boyutuna göre paket katmanı (7b → economy, 14b → standard, 70b+ → premium). */
export function inferTierFromModelName(name: string): AiModelTier {
  const n = name.toLowerCase()
  if (/\b(70b|72b|405b|671b)\b/.test(n) || /\br1\b/.test(n) || /\bopus\b/.test(n)) return 'premium'
  if (/\b(32b|34b|27b|22b|20b)\b/.test(n)) return 'premium'
  if (/\b(13b|14b|12b|9b|11b|10b|15b|16b|18b)\b/.test(n)) return 'standard'
  if (/\b(7b|8b|3b|1b|2b|4b|5b|6b|mini|small|tiny|lite|flash-lite)\b/.test(n)) return 'economy'
  return 'standard'
}

function formatModelLabel(name: string): string {
  const tier = inferTierFromModelName(name)
  const sizeMatch = name.match(/\b(\d+\.?\d*b)\b/i)
  const size = sizeMatch ? ` · ${sizeMatch[1].toUpperCase()}` : ''
  const tierTr =
    tier === 'economy' ? 'hafif' : tier === 'standard' ? 'orta' : 'güçlü'
  return `${name}${size} (${tierTr})`
}

function presetFromName(name: string): ModelPreset {
  return {
    value: name,
    label: formatModelLabel(name),
    tier: inferTierFromModelName(name),
    note: 'Sunucunuzdaki model',
  }
}

function presetsFromEnvList(): ModelPreset[] {
  const raw = process.env.OLLAMA_MODELS?.trim()
  if (!raw) return []
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(presetFromName)
}

function dedupePresets(presets: ModelPreset[]): ModelPreset[] {
  const seen = new Set<string>()
  const out: ModelPreset[] = []
  for (const p of presets) {
    if (seen.has(p.value)) continue
    seen.add(p.value)
    out.push(p)
  }
  return out
}

async function fetchRemotePresets(root: string): Promise<ModelPreset[]> {
  const headers = authHeaders()
  const timeout = AbortSignal.timeout(10_000)

  const tagsRes = await fetch(`${root}/api/tags`, { headers, signal: timeout, cache: 'no-store' })
  if (tagsRes.ok) {
    const data = (await tagsRes.json()) as OllamaTagsResponse
    const names = (data.models ?? []).map((m) => m.name).filter(Boolean)
    if (names.length > 0) return names.map(presetFromName)
  }

  const modelsRes = await fetch(`${root}/v1/models`, { headers, signal: timeout, cache: 'no-store' })
  if (modelsRes.ok) {
    const data = (await modelsRes.json()) as OpenAiModelsResponse
    const ids = (data.data ?? []).map((m) => m.id).filter(Boolean)
    if (ids.length > 0) return ids.map(presetFromName)
  }

  if (!tagsRes.ok && !modelsRes.ok) {
    const detail = tagsRes.status === 401 || modelsRes.status === 401
      ? 'Kimlik doğrulama gerekli — OLLAMA_API_KEY (Open WebUI API anahtarı) ayarlayın'
      : `Ollama yanıt vermedi (${tagsRes.status}/${modelsRes.status})`
    throw new Error(detail)
  }

  return []
}

/** Önbellekteki sunucu modelleri (refreshOllamaPresets sonrası dolu olur). */
export function getCachedOllamaPresets(): ModelPreset[] {
  return cachedPresets ?? []
}

export function getOllamaPresetsMeta() {
  const envList = presetsFromEnvList()
  const hasUrl = !!ollamaRootUrl()
  return {
    configured: hasUrl || envList.length > 0,
    count: getCachedOllamaPresets().length,
    source: cachedPresets
      ? envList.length > 0 && !hasUrl
        ? 'env'
        : 'remote'
      : envList.length > 0
        ? 'env'
        : 'none',
    lastError: lastFetchError,
    fetchedAt: cachedAt || null,
  }
}

/** gulivechat.online / Ollama sunucusundan model listesini çeker ve önbelleğe alır. */
export async function refreshOllamaPresets(): Promise<ModelPreset[]> {
  const envPresets = presetsFromEnvList()
  const root = ollamaRootUrl()

  if (!root && envPresets.length === 0) {
    cachedPresets = null
    cachedAt = 0
    lastFetchError = null
    return []
  }

  if (cachedPresets && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedPresets
  }

  try {
    const remote = root ? await fetchRemotePresets(root) : []
    const merged = dedupePresets([...remote, ...envPresets])
    cachedPresets = merged
    cachedAt = Date.now()
    lastFetchError = merged.length === 0 && root ? 'Sunucuda model bulunamadı' : null
    return merged
  } catch (err) {
    lastFetchError = err instanceof Error ? err.message : String(err)
    if (envPresets.length > 0) {
      cachedPresets = envPresets
      cachedAt = Date.now()
      return envPresets
    }
    cachedPresets = []
    cachedAt = Date.now()
    return []
  }
}

/** Ollama için gösterilecek liste: sunucu/env modelleri; yoksa statik yedek. */
export function resolveOllamaPresets(staticFallback: ModelPreset[]): ModelPreset[] {
  const remote = getCachedOllamaPresets()
  if (remote.length > 0) return remote
  if (ollamaRootUrl() || process.env.OLLAMA_MODELS?.trim()) return []
  return staticFallback
}
