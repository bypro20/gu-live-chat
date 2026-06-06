export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

const NEGATIVE_PATTERNS = [
  /\b(kötü|berbat|rezalet|iğrenç|sinir|öfke|kızgın|memnun değil|memnuniyetsiz|şikayet|sorun|problem|hata|bozuk|çalışmıyor|iade|iptal|dolandır|saçma|aptal|lanet|kahrol|nefret)\b/i,
  /\b(bad|terrible|awful|angry|frustrated|disappointed|complaint|broken|not working|refund|cancel|hate|worst|useless|scam)\b/i,
]

const POSITIVE_PATTERNS = [
  /\b(teşekkür|harika|mükemmel|süper|güzel|memnun|yardım|çok iyi|efsane|başarılı)\b/i,
  /\b(thanks|thank you|great|excellent|awesome|perfect|love|happy|helpful|amazing)\b/i,
]

/** Fast rule-based sentiment for visitor messages. Never throws. */
export function analyzeSentiment(text: string): SentimentLabel {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 2) return 'NEUTRAL'

  let neg = 0
  let pos = 0
  for (const re of NEGATIVE_PATTERNS) if (re.test(trimmed)) neg++
  for (const re of POSITIVE_PATTERNS) if (re.test(trimmed)) pos++

  if (neg > pos && neg > 0) return 'NEGATIVE'
  if (pos > neg && pos > 0) return 'POSITIVE'
  return 'NEUTRAL'
}
