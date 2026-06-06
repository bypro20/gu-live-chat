'use client'

import { useState } from 'react'

interface BotStep {
  id?: string
  type: string
  message: string
  options?: Array<{ label: string; nextStepId?: string }>
  order: number
}

interface Chatbot {
  id: string
  name: string
  description: string | null
  isActive: boolean
  trigger: string
  steps: BotStep[]
}

export default function ChatbotPage() {
  const [chatbots] = useState<Chatbot[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [botName, setBotName] = useState('')
  const [botTrigger, setBotTrigger] = useState('ALL_CONVERSATIONS')
  const [steps, setSteps] = useState<BotStep[]>([
    { type: 'MESSAGE', message: 'Merhaba! Size nasıl yardımcı olabiliriz?', order: 0 },
  ])

  const addStep = (type: string) => {
    setSteps([...steps, { type, message: '', order: steps.length }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const stepTypes: Record<string, { label: string; icon: string; description: string }> = {
    MESSAGE: { label: 'Mesaj', icon: '💬', description: 'Bir metin mesajı gönder' },
    CHOICE: { label: 'Seçenek', icon: '🔘', description: 'Tıklanabilir seçenekler sun' },
    COLLECT_EMAIL: { label: 'E-posta Topla', icon: '📧', description: 'Ziyaretçiden e-posta al' },
    COLLECT_NAME: { label: 'İsim Topla', icon: '👤', description: 'Ziyaretçiden isim al' },
    ASSIGN_AGENT: { label: 'Temsilciye Aktar', icon: '👥', description: 'Sohbeti temsilciye aktar' },
    END: { label: 'Bitir', icon: '✅', description: 'Sohbeti sonlandır' },
  }

  const triggerLabels: Record<string, string> = {
    ALL_CONVERSATIONS: 'Tüm sohbetler',
    OFFLINE_ONLY: 'Sadece çevrimdışı',
    KEYWORD: 'Anahtar kelime tetiklendiğinde',
    FIRST_VISIT: 'İlk ziyarette',
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chatbot</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Otomatik yanıt akışları oluşturun</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition"
        >
          + Yeni Chatbot
        </button>
      </div>

      {/* Chatbot Builder */}
      {showBuilder && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6 mb-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chatbot Adı</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Örn: Hoş Geldin Bot"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tetikleyici</label>
              <select
                value={botTrigger}
                onChange={(e) => setBotTrigger(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                {Object.entries(triggerLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Akış Adımları</h3>
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-[#EFF6FF] dark:bg-gray-900 rounded-xl border border-[#E5E7EB] dark:border-gray-700">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stepTypes[step.type]?.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stepTypes[step.type]?.label}</span>
                  </div>
                  {(step.type === 'MESSAGE' || step.type === 'COLLECT_EMAIL' || step.type === 'COLLECT_NAME' || step.type === 'ASSIGN_AGENT') && (
                    <input
                      type="text"
                      value={step.message}
                      onChange={(e) => updateStep(index, 'message', e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder={step.type === 'MESSAGE' ? 'Mesaj metni...' : step.type === 'ASSIGN_AGENT' ? 'Aktarım mesajı...' : 'İstem mesajı...'}
                    />
                  )}
                  {step.type === 'CHOICE' && (
                    <div className="space-y-2">
                      {step.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-xs text-primary">
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...steps]
                              const options = [...(updated[index].options || [])]
                              options[optIndex] = { ...options[optIndex], label: e.target.value }
                              updated[index] = { ...updated[index], options }
                              setSteps(updated)
                            }}
                            className="flex-1 px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            placeholder="Seçenek metni"
                          />
                          <button
                            onClick={() => {
                              const updated = [...steps]
                              const options = (updated[index].options || []).filter((_, i) => i !== optIndex)
                              updated[index] = { ...updated[index], options }
                              setSteps(updated)
                            }}
                            className="text-red-400 hover:text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updated = [...steps]
                          const options = [...(updated[index].options || []), { label: '' }]
                          updated[index] = { ...updated[index], options }
                          setSteps(updated)
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        + Seçenek Ekle
                      </button>
                    </div>
                  )}
                </div>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(index)} className="text-red-400 hover:text-red-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Step Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(stepTypes).map(([type, info]) => (
              <button
                key={type}
                onClick={() => addStep(type)}
                className="px-3 py-2 bg-[#EFF6FF] dark:bg-gray-700 hover:bg-[#DDD6FE] dark:hover:bg-gray-600 rounded-lg text-sm transition flex items-center gap-1.5 text-[#1E40AF] dark:text-gray-300"
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowBuilder(false)} className="px-4 py-2.5 bg-[#EFF6FF] dark:bg-gray-700 hover:bg-[#DDD6FE] dark:hover:bg-gray-600 text-[#1E40AF] dark:text-gray-300 font-medium rounded-xl transition">
              İptal
            </button>
            <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition">
              Chatbot Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Existing Chatbots */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700">
        {chatbots.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🤖
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Henüz chatbot yok</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yukarıdaki butonu kullanarak ilk chatbotunuzu oluşturun</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {chatbots.map((bot) => (
              <div key={bot.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-[#EFF6FF] dark:bg-gray-700'}`}>
                    🤖
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{bot.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{triggerLabels[bot.trigger]} • {bot.steps.length} adım</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className={`px-3 py-1 text-xs font-medium rounded-full ${bot.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-gray-700 dark:text-gray-400'}`}>
                    {bot.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                  <button className="text-gray-400 hover:text-red-500 transition">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}