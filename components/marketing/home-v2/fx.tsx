'use client'

import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/components/marketing/home-v2/use-reduced-motion'

/** Yavaşça parlayan yıldız alanı. Görünür değilken ve hareket azaltmada durur. */
export function Starfield({ count = 110 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 0.8 + 0.3,
      hue: Math.random() < 0.18 ? 270 : Math.random() < 0.3 ? 175 : 0,
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        const tw = reduced ? 0.7 : 0.45 + 0.55 * Math.sin(t * 0.001 * s.s + s.p)
        ctx.globalAlpha = Math.max(0.08, tw) * 0.85
        ctx.fillStyle = s.hue ? `hsl(${s.hue} 90% 80%)` : '#ffffff'
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduced && visible) raf = requestAnimationFrame(draw)
    }

    resize()
    draw(0)
    const ro = new ResizeObserver(() => {
      resize()
      if (reduced) draw(0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !reduced) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(draw)
      }
    })
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [count, reduced])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}

/** Sayfa kaydıkça öne doğru dikleşen, imleçle hafifçe eğilen sahne. */
export function TiltStage({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = wrap.current
    if (!el || reduced) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 = sahne henüz alt kenarda, 1 = tamamen ekranda
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)))
      el.style.setProperty('--tilt', String((1 - p) * 16))
      el.style.setProperty('--lift', String((1 - p) * 40))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = wrap.current
    if (!el || reduced) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', String(x * 5))
    el.style.setProperty('--rx', String(-y * 3))
  }
  const onLeave = () => {
    const el = wrap.current
    if (!el) return
    el.style.setProperty('--ry', '0')
    el.style.setProperty('--rx', '0')
  }

  return (
    <div ref={wrap} className="hv2-tilt" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="hv2-tilt-inner">{children}</div>
    </div>
  )
}

/** İmleci takip eden ışıklı, çerçevesi parlayan kart. */
export function SpotlightCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={`hv2-spot ${className}`} style={style}>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

/** Sonsuz kayan şerit. */
export function Marquee({ items }: { items: { label: string; dot: string }[] }) {
  const row = [...items, ...items]
  return (
    <div className="hv2-marquee" aria-hidden="false">
      <ul className="hv2-marquee-track">
        {row.map((it, i) => (
          <li
            key={`${it.label}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.035] px-5 py-2.5 text-[14px] text-white/75"
            aria-hidden={i >= items.length}
          >
            <span className={`h-2 w-2 rounded-full ${it.dot}`} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Ahizem’deki gibi halkalarla nefes alan küre. */
export function Orb() {
  return (
    <div className="hv2-orb" aria-hidden="true">
      <span className="hv2-orb-ring hv2-orb-ring-1" />
      <span className="hv2-orb-ring hv2-orb-ring-2" />
      <span className="hv2-orb-ring hv2-orb-ring-3" />
      <span className="hv2-orb-core" />
    </div>
  )
}
