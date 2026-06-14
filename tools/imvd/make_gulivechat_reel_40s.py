#!/usr/bin/env python3
"""
Gu Live Chat — 40 sn sesli reklam, 6 ayrı sahne (Instagram reel tarzı).
Her sahne: output/scenes/sahne-XX.mp4
Birleşik: gulivechat-reklam-40sn.mp4
"""

from __future__ import annotations

import asyncio
import math
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from tts_brand import SCENES_SUBTITLE, SCENES_VOICE, VOICE, VOICE_PITCH, VOICE_RATE, plain_to_ssml

ROOT = Path(__file__).parent
SCENES_DIR = ROOT / 'output' / 'scenes'
OUT_DIR = ROOT / 'output'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-40sn.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-40sn-izle.html'

W, H, FPS = 1080, 1920, 30
TARGET_TOTAL = 40.0

BG1, BG2 = (6, 10, 26), (20, 16, 58)
ACCENT, ACCENT2 = (99, 102, 241), (45, 212, 191)
GOLD, WHITE = (252, 211, 77), (255, 255, 255)
MUTED = (148, 163, 184)


@dataclass
class SceneSpec:
    id: str
    title: str
    voice: str
    subtitle: str


SCENES: list[SceneSpec] = [
    SceneSpec(f'0{i}-{_id}', _title, _voice, _sub)
    for i, (_id, _title, _voice, _sub) in enumerate(
        [
            ('marka', 'Marka', SCENES_VOICE[0], SCENES_SUBTITLE[0]),
            ('hook', 'Hook', SCENES_VOICE[1], SCENES_SUBTITLE[1]),
            ('widget', 'Widget', SCENES_VOICE[2], SCENES_SUBTITLE[2]),
            ('platform', 'Platform', SCENES_VOICE[3], SCENES_SUBTITLE[3]),
            ('sonuc', 'Sonuç', SCENES_VOICE[4], SCENES_SUBTITLE[4]),
            ('cta', 'CTA', SCENES_VOICE[5], SCENES_SUBTITLE[5]),
        ],
        start=1,
    )
]


