"use client";

import { useEffect, useRef } from "react";
import { PaymentLogos } from "@/components/payment-logos";

interface IyzicoCheckoutProps {
  checkoutFormContent: string;
  amount: number;
  packageName: string;
  onClose: () => void;
}

export function IyzicoCheckout({
  checkoutFormContent,
  amount,
  packageName,
  onClose,
}: IyzicoCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = checkoutFormContent;

    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const script = document.createElement("script");
      for (const attr of oldScript.attributes) {
        script.setAttribute(attr.name, attr.value);
      }
      script.textContent = oldScript.textContent;
      oldScript.replaceWith(script);
    });
  }, [checkoutFormContent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 py-4 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-[520px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Güvenli Ödeme</h3>
            <p className="text-sm text-zinc-400">
              {packageName} — ₺{amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div
          ref={containerRef}
          className="min-h-[480px] overflow-hidden rounded-xl bg-white shadow-2xl"
        />

        <div className="mt-4 flex justify-center">
          <PaymentLogos variant="checkout" />
        </div>
      </div>
    </div>
  );
}
