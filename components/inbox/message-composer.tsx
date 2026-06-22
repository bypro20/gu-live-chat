'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Languages,
  Sparkles,
  Loader2,
  X,
  ImageIcon,
  Mic,
  MicOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { languageLabel } from '@/lib/translate-languages'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { useLocale } from '@/components/marketing/locale-provider'
import { useSpeechInput } from '@/lib/hooks/use-speech-input'
import { inboxComposerRowStyle, inboxComposerShellStyle, resolveInboxPrimary } from '@/lib/inbox-theme'

export type PendingUpload = {
  file: File
  previewUrl?: string
  uploading?: boolean
}

type CannedItem = { id: string; title: string; content: string; shortcut: string | null }

type MessageComposerProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void | Promise<void>
  onFileSelect?: (file: File) => void | Promise<void>
  pendingUpload?: PendingUpload | null
  onClearUpload?: () => void
  sending?: boolean
  translating?: boolean
  uploading?: boolean
  disabled?: boolean
  canUpload?: boolean
  canCanned?: boolean
  canAi?: boolean
  aiEnabled?: boolean
  onAiSuggest?: () => void
  aiSuggesting?: boolean
  cannedResponses?: CannedItem[]
  showCannedPicker?: boolean
  onSelectCanned?: (content: string) => void
  autoTranslate?: boolean
  detectedLang?: string | null
  agentLang?: string
  sendError?: string | null
  placeholder?: string
  className?: string
  primaryColor?: string | null
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  onFileSelect,
  pendingUpload,
  onClearUpload,
  sending,
  translating,
  uploading,
  disabled,
  canUpload,
  canCanned,
  canAi,
  aiEnabled,
  onAiSuggest,
  aiSuggesting,
  cannedResponses = [],
  showCannedPicker,
  onSelectCanned,
  autoTranslate,
  detectedLang,
  agentLang = 'tr',
  sendError,
  placeholder,
  className,
  primaryColor,
}: MessageComposerProps) {
  const inbox = useDashboardI18n().inbox
  const { locale: siteLocale } = useLocale()
  const primary = resolveInboxPrimary(primaryColor)
  const resolvedPlaceholder = placeholder ?? inbox.writeMessage
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [interimText, setInterimText] = useState<string | null>(null)

  const onFinalSpeech = useCallback(
    (text: string) => {
      setInterimText(null)
      onChange(text)
    },
    [onChange],
  )

  const { supported: speechSupported, listening, error: speechError, toggle: toggleSpeech, stop: stopSpeech } =
    useSpeechInput({
      lang: agentLang,
      siteLocale,
      onFinalText: onFinalSpeech,
      onInterimText: setInterimText,
    })

  const displayValue = interimText ?? value

  useEffect(() => {
    return () => stopSpeech()
  }, [stopSpeech])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [displayValue])

  const cannedQuery = value.startsWith('/') ? value.slice(1).toLowerCase() : ''
  const speechLangLabel = languageLabel(siteLocale === 'tr' ? 'tr' : agentLang)
  const filteredCanned = showCannedPicker
    ? cannedResponses.filter((r) => {
        if (!cannedQuery) return true
        return (
          r.title.toLowerCase().includes(cannedQuery) ||
          (r.shortcut?.toLowerCase().includes(cannedQuery) ?? false)
        )
      })
    : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSend()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!canUpload || !onFileSelect) return
    const file = e.dataTransfer.files[0]
    if (file) void onFileSelect(file)
  }

  return (
    <div className={cn('shrink-0 inbox-composer-shell', className)} style={inboxComposerShellStyle()}>
      {autoTranslate && detectedLang && (
        <div className="flex items-center gap-1.5 px-4 pt-2 text-[11px] text-muted-foreground">
          <Languages className="w-3 h-3 shrink-0" />
          {inbox.langPairHint(languageLabel(agentLang), languageLabel(detectedLang))}
        </div>
      )}
      {sendError && <p className="px-4 pt-2 text-xs text-destructive">{sendError}</p>}
      {speechError && speechError !== 'unsupported' && (
        <p className="px-4 pt-2 text-xs text-destructive">{inbox.voiceError}</p>
      )}
      {listening && (
        <p className="px-4 pt-2 text-xs text-primary font-medium animate-pulse">
          {inbox.voiceListening(speechLangLabel)}
        </p>
      )}

      {pendingUpload && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          {pendingUpload.previewUrl ? (
            <img
              src={pendingUpload.previewUrl}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-xs text-foreground truncate flex-1">{pendingUpload.file.name}</span>
          {(uploading || pendingUpload.uploading) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClearUpload}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1 px-3 pt-2">
        {canUpload && onFileSelect && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFileSelect(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={inbox.addFile}
              disabled={disabled || uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </>
        )}
        {canAi && aiEnabled && onAiSuggest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            disabled={aiSuggesting || disabled}
            onClick={onAiSuggest}
          >
            {aiSuggesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {inbox.aiSuggest}
          </Button>
        )}
      </div>

      <div
        className={cn(
          'relative flex items-end gap-2 p-3 pt-2 mx-3 mb-3 rounded-3xl transition-shadow',
          dragOver && canUpload && 'ring-2 ring-indigo-300'
        )}
        style={inboxComposerRowStyle(primary)}
        onDragOver={(e) => {
          if (!canUpload) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {showCannedPicker && filteredCanned.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 max-h-44 overflow-y-auto bg-popover border border-border rounded-xl shadow-lg z-20">
            {filteredCanned.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectCanned?.(r.content)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition border-b border-border last:border-0"
              >
                <p className="text-sm font-medium truncate">{r.title}</p>
                {r.shortcut && (
                  <p className="text-[10px] text-muted-foreground">/{r.shortcut}</p>
                )}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => {
            if (listening) stopSpeech()
            setInterimText(null)
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          placeholder={listening ? inbox.voiceListening(speechLangLabel) : resolvedPlaceholder}
          disabled={disabled || sending}
          rows={1}
          className={cn(
            'flex-1 min-h-[44px] max-h-32 px-1 py-2.5 bg-transparent border-0 resize-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none',
            listening && 'placeholder:text-primary/70',
          )}
        />
        {speechSupported && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              'h-11 w-11 shrink-0 rounded-2xl transition-colors',
              listening && 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700',
            )}
            disabled={disabled || sending}
            onClick={() => toggleSpeech(value)}
            title={listening ? inbox.voiceStop : inbox.voiceInput(speechLangLabel)}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-2xl border-0 text-white hover:opacity-95 transition-opacity duration-150"
          style={{
            background: `linear-gradient(145deg, ${primary}, ${primary}dd)`,
            boxShadow: `0 2px 8px ${primary}33`,
          }}
          disabled={(!displayValue.trim() && !pendingUpload) || sending || translating || uploading || disabled}
          onClick={() => void onSend()}
          title={inbox.send}
        >
          {sending || translating || uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="px-4 pb-2.5 text-[10px] text-slate-400 text-center font-medium">
        {inbox.sendHint}
      </p>
    </div>
  )
}