def _ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _font(size: int, bold: bool = False):
    for p in [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _bg() -> Image.Image:
    img = Image.new('RGB', (W, H), BG1)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = tuple(int(BG1[i] * (1 - t) + BG2[i] * t) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(260, 0, -5):
        a = int(20 * r / 260)
        gd.ellipse((W // 2 - r * 2, 80, W // 2 + r * 2, 80 + r * 2), fill=(ACCENT[0], ACCENT[1], ACCENT[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(45))
    img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')
    # vignette
    vig = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.ellipse((-120, -80, W + 120, H + 200), fill=(0, 0, 0, 100))
    return Image.alpha_composite(img.convert('RGBA'), vig).convert('RGB')


def _wrap(text: str, font, max_w: int) -> list[str]:
    words, lines, cur = text.split(), [], ''
    for w in words:
        test = f'{cur} {w}'.strip()
        if font.getlength(test) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [text]


def _headline(draw, y, text, size=56, color=WHITE, t=1.0, center=True):
    e = _ease(t)
    f = _font(size, True)
    dy = int((1 - e) * 40)
    for i, line in enumerate(_wrap(text, f, 920)):
        lw = f.getlength(line)
        x = (W - lw) // 2 if center else 80
        draw.text((x, y + dy + i * (size + 10)), line, font=f, fill=color)


def _subtitle_bar(img: Image.Image, text: str, alpha: float = 1.0) -> Image.Image:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    f = _font(32, True)
    lines = _wrap(text, f, W - 100)
    lh = 40
    bh = len(lines) * lh + 36
    by = H - bh - 160
    draw.rounded_rectangle((50, by, W - 50, by + bh), radius=18, fill=(0, 0, 0, int(210 * alpha)))
    cy = by + 18
    for ln in lines:
        lw = f.getlength(ln)
        draw.text(((W - lw) // 2, cy), ln, font=f, fill=(255, 255, 255, int(255 * alpha)))
        cy += lh
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')


def _brand_bar(draw, t: float):
    e = _ease(t)
    draw.rounded_rectangle((50, 70, 420, 150), radius=16, fill=(255, 255, 255, int(12 * e)))
    draw.text((70, 88), '🚀 Gu Live Chat', font=_font(34, True), fill=WHITE)
    draw.text((70, 128), 'gulivechat.com', font=_font(22), fill=ACCENT2)


def _widget_ui(draw, y, t):
    e = _ease(min(1, t * 1.3))
    bx = int(80 + (1 - e) * 50)
    bw, bh = W - 160, 460
    draw.rounded_rectangle((bx, y, bx + bw, y + bh), radius=26, fill=(16, 20, 38), outline=ACCENT, width=2)
    draw.rectangle((bx, y, bx + bw, y + 72), fill=ACCENT)
    draw.text((bx + 22, y + 20), 'Gu Live Chat  ·  ● Çevrimiçi', font=_font(28, True), fill=WHITE)
    if t > 0.25:
        draw.rounded_rectangle((bx + 20, y + 100, bx + bw - 100, y + 168), radius=14, fill=(30, 36, 58))
        draw.text((bx + 36, y + 122), 'Fiyat bilgisi alabilir miyim?', font=_font(24), fill=WHITE)
    if t > 0.5:
        draw.rounded_rectangle((bx + 90, y + 188, bx + bw - 20, y + 268), radius=14, fill=INDIGO if False else ACCENT)
        draw.text((bx + 108, y + 210), 'Elbette! Hemen yardımcı oluyorum.', font=_font(24), fill=WHITE)


def _channels(draw, y, t):
    tags = ['Widget', 'WhatsApp', 'Instagram', 'E-posta']
    x = 70
    for i, tag in enumerate(tags):
        e = _ease(max(0, min(1, (t - i * 0.12) * 2.2)))
        f = _font(26, True)
        tw = f.getlength(tag) + 44
        col = ACCENT if i == 0 else (28, 34, 56)
        tc = WHITE if i == 0 else MUTED
        draw.rounded_rectangle((x, y + int((1 - e) * 20), x + int(tw), y + 58 + int((1 - e) * 20)), radius=24, fill=col)
        draw.text((x + 22, y + 14 + int((1 - e) * 20)), tag, font=f, fill=tc)
        x += int(tw) + 14


def _chart(draw, y, t):
    vals = [0.45, 0.62, 0.78, 1.0]
    for i, v in enumerate(vals):
        e = _ease(max(0, min(1, (t - i * 0.1) * 2)))
        h = int(280 * v * e)
        x = 140 + i * 190
        col = ACCENT if i < 3 else GOLD
        draw.rounded_rectangle((x, y + 280 - h, x + 120, y + 280), radius=10, fill=col)


# ─── Sahne render fonksiyonları ───────────────────────────────────

def render_01(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _brand_bar(draw, t)
    _headline(draw, 360, 'Dijital Müşteri', 58, WHITE, t)
    _headline(draw, 440, 'Deneyiminde', 58, WHITE, max(0, t - 0.08))
    _headline(draw, 520, 'Yeni Nesil Çözüm', 62, ACCENT2, max(0, t - 0.18))
    return _subtitle_bar(img, sub, _ease(min(1, t * 2)))


def render_02(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _brand_bar(draw, 1)
    _headline(draw, 380, 'Ziyaretçiniz', 64, WHITE, t)
    _headline(draw, 470, 'artık yalnız değil', 64, GOLD, max(0, t - 0.15))
    # silhouette dots = visitors
    for i in range(5):
        e = _ease(max(0, min(1, (t - i * 0.08) * 2)))
        cx = 180 + i * 150
        draw.ellipse((cx, 720, cx + 80, 800), fill=(40, 48, 78))
        draw.ellipse((cx + 20, 680, cx + 60, 720), fill=(60, 70, 100))
    return _subtitle_bar(img, sub)


def render_03(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 220, 'Canlı Sohbet Widget', 52, WHITE, t)
    _headline(draw, 290, 'Saniyeler içinde yanıt', 40, ACCENT2, max(0, t - 0.12))
    _widget_ui(draw, 400, t)
    return _subtitle_bar(img, sub)


def render_04(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 240, 'Tek Gelen Kutusu', 54, WHITE, t)
    _channels(draw, 360, t)
    items = ['🤖 AI otomatik yanıt', '📱 WhatsApp entegrasyonu', '✉️ E-posta desteği']
    for i, it in enumerate(items):
        e = _ease(max(0, min(1, (t - 0.2 - i * 0.12) * 2.5)))
        draw.rounded_rectangle((80, 480 + i * 100 + int((1 - e) * 25), W - 80, 560 + i * 100 + int((1 - e) * 25)), radius=18, fill=(22, 28, 50))
        draw.text((110, 508 + i * 100 + int((1 - e) * 25)), it, font=_font(30, True), fill=WHITE)
    return _subtitle_bar(img, sub)


def render_05(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 260, 'Dönüşümünüzü', 58, WHITE, t)
    _headline(draw, 340, 'Artırın', 72, GOLD, max(0, t - 0.12))
    _chart(draw, 620, max(0, t - 0.2))
    return _subtitle_bar(img, sub)


def render_06(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    pulse = 1 + 0.025 * math.sin(t * math.pi * 3)
    _brand_bar(draw, 1)
    _headline(draw, 400, '7 Gün PRO Ücretsiz', 52, WHITE, t)
    bw, bh = int(700 * pulse), int(104 * pulse)
    bx, by = (W - bw) // 2, 580
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=26, fill=ACCENT)
    uf = _font(44, True)
    url = 'gulivechat.com'
    draw.text(((W - uf.getlength(url)) // 2, by + 28), url, font=uf, fill=WHITE)
    _headline(draw, 760, 'Kredi kartı gerekmez', 34, MUTED, max(0, t - 0.15))
    return _subtitle_bar(img, sub)


RENDERERS: list[Callable[[float, str], Image.Image]] = [
    render_01, render_02, render_03, render_04, render_05, render_06,
]


async def _tts(text: str, path: Path) -> None:
    import edge_tts
    ssml = plain_to_ssml(text)
    comm = edge_tts.Communicate(ssml, voice=VOICE)
    await comm.save(str(path))


def _duration(path: Path) -> float:
    p = subprocess.run([_ffmpeg(), '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    for line in (p.stderr or '').split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 6.5


def _frames_to_mp4(frames: list[Image.Image], path: Path) -> None:
    ff = _ffmpeg()
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(td / f'{i:05d}.jpg', quality=94)
        subprocess.run([
            ff, '-y', '-framerate', str(FPS), '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
            str(path),
        ], check=True, capture_output=True)


def _mux(v: Path, a: Path, out: Path) -> None:
    ff = _ffmpeg()
    subprocess.run([
        ff, '-y', '-i', str(v), '-i', str(a),
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-shortest', '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _render_scene( renderer, subtitle: str, duration: float) -> list[Image.Image]:
    n = max(1, int(duration * FPS))
    return [renderer(i / max(n - 1, 1), subtitle) for i in range(n)]


def _concat(paths: list[Path], out: Path) -> None:
    ff = _ffmpeg()
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        for p in paths:
            f.write(f"file '{p.resolve()}'\n")
        lst = f.name
    subprocess.run([ff, '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', str(out)], check=True, capture_output=True)


def _add_music(video: Path, music: Path, out: Path, dur: float) -> None:
    ff = _ffmpeg()
    subprocess.run([
        ff, '-y', '-i', str(video), '-i', str(music),
        '-filter_complex', '[1:a]volume=0.22[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]',
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-t', str(dur), '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _make_music(dur: float, path: Path) -> None:
    ff = _ffmpeg()
    d = int(dur) + 1
    subprocess.run([
        ff, '-y',
        '-f', 'lavfi', '-i', f'sine=f=110:duration={d}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=146.83:duration={d}:sample_rate=44100',
        '-filter_complex',
        f'[0:a]volume=0.035[a0];[1:a]volume=0.028[a1];[a0][a1]amix=inputs=2,afade=t=in:d=2,afade=t=out:st={max(0,d-4)}:d=4',
        '-t', str(dur), str(path),
    ], check=True, capture_output=True)


async def _build_all() -> None:
    SCENES_DIR.mkdir(parents=True, exist_ok=True)
    scene_mp4s: list[Path] = []
    durations: list[float] = []

    for spec, renderer in zip(SCENES, RENDERERS):
        print(f'🎙️  Sahne {spec.id}: seslendirme...')
        audio = SCENES_DIR / f'{spec.id}.mp3'
        await _tts(spec.voice, audio)

        dur = _duration(audio)
        # Sahne süresini ses + 0.3sn nefes; toplam ~40sn için ölçekleme sonra
        durations.append(dur + 0.35)

    total_raw = sum(durations)
    scale = TARGET_TOTAL / total_raw

    silent_parts: list[Path] = []
    voiced_parts: list[Path] = []

    for spec, renderer, raw_dur in zip(SCENES, RENDERERS, durations):
        dur = raw_dur * scale
        print(f'🎬 Sahne {spec.id}: {dur:.1f} sn video...')
        frames = _render_scene(renderer, spec.subtitle, dur)
        silent = SCENES_DIR / f'{spec.id}-silent.mp4'
        voiced = SCENES_DIR / f'{spec.id}.mp4'
        _frames_to_mp4(frames, silent)
        audio = SCENES_DIR / f'{spec.id}.mp3'
        _mux(silent, audio, voiced)
        silent_parts.append(silent)
        voiced_parts.append(voiced)
        scene_mp4s.append(voiced)
        print(f'   ✅ {voiced}')

    merged = OUT_DIR / 'reel-40sn-merged.mp4'
    _concat(voiced_parts, merged)

    music = OUT_DIR / 'reel-40sn-music.mp3'
    final_dur = TARGET_TOTAL
    _make_music(final_dur, music)
    _add_music(merged, music, FINAL, final_dur)

    PREVIEW.write_text(f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — 40sn Reklam</title>
<style>
body{{margin:0;background:#0a0e1a;color:#fff;font-family:system-ui;padding:20px;text-align:center}}
video{{width:min(100%,400px);border-radius:16px;margin:12px 0}}
.grid{{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:20px}}
.grid a{{padding:10px 16px;background:#334155;border-radius:10px;color:#e2e8f0;text-decoration:none;font-size:.85rem}}
</style></head><body>
<h2>Gu Live Chat — 40 Saniye Sesli Reklam</h2>
<p>6 ayrı sahne · Profesyonel seslendirme · 9:16</p>
<video controls playsinline autoplay src="./gulivechat-reklam-40sn.mp4"></video>
<a href="./gulivechat-reklam-40sn.mp4" download style="display:inline-block;margin-top:12px;padding:12px 24px;background:#6366f1;color:#fff;border-radius:12px;text-decoration:none">Tam videoyu indir</a>
<div class="grid">
{"".join(f'<a href="./tools/imvd/output/scenes/{s.id}.mp4" download>Sahne {s.title}</a>' for s in SCENES)}
</div>
</body></html>''', encoding='utf-8')

    print(f'\n✅ Birleşik video: {FINAL}')
    print(f'📁 Ayrı sahneler: {SCENES_DIR}/')
    print(f'🌐 İzle: {PREVIEW.name}')


def main() -> None:
    print('🏆 40 saniyelik sesli reklam (6 sahne) üretiliyor...')
    asyncio.run(_build_all())


if __name__ == '__main__':
    main()
