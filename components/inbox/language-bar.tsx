'use client'

import { Languages } from 'lucide-react'
import { TRANSLATE_LANGUAGES, languageLabel, languagesDiffer } from '@/lib/translate-languages'

type LanguageBarProps = {
  agentLang: string
  onAgentLangChange: (code: string) => void
  visitorLang?: string | null
  autoTranslate: boolean
  canTranslate: boolean
}

export function LanguageBar({
  agentLang,
  onAgentLangChange,
  visitorLang,
  autoTranslate,
  canTranslate,
}: LanguageBarProps) {
  if (!canTranslate) return null

  const pairActive = autoTranslate && visitorLang && languagesDiffer(agentLang, visitorLang)

  return (
    <div className="px-4 py-2 border-b border-border bg-muted/30 flex flex-wrap items-center gap-2 text-xs">
      <Languages className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-muted-foreground">Diliniz:</span>
      <select
        value={agentLang}
        onChange={(e) => onAgentLangChange(e.target.value)}
        className="h-7 px-2 rounded-md border border-border bg-card text-foreground text-xs"
      >
        {TRANSLATE_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
      {pairActive && (
        <span className="text-primary font-medium ml-1">
          ↔ {languageLabel(visitorLang)} canlı çeviri aktif
        </span>
      )}
      {autoTranslate && !visitorLang && (
        <span className="text-muted-foreground">Ziyaretçi dili algılanıyor…</span>
      )}
    </div>
  )
}
