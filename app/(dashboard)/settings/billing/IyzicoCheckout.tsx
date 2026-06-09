'use client'

import { useEffect, useRef } from 'react'

interface IyzicoCheckoutProps {
  checkoutFormContent: string
  onClose: () => void
}

export default function IyzicoCheckout({ checkoutFormContent, onClose }: IyzicoCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = checkoutFormContent

    const scripts = container.querySelectorAll('script')
    scripts.forEach((oldScript) => {
      const script = document.createElement('script')
      for (const attr of oldScript.attributes) {
        script.setAttribute(attr.name, attr.value)
      }
      script.textContent = oldScript.textContent
      oldScript.replaceWith(script)
    })
  }, [checkoutFormContent])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[520px] mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Güvenli Ödeme — iyzico</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white transition rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={containerRef}
          className="bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/30 min-h-[480px]"
        />

        <div className="flex items-center justify-center gap-2 mt-3 text-white/60 text-xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>256-bit SSL · iyzico güvenli ödeme</span>
        </div>
      </div>
    </div>
  )
}
