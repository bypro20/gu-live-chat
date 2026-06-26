'use client'

import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; size: number }

/** Technoai #500533 — particles.js + floating blobs/cubes/rings */
export function TechnoaiHeroFx() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const repulseRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let particles: Particle[] = []
    const linkDist = 150
    const count = window.innerWidth < 768 ? 55 : 110

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    const init = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        size: Math.random() * 2.5 + 1.5,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1
        if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.hypot(dx, dy)
          if (dist < linkDist) {
            const alpha = 0.38 * (1 - dist / linkDist)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }
        }

        if (mx >= 0) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy)
          if (dist < 190) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mx, my)
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.55 * (1 - dist / 190)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200, 230, 255, 0.5)'
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    const onResize = () => {
      resize()
      init()
    }

    const layer = canvas.parentElement
    const onMove = (e: MouseEvent) => {
      if (!layer) return
      const rect = layer.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseRef.current = { x, y }
      if (repulseRef.current) {
        repulseRef.current.style.left = `${x}px`
        repulseRef.current.style.top = `${y}px`
        repulseRef.current.style.opacity = '1'
      }
    }
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
      if (repulseRef.current) repulseRef.current.style.opacity = '0'
    }

    window.addEventListener('resize', onResize)
    layer?.addEventListener('mousemove', onMove)
    layer?.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      layer?.removeEventListener('mousemove', onMove)
      layer?.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="technoai-fx-layer" aria-hidden>
      <canvas ref={canvasRef} className="technoai-particles-canvas" />
      <div ref={repulseRef} className="technoai-repulse-circle" />
      <div className="technoai-floating-blob technoai-floating-blob-1" />
      <div className="technoai-floating-blob technoai-floating-blob-2" />
      <div className="technoai-glowing-orb technoai-glowing-orb-1" />
      <div className="technoai-glowing-orb technoai-glowing-orb-2" />
      <div className="technoai-rotating-cube technoai-rotating-cube-1" />
      <div className="technoai-rotating-cube technoai-rotating-cube-2" />
      <div className="technoai-pulsing-ring technoai-pulsing-ring-1" />
      <div className="technoai-pulsing-ring technoai-pulsing-ring-2" />
      <div className="technoai-glowing-dot technoai-glowing-dot-1" />
      <div className="technoai-glowing-dot technoai-glowing-dot-2" />
    </div>
  )
}
