'use client'

import { useState } from 'react'

interface Visitor {
  id: string
  name: string | null
  email: string | null
  country: string | null
  city: string | null
  browser: string | null
  device: string | null
  _count: { conversations: number }
  createdAt: string
  updatedAt: string
}

export default function ContactsPage() {
  const [contacts] = useState<Visitor[]>([])
  const [search, setSearch] = useState('')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kişiler</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ziyaretçilerin profil bilgilerini ve sohbet geçmişini yönetin
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="surface overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Henüz kişi yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              İlk ziyaretçi sohbet başlattığında kişiler burada görünecek
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kişi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Konum</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cihaz</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sohbet</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Son Aktivite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-muted/50 transition cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                            {contact.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{contact.name || 'Anonim'}</p>
                            <p className="text-xs text-muted-foreground truncate">{contact.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {contact.city && contact.country ? `${contact.city}, ${contact.country}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {contact.browser || '-'} / {contact.device || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full tabular-nums">
                          {contact._count.conversations} sohbet
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">
                        {new Date(contact.updatedAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden divide-y divide-border">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-4 active:bg-muted/50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                      {contact.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{contact.name || 'Anonim'}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email || '-'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full shrink-0 tabular-nums">
                      {contact._count.conversations}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground/70">Konum</p>
                      <p className="text-foreground mt-0.5 truncate">{contact.city && contact.country ? `${contact.city}, ${contact.country}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/70">Cihaz</p>
                      <p className="text-foreground mt-0.5 truncate">{contact.browser || '-'} / {contact.device || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/70">Son Aktivite</p>
                      <p className="text-foreground mt-0.5 tabular-nums">{new Date(contact.updatedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
