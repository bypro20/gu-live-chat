'use client'

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Ayarları</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform genel ayarlarını yönetin</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Genel Ayarlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform Adı</label>
              <input
                type="text"
                defaultValue="Gu Live Chat"
                className="w-full max-w-md px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destek E-posta</label>
              <input
                type="email"
                defaultValue="destek@gulive.com"
                className="w-full max-w-md px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Default Plan Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Varsayılan Plan Limitleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Ücretsiz</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 temsilci / 100 sohbet</p>
            </div>
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Başlangıç</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">5 temsilci / 1.000 sohbet</p>
            </div>
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <h3 className="font-semibold text-purple-700 dark:text-purple-400 text-sm">Profesyonel</h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">15 temsilci / Sınırsız</p>
            </div>
            <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h3 className="font-semibold text-green-700 dark:text-green-400 text-sm">İş</h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Sınırsız / Sınırsız</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">⚡ Tehlikeli Alan</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Bu işlemler geri alınamaz. Dikkatli ilerleyin.</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition">
              Tüm Sohbetleri Sil
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
              Tüm Verileri Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}