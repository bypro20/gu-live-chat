'use client'

import { useEffect, useRef, type RefObject } from 'react'

/*
 * Ürün penceresinin çevresinde yükselen dumanlı ışık (WebGL parça gölgelendirici).
 * Hedef kutuya uzaklık + kayan fbm gürültüsü → kıvrılan, renkli duman.
 * Yarım çözünürlükte çizilir; cihaz yavaşsa çözünürlük düşer, yetmezse CSS aurası kalır.
 */

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`

const FRAG = `
precision mediump float;
uniform vec2 res;
uniform float t;
uniform vec4 box;
uniform float rad;
uniform vec3 c1;
uniform vec3 c2;
uniform float amp;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
float sdBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main(){
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / res.y;
  float s = max(box.w, 125.0) / 260.0;
  vec2 flow = vec2(0.0, -t * 0.32);
  float n1 = fbm(uv * 3.2 + flow);
  float n2 = fbm(uv * 6.5 + vec2(t * 0.07, -t * 0.55) + n1 * 1.6);
  vec2 warp = (vec2(n1, n2) - 0.5) * 70.0 * s;
  float d0 = sdBox(p - box.xy, box.zw, rad);
  float d = sdBox(p - box.xy + warp, box.zw, rad);
  float dd = max(d, 0.0);

  float flame = exp(-dd / ((16.0 + 46.0 * n2) * s));
  float smoke = smoothstep(0.42, 0.95, fbm(uv * 4.0 + vec2(0.0, -t * 0.45) + n2)) * exp(-dd / (150.0 * s));
  float up = smoothstep(-1.2, 1.0, (p.y - box.y) / box.w);
  smoke *= 0.55 + 0.75 * up;

  float edge = exp(-abs(d0) / (2.0 * s)) * 0.55;
  float outside = smoothstep(-2.0 * s, 10.0 * s, d0);

  vec3 col = mix(c1, c2, smoothstep(0.25, 0.8, n2));
  float a = (flame * 1.15 + smoke * 0.9) * outside + edge;
  a *= amp;
  vec3 rgb = col * a + vec3(1.0) * edge * 0.35 * amp;
  gl_FragColor = vec4(rgb, clamp(a, 0.0, 1.0));
}`

function hsl(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

const SCALES = [0.5, 0.33, 0.2]
const SLOW_MS = 34
const SAMPLE_FRAMES = 40

export function Smoke({
  targetRef,
  hue = 268,
  radius = 18,
  level = 1,
  onFail,
}: {
  targetRef: RefObject<HTMLElement | null>
  hue?: number
  radius?: number
  level?: number
  onFail?: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const state = useRef({ hue, radius, level, amp: 0 })
  useEffect(() => {
    state.current.hue = hue
    state.current.radius = radius
    state.current.level = level
  }, [hue, radius, level])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) {
      onFail?.()
      return
    }
    const compile = (type: number, src: string) => {
      const o = gl.createShader(type)
      if (!o) return null
      gl.shaderSource(o, src)
      gl.compileShader(o)
      return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) {
      onFail?.()
      return
    }
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onFail?.()
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = (n: string) => gl.getUniformLocation(prog, n)
    const u = { res: U('res'), t: U('t'), box: U('box'), rad: U('rad'), c1: U('c1'), c2: U('c2'), amp: U('amp') }
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const born = performance.now()
    let raf = 0
    let visible = true
    let lvl = 0
    let samples = 0
    let spent = 0
    let last = 0

    const frame = (now: number) => {
      raf = 0
      if (!visible) {
        last = 0
        return
      }
      if (last && !reduced) {
        spent += now - last
        samples += 1
        if (samples >= SAMPLE_FRAMES) {
          if (spent / samples > SLOW_MS) {
            lvl += 1
            if (lvl >= SCALES.length) {
              gl.clearColor(0, 0, 0, 0)
              gl.clear(gl.COLOR_BUFFER_BIT)
              io.disconnect()
              onFail?.()
              return
            }
          }
          samples = 0
          spent = 0
        }
      }
      last = now
      const SCALE = SCALES[lvl]
      const cw = Math.round(canvas.clientWidth * SCALE)
      const ch = Math.round(canvas.clientHeight * SCALE)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      gl.viewport(0, 0, cw, ch)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      const st = state.current
      st.amp += (st.level - st.amp) * 0.06
      const target = targetRef.current
      if (target && st.amp > 0.01) {
        const c = canvas.getBoundingClientRect()
        const r = target.getBoundingClientRect()
        const cx = (r.left + r.width / 2 - c.left) * SCALE
        const cy = (c.bottom - (r.top + r.height / 2)) * SCALE
        gl.uniform2f(u.res, cw, ch)
        gl.uniform1f(u.t, reduced ? 4 : (now - born) / 1000)
        gl.uniform4f(u.box, cx, cy, (r.width / 2) * SCALE, (r.height / 2) * SCALE)
        gl.uniform1f(u.rad, st.radius * SCALE)
        gl.uniform3fv(u.c1, hsl(st.hue, 100, 62))
        gl.uniform3fv(u.c2, hsl(st.hue - 70, 100, 58))
        gl.uniform1f(u.amp, st.amp)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      if (!reduced || Math.abs(st.level - st.amp) > 0.01) raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(frame)
    })
    io.observe(canvas)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [targetRef, onFail])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}
