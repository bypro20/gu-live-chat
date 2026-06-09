import Link from "next/link";

const items = [
  { icon: "🔒", text: "256-bit SSL Güvenli Ödeme" },
  { icon: "💳", text: "iyzico ile Öde" },
  { icon: "✓", text: "3D Secure" },
  { icon: "↩", text: "Telafi Garantisi" },
];

export function TrustBar() {
  return (
    <div className="border-b border-white/10 bg-[#0a0a12]/90 py-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 text-xs text-zinc-400">
        {items.map((i) => (
          <span key={i.text} className="flex items-center gap-1">
            <span>{i.icon}</span> {i.text}
          </span>
        ))}
        <Link href="/mesafeli-satis" className="text-violet-400 hover:underline">
          Mesafeli Satış
        </Link>
      </div>
    </div>
  );
}
