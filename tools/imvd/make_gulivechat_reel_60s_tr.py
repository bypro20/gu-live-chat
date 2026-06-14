#!/usr/bin/env python3
"""
Gu Live Chat — 60 sn Türkçe motion-graphics reklam (9:16).
Çıktı: ../../gulivechat-reklam-60sn.mp4
"""

from __future__ import annotations

import asyncio
import math
import random
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from tts_brand import plain_to_ssml

ROOT = Path(__file__).parent
SCENES_DIR = ROOT / 'output' / 'scenes-tr'
OUT_DIR = ROOT / 'output'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-60sn.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-60sn-izle.html'

W, H, FPS = 1080, 1920, 30
TARGET_TOTAL = 60.0

BG1, BG2 = (4, 8, 22), (18, 12, 52)
ACCENT, ACCENT2 = (99, 102, 241), (56, 189, 248)
TEAL, GOLD, WHITE = (45, 212, 191), (251, 191, 36), (255, 255, 255)
MUTED, CARD = (148, 163, 184), (14, 18, 36)

VOICE = 'tr-TR-EmelNeural'
VOICE_RATE = '-8%'
VOICE_PITCH = '-1Hz'

SCENES_VOICE = [
    'Gu Live Chat. Dijital müşteri deneyiminde… hepsi bir arada yeni nesil platform.',
    'Web sitenize gelen her ziyaretçi… anında ve kişisel bir ilgi hak ediyor.',
    'Şık canlı sohbet widget\'ını ekleyin. Saniyeler içinde sitenizden yanıt verin.',
    'Yapay zeka otomatik yanıtlar… sık sorulan soruları yedi gün yirmi dört saat yanıtlar.',
    'WhatsApp, e-posta ve sosyal kanallar… tek gelen kutusunda birleşir.',
    'Ekibiniz zahmetsizce iş birliği yapar. Hiçbir fırsatı kaçırmayın.',
    'Daha hızlı yanıtlar… daha yüksek dönüşüm ve mutlu müşteriler demektir.',
    'Yedi gün PRO ücretsiz deneyin. Kredi kartı gerekmez. gulivechat.com',
]

SCENES_SUBTITLE = [
    'Gu Live Chat — Yeni Nesil Platform',
    'Her Ziyaretçi Önemli',
    'Canlı Sohbet Widget',
    'AI Yanıt · 7/24',
    'Tek Gelen Kutusu',
    'Ekip İş Birliği',
    'Dönüşümünüzü Artırın',
    'gulivechat.com — Ücretsiz Başla',
]

# Sabit parçacıklar (tutarlı render)
random.seed(42)
PARTICLES = [(random.randint(0, W), random.randint(0, H), random.randint(2, 5), random.random()) for _ in range(48)]


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
            ('intro', 'Intro', SCENES_VOICE[0], SCENES_SUBTITLE[0]),
            ('visitors', 'Visitors', SCENES_VOICE[1], SCENES_SUBTITLE[1]),
            ('widget', 'Widget', SCENES_VOICE[2], SCENES_SUBTITLE[2]),
            ('ai', 'AI', SCENES_VOICE[3], SCENES_SUBTITLE[3]),
            ('inbox', 'Inbox', SCENES_VOICE[4], SCENES_SUBTITLE[4]),
            ('team', 'Team', SCENES_VOICE[5], SCENES_SUBTITLE[5]),
            ('growth', 'Growth', SCENES_VOICE[6], SCENES_SUBTITLE[6]),
            ('cta', 'CTA', SCENES_VOICE[7], SCENES_SUBTITLE[7]),
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


def _bg(frame_t: float = 0.0) -> Image.Image:
    img = Image.new('RGB', (W, H), BG1)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = tuple(int(BG1[i] * (1 - t) + BG2[i] * t) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    pulse = 0.85 + 0.15 * math.sin(frame_t * math.pi * 2)
    for cx, cy, r_base in [(W // 2, 200, 280), (200, H // 2, 180), (W - 180, H - 400, 200)]:
        for r in range(int(r_base * pulse), 0, -6):
            a = int(22 * r / r_base)
            gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(ACCENT[0], ACCENT[1], ACCENT[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')

    dots = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    for px, py, sz, ph in PARTICLES:
        drift = math.sin(frame_t * math.pi * 2 + ph * 6.28) * 12
        a = int(40 + 30 * math.sin(frame_t * math.pi + ph * 3))
        dd.ellipse((px + drift - sz, py - sz * 2, px + drift + sz, py), fill=(ACCENT2[0], ACCENT2[1], ACCENT2[2], a))
    img = Image.alpha_composite(img.convert('RGBA'), dots).convert('RGB')

    vig = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.ellipse((-140, -100, W + 140, H + 220), fill=(0, 0, 0, 110))
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


def _headline(draw, y, text, size=56, color=WHITE, t=1.0):
    e = _ease(t)
    f = _font(size, True)
    dy = int((1 - e) * 36)
    for i, line in enumerate(_wrap(text, f, 920)):
        lw = f.getlength(line)
        x = (W - lw) // 2
        draw.text((x, y + dy + i * (size + 12)), line, font=f, fill=color)
        if i == 0 and e > 0.5:
            uw = min(lw, 200) * e
            draw.rounded_rectangle((x, y + dy + size + 4, x + uw, y + dy + size + 8), radius=2, fill=ACCENT2)


def _subtitle_bar(img: Image.Image, text: str, alpha: float = 1.0) -> Image.Image:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    f = _font(30, True)
    lines = _wrap(text, f, W - 100)
    lh = 38
    bh = len(lines) * lh + 32
    by = H - bh - 140
    draw.rounded_rectangle((44, by, W - 44, by + bh), radius=20, fill=(ACCENT[0], ACCENT[1], ACCENT[2], int(45 * alpha)))
    draw.rounded_rectangle((44, by, W - 44, by + bh), radius=20, outline=(255, 255, 255, int(40 * alpha)), width=1)
    cy = by + 16
    for ln in lines:
        lw = f.getlength(ln)
        draw.text(((W - lw) // 2, cy), ln, font=f, fill=(255, 255, 255, int(255 * alpha)))
        cy += lh
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')


def _brand_bar(draw, t: float):
    e = _ease(t)
    draw.rounded_rectangle((44, 64, 460, 148), radius=18, fill=(255, 255, 255, int(14 * e)))
    draw.ellipse((64, 84, 104, 124), fill=ACCENT)
    draw.text((118, 82), 'Gu Live Chat', font=_font(32, True), fill=WHITE)
    draw.text((118, 118), 'gulivechat.com', font=_font(20), fill=TEAL)


def _scene_badge(draw, n: int, total: int, t: float):
    e = _ease(t)
    label = f'{n}/{total}'
    f = _font(22, True)
    tw = f.getlength(label) + 28
    draw.rounded_rectangle((W - int(tw) - 44, 78, W - 44, 118), radius=14, fill=(255, 255, 255, int(18 * e)))
    draw.text((W - tw - 30, 86), label, font=f, fill=MUTED)


def _widget_ui(draw, y, t):
    e = _ease(min(1, t * 1.2))
    bx = int(64 + (1 - e) * 40)
    bw, bh = W - 128, 500
    draw.rounded_rectangle((bx, y, bx + bw, y + bh), radius=28, fill=CARD, outline=ACCENT, width=2)
    draw.rounded_rectangle((bx, y, bx + bw, y + 76), radius=28, fill=ACCENT)
    draw.rectangle((bx, y + 38, bx + bw, y + 76), fill=ACCENT)
    draw.text((bx + 24, y + 22), 'Gu Live Chat  ·  Çevrimiçi', font=_font(26, True), fill=WHITE)
    if t > 0.2:
        e2 = _ease(min(1, (t - 0.2) * 2.5))
        draw.rounded_rectangle((bx + 20, y + 100, bx + bw - 90, y + 172), radius=16, fill=(24, 30, 52))
        draw.text((bx + 36, y + 124), 'Fiyat bilgisi alabilir miyim?', font=_font(24), fill=WHITE)
    if t > 0.45:
        e3 = _ease(min(1, (t - 0.45) * 2.5))
        draw.rounded_rectangle((bx + 80, y + 192, bx + bw - 20, y + 276), radius=16, fill=ACCENT)
        draw.text((bx + 100, y + 216), 'Elbette! Hemen yardımcı oluyorum.', font=_font(24), fill=WHITE)
    if t > 0.65:
        draw.ellipse((bx + bw - 56, y + bh - 56, bx + bw - 16, y + bh - 16), fill=TEAL)
        draw.text((bx + bw - 48, y + bh - 50), '💬', font=_font(22))


def _feature_row(draw, y, items: list[str], t: float):
    for i, item in enumerate(items):
        e = _ease(max(0, min(1, (t - i * 0.1) * 2.2)))
        ry = y + i * 108 + int((1 - e) * 24)
        draw.rounded_rectangle((64, ry, W - 64, ry + 88), radius=20, fill=(20, 26, 48))
        draw.rounded_rectangle((64, ry, 76, ry + 88), radius=20, fill=ACCENT)
        draw.text((96, ry + 28), item, font=_font(28, True), fill=WHITE)


def _inbox_channels(draw, y, t):
    tags = ['Canlı Sohbet', 'WhatsApp', 'E-posta', 'Instagram']
    colors = [ACCENT, (37, 211, 102), (234, 88, 12), (219, 39, 119)]
    x = 64
    for i, (tag, col) in enumerate(zip(tags, colors)):
        e = _ease(max(0, min(1, (t - i * 0.1) * 2.2)))
        f = _font(24, True)
        tw = f.getlength(tag) + 40
        draw.rounded_rectangle((x, y + int((1 - e) * 18), x + int(tw), y + 56 + int((1 - e) * 18)), radius=22, fill=col)
        draw.text((x + 20, y + 14 + int((1 - e) * 18)), tag, font=f, fill=WHITE)
        x += int(tw) + 12


def _chart(draw, y, t):
    labels = ['Hafta 1', 'Hafta 2', 'Hafta 3', 'Şimdi']
    vals = [0.4, 0.58, 0.76, 1.0]
    for i, (v, lb) in enumerate(zip(vals, labels)):
        e = _ease(max(0, min(1, (t - i * 0.08) * 2)))
        h = int(260 * v * e)
        x = 120 + i * 200
        col = ACCENT if i < 3 else GOLD
        draw.rounded_rectangle((x, y + 260 - h, x + 130, y + 260), radius=12, fill=col)
        lf = _font(20)
        draw.text((x + (130 - lf.getlength(lb)) // 2, y + 272), lb, font=lf, fill=MUTED)


def _team_avatars(draw, y, t):
    names = ['Ayşe', 'Mehmet', 'Zeynep']
    for i, name in enumerate(names):
        e = _ease(max(0, min(1, (t - i * 0.12) * 2)))
        cx = 180 + i * 260
        r = int(50 * e)
        draw.ellipse((cx - r, y - r, cx + r, y + r), fill=ACCENT if i == 0 else (40, 48, 72))
        draw.text((cx - _font(22).getlength(name) // 2, y + 70), name, font=_font(22, True), fill=WHITE)


# ─── Sahne render ─────────────────────────────────────────────────

def render_01(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _brand_bar(draw, t)
    _scene_badge(draw, 1, 8, t)
    _headline(draw, 340, 'Modern Müşteri', 56, WHITE, t)
    _headline(draw, 420, 'Deneyimi', 56, WHITE, max(0, t - 0.07))
    _headline(draw, 500, 'Artık Kolay', 64, TEAL, max(0, t - 0.16))
    return _subtitle_bar(img, sub, _ease(min(1, t * 2)))


def render_02(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _brand_bar(draw, 1)
    _scene_badge(draw, 2, 8, t)
    _headline(draw, 360, 'Her Ziyaretçi', 60, WHITE, t)
    _headline(draw, 450, 'İlgi Görmeyi Hak Eder', 48, GOLD, max(0, t - 0.12))
    for i in range(6):
        e = _ease(max(0, min(1, (t - i * 0.06) * 2)))
        cx = 120 + (i % 3) * 300
        cy = 720 + (i // 3) * 120
        draw.ellipse((cx, cy, cx + 72, cy + 72), fill=(32, 40, 68))
        draw.ellipse((cx + 18, cy - 28, cx + 54, cy + 8), fill=(55, 65, 95))
        if e > 0.5:
            draw.ellipse((cx + 52, cy - 8, cx + 68, cy + 8), fill=TEAL)
    return _subtitle_bar(img, sub)


def render_03(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _scene_badge(draw, 3, 8, t)
    _headline(draw, 200, 'Canlı Sohbet Widget', 50, WHITE, t)
    _headline(draw, 268, 'Saniyeler İçinde Yanıt', 38, ACCENT2, max(0, t - 0.1))
    _widget_ui(draw, 380, t)
    return _subtitle_bar(img, sub)


def render_04(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _scene_badge(draw, 4, 8, t)
    _headline(draw, 220, 'AI Otomatik Yanıt', 54, WHITE, t)
    _headline(draw, 296, '7 / 24 Destek', 44, TEAL, max(0, t - 0.1))
    _feature_row(draw, 420, [
        'SSS\'lere anında yanıt',
        'Ekibe akıllı yönlendirme',
        'İşinize özel öğrenir',
    ], t)
    return _subtitle_bar(img, sub)


def render_05(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _scene_badge(draw, 5, 8, t)
    _headline(draw, 230, 'Tek Gelen Kutusu', 52, WHITE, t)
    _inbox_channels(draw, 340, t)
    draw.rounded_rectangle((64, 440, W - 64, 900), radius=24, fill=(12, 16, 32), outline=(255, 255, 255, 30))
    msgs = [('Ziyaretçi', 'Merhaba, fiyat bilgisi alabilir miyim?'), ('Siz', 'Tabii — hemen gönderiyorum')]
    for i, (who, msg) in enumerate(msgs):
        e = _ease(max(0, min(1, (t - 0.25 - i * 0.15) * 2.5)))
        my = 480 + i * 180 + int((1 - e) * 20)
        col = (24, 30, 52) if who == 'Ziyaretçi' else ACCENT
        draw.rounded_rectangle((90, my, W - 90, my + 120), radius=18, fill=col)
        draw.text((110, my + 20), who, font=_font(22, True), fill=TEAL if who == 'Ziyaretçi' else WHITE)
        draw.text((110, my + 52), msg, font=_font(26), fill=WHITE)
    return _subtitle_bar(img, sub)


def render_06(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _scene_badge(draw, 6, 8, t)
    _headline(draw, 240, 'Ekibiniz', 58, WHITE, t)
    _headline(draw, 320, 'Birlikte Çalışır', 58, ACCENT2, max(0, t - 0.1))
    _team_avatars(draw, 620, t)
    _feature_row(draw, 780, ['Ortak gelen kutusu', 'Anlık bildirimler'], max(0, t - 0.2))
    return _subtitle_bar(img, sub)


def render_07(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    _scene_badge(draw, 7, 8, t)
    _headline(draw, 240, 'Daha Yüksek', 54, WHITE, t)
    _headline(draw, 320, 'Dönüşüm', 54, GOLD, max(0, t - 0.1))
    _chart(draw, 580, max(0, t - 0.15))
    f = _font(36, True)
    stat = '+%47 etkileşim'
    e = _ease(max(0, min(1, (t - 0.4) * 2)))
    draw.text(((W - f.getlength(stat)) // 2, 920), stat, font=f, fill=TEAL if e > 0.5 else MUTED)
    return _subtitle_bar(img, sub)


def render_08(t, sub):
    img = _bg(t)
    draw = ImageDraw.Draw(img)
    pulse = 1 + 0.03 * math.sin(t * math.pi * 4)
    _brand_bar(draw, 1)
    _scene_badge(draw, 8, 8, t)
    _headline(draw, 360, '7 Gün PRO Ücretsiz', 50, WHITE, t)
    _headline(draw, 440, 'Kredi Kartı Gerekmez', 44, TEAL, max(0, t - 0.1))
    bw, bh = int(720 * pulse), int(108 * pulse)
    bx, by = (W - bw) // 2, 560
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=28, fill=ACCENT)
    uf = _font(42, True)
    url = 'gulivechat.com'
    draw.text(((W - uf.getlength(url)) // 2, by + 30), url, font=uf, fill=WHITE)
    return _subtitle_bar(img, sub)


RENDERERS = [render_01, render_02, render_03, render_04, render_05, render_06, render_07, render_08]


async def _tts(text: str, path: Path) -> None:
    import edge_tts
    ssml = plain_to_ssml(text, voice=VOICE, rate=VOICE_RATE, pitch=VOICE_PITCH)
    await edge_tts.Communicate(ssml, voice=VOICE).save(str(path))


def _duration(path: Path) -> float:
    p = subprocess.run([_ffmpeg(), '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    for line in (p.stderr or '').split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 7.0


def _frames_to_mp4(frames: list[Image.Image], path: Path) -> None:
    ff = _ffmpeg()
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(td / f'{i:05d}.jpg', quality=95)
        subprocess.run([
            ff, '-y', '-framerate', str(FPS), '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
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


def _render_scene(renderer, subtitle: str, duration: float) -> list[Image.Image]:
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
        '-filter_complex', '[1:a]volume=0.18[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]',
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-t', str(dur), '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _make_music(dur: float, path: Path) -> None:
    ff = _ffmpeg()
    d = int(dur) + 1
    subprocess.run([
        ff, '-y',
        '-f', 'lavfi', '-i', f'sine=f=130.81:duration={d}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=164.81:duration={d}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=196.00:duration={d}:sample_rate=44100',
        '-filter_complex',
        f'[0:a]volume=0.028[a0];[1:a]volume=0.022[a1];[2:a]volume=0.018[a2];'
        f'[a0][a1][a2]amix=inputs=3,afade=t=in:d=2,afade=t=out:st={max(0, d - 5)}:d=5',
        '-t', str(dur), str(path),
    ], check=True, capture_output=True)


async def _build_all() -> None:
    SCENES_DIR.mkdir(parents=True, exist_ok=True)
    durations: list[float] = []

    for spec in SCENES:
        print(f'🎙️  {spec.id}: voiceover...')
        audio = SCENES_DIR / f'{spec.id}.mp3'
        await _tts(spec.voice, audio)
        durations.append(_duration(audio) + 0.4)

    scale = TARGET_TOTAL / sum(durations)
    voiced: list[Path] = []

    for spec, renderer, raw in zip(SCENES, RENDERERS, durations):
        dur = raw * scale
        print(f'🎬 {spec.id}: {dur:.1f}s render...')
        silent = SCENES_DIR / f'{spec.id}-silent.mp4'
        voiced_path = SCENES_DIR / f'{spec.id}.mp4'
        _frames_to_mp4(_render_scene(renderer, spec.subtitle, dur), silent)
        _mux(silent, SCENES_DIR / f'{spec.id}.mp3', voiced_path)
        voiced.append(voiced_path)
        print(f'   ✅ {voiced_path}')

    merged = OUT_DIR / 'reel-60s-tr-merged.mp4'
    _concat(voiced, merged)
    music = OUT_DIR / 'reel-60s-tr-music.mp3'
    _make_music(TARGET_TOTAL, music)
    _add_music(merged, music, FINAL, TARGET_TOTAL)

    PREVIEW.write_text(f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — 60sn Reklam</title>
<style>body{{margin:0;background:#060a14;color:#fff;font-family:system-ui;padding:24px;text-align:center}}
video{{width:min(100%,420px);border-radius:18px;box-shadow:0 24px 80px #0009;margin:16px 0}}
a{{display:inline-block;margin:8px;padding:14px 26px;background:#6366f1;color:#fff;border-radius:12px;text-decoration:none;font-weight:600}}
</style></head><body>
<h2>Gu Live Chat — 60 Saniye Reklam (Türkçe)</h2>
<p>8 sahne · Motion graphics · 9:16 dikey</p>
<video controls playsinline autoplay src="./gulivechat-reklam-60sn.mp4"></video><br>
<a href="./gulivechat-reklam-60sn.mp4" download>Videoyu indir</a>
<a href="./videolar.html">Tüm videolar</a>
</body></html>''', encoding='utf-8')

    print(f'\n✅ {FINAL} ({FINAL.stat().st_size // 1024} KB)')


def main() -> None:
    print('🏆 60 sn Türkçe motion-graphics reklam (8 sahne)...')
    asyncio.run(_build_all())


if __name__ == '__main__':
    main()
