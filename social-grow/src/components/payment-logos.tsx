export function PaymentLogos({ variant = "footer" }: { variant?: "footer" | "checkout" }) {
  const src =
    variant === "footer"
      ? "/payments/iyzico-footer.svg"
      : "/payments/iyzico-ile-ode.svg";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="iyzico ile Öde — Visa ve MasterCard"
          width={429}
          height={32}
          className="h-8 w-auto min-w-[280px] max-w-full sm:min-w-[360px]"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Ödemeler 256-bit SSL ile güvenli şekilde işlenir.
      </p>
    </div>
  );
}
