'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface PrivacySettings {
  showConsentBanner: boolean
  consentBannerText: string
  cookieConsentEnabled: boolean
  cookieConsentText: string
  privacyPolicyUrl: string
  visitorDataDays: number
  sessionDataDays: number
  chatHistoryDays: number
  autoDelete: boolean
}

export default function PrivacySettingsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState<PrivacySettings>({
    showConsentBanner: true,
    consentBannerText: 'Bu site, size daha iyi hizmet verebilmek için çerezler ve kişisel verilerinizi işlemektedir. Devam ederek bunu kabul etmiş olursunuz.',
    cookieConsentEnabled: true,
    cookieConsentText: 'Bu site, deneyiminizi iyileştirmek için çerezler kullanmaktadır.',
    privacyPolicyUrl: '',
    visitorDataDays: 365,
    sessionDataDays: 90,
    chatHistoryDays: 730,
    autoDelete: false,
  })

  const fetchSettings = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/privacy?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setSettings({
            showConsentBanner: data.showConsentBanner ?? true,
            consentBannerText: data.consentBannerText || settings.consentBannerText,
            cookieConsentEnabled: data.cookieConsentEnabled ?? true,
            cookieConsentText: data.cookieConsentText || settings.cookieConsentText,
            privacyPolicyUrl: data.privacyPolicyUrl || '',
            visitorDataDays: data.retentionPolicy?.visitorDataDays ?? 365,
            sessionDataDays: data.retentionPolicy?.sessionDataDays ?? 90,
            chatHistoryDays: data.retentionPolicy?.chatHistoryDays ?? 730,
            autoDelete: data.retentionPolicy?.autoDelete ?? false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch privacy settings', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch('/api/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: activeWebsite.websiteId,
          showConsentBanner: settings.showConsentBanner,
          consentBannerText: settings.consentBannerText,
          cookieConsentEnabled: settings.cookieConsentEnabled,
          cookieConsentText: settings.cookieConsentText,
          privacyPolicyUrl: settings.privacyPolicyUrl,
          visitorDataDays: settings.visitorDataDays,
          sessionDataDays: settings.sessionDataDays,
          chatHistoryDays: settings.chatHistoryDays,
          autoDelete: settings.autoDelete,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save privacy settings', err)
    }
  }

  const handleDownloadDPA = () => {
    const content = `VERİ İŞLEME SÖZLEŞMESİ (DPA)\n\nTaraflar:\n${activeWebsite?.name || 'Website'} (Veri Sorumlusu)\nGu Live Chat (Veri İşleyen)\n\nKapsam:\nBu sözleşme, Gu Live Chat hizmetleri kapsamında kişisel verilerin işlenmesini düzenler.\n\nVeri Kategorileri:\n- İletişim bilgileri (isim, e-posta, telefon)\n- Sohbet mesajları ve konuşma geçmişi\n- Ziyaretçi oturum verileri\n- Teknik veriler (IP adresi, tarayıcı bilgileri)\n\nAmaç:\nMüşteri desteği ve iletişim hizmetlerinin sağlanması.\n\nSaklama Süreleri:\n- Ziyaretçi verileri: ${settings.visitorDataDays} gün\n- Oturum verileri: ${settings.sessionDataDays} gün\n- Sohbet geçmişi: ${settings.chatHistoryDays} gün\n\nİmza:\nTarih: ${new Date().toLocaleDateString('tr-TR')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'veri-isleme-sozlesmesi-dpa.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gizlilik & KVKK/GDPR</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gizlilik politikası, veri saklama ve onay ayarlarını yönetin
        </p>
      </div>

      <div className="space-y-8">
        {/* Consent Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">KVKK/GDPR Onay Bannerı</h3>
            <button
              onClick={() => setSettings({ ...settings, showConsentBanner: !settings.showConsentBanner })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.showConsentBanner ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.showConsentBanner ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ziyaretçilere veri işleme ve çerez politikası hakkında bilgi veren onay bannerı gösterin
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Metni</label>
            <textarea
              value={settings.consentBannerText}
              onChange={(e) => setSettings({ ...settings, consentBannerText: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Cookie Consent */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Çerez Onayı</h3>
            <button
              onClick={() => setSettings({ ...settings, cookieConsentEnabled: !settings.cookieConsentEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.cookieConsentEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.cookieConsentEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çerez Açıklaması</label>
            <textarea
              value={settings.cookieConsentText}
              onChange={(e) => setSettings({ ...settings, cookieConsentText: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Privacy Policy URL */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gizlilik Politikası</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gizlilik Politikası URL</label>
            <input
              type="url"
              value={settings.privacyPolicyUrl}
              onChange={(e) => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="https://ornek.com/gizlilik-politikasi"
            />
          </div>
        </div>

        {/* Data Retention Policy */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Veri Saklama Politikası</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Veri türlerine göre saklama sürelerini belirleyin. Süresi dolan veriler otomatik olarak temizlenir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ziyaretçi Verileri (gün)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.visitorDataDays}
                onChange={(e) => setSettings({ ...settings, visitorDataDays: parseInt(e.target.value) || 365 })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Oturum Verileri (gün)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.sessionDataDays}
                onChange={(e) => setSettings({ ...settings, sessionDataDays: parseInt(e.target.value) || 90 })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sohbet Geçmişi (gün)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.chatHistoryDays}
                onChange={(e) => setSettings({ ...settings, chatHistoryDays: parseInt(e.target.value) || 730 })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E0F0] dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Otomatik Silme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Süresi dolan verileri otomatik olarak temizle</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoDelete: !settings.autoDelete })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.autoDelete ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.autoDelete ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Data Processing Agreement */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Veri İşleme Sözleşmesi (DPA)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            KVKK ve GDPR uyumlu Veri İşleme Sözleşmesi'ni indirin
          </p>
          <button
            onClick={handleDownloadDPA}
            className="px-4 py-2.5 bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 font-medium rounded-xl hover:bg-[#E5E0F0] dark:hover:bg-gray-600 transition"
          >
            DPA Sözleşmesini İndir
          </button>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
