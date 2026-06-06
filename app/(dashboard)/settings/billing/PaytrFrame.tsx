'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPaytrIframeUrl } from '@/lib/paytr-client'

interface PaytrFrameProps {
  token: string
  onSuccess: () => void
  onFailure: (reason?: string) => void
  onClose: () => void
}

export default function PaytrFrame({ token, onSuccess, onFailure, onClose }: PaytrFrameProps) {
  const [loading, setLoading] = useState(true)

  // Listen for postMessage from PayTR iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // PayTR sends postMessage events for payment status
      if (event.data?.type === 'paytr_success' || event.data?.status === 'success') {
        onSuccess()
      } else if (event.data?.type === 'paytr_fail' || event.data?.status === 'fail') {
        onFailure(event.data?.reason || 'Ödeme başarısız')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSuccess, onFailure])

  // Also check URL params for success/failure redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      onSuccess()
    } else if (paymentStatus === 'failed') {
      onFailure('Ödeme başarısız oldu')
    }
  }, [onSuccess, onFailure])

  const iframeUrl = getPaytrIframeUrl(token)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[500px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Güvenli Ödeme</h3>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white transition rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl z-10">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#1972F5] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-600">Ödeme sayfası yükleniyor...</p>
            </div>
          </div>
        )}

        {/* PayTR iFrame */}
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/30">
          <iframe
            src={iframeUrl}
            className="w-full border-0"
            style={{ height: '600px' }}
            onLoad={() => setLoading(false)}
            title="PayTR Güvenli Ödeme"
            allow="payment"
          />
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 mt-3 text-white/60 text-xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Ödeme 256-bit SSL ile korunmaktadır</span>
        </div>
      </div>
    </div>
  )
}