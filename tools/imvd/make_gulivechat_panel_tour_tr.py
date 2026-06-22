#!/usr/bin/env python3
"""
Gu Live Chat — Panel turu (Canlı Demo) · ~50 sn · 9:16
Çıktı: ../../gulivechat-panel-demo-tr.mp4
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

from tts_brand import VOICE, plain_to_ssml

ROOT = Path(__file__).parent
SCENES_DIR = ROOT / 'output' / 'scenes-panel-tr'
OUT_DIR = ROOT / 'output'
FINAL = ROOT.parent.parent / 'gulivechat-panel-demo-tr.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-panel-demo-tr-izle.html'

W, H, FPS = 1080, 1920, 30
TARGET_TOTAL = 50.0

BG1, BG2 = (8, 10, 28), (52, 18, 72)
ACCENT, ACCENT2 = (147, 51, 234), (236, 72, 153)
ORANGE, WHITE = (249, 115, 22), (255, 255, 255)
MUTED, CARD = (148, 163, 184), (18, 22, 42)


@dataclass
class SceneSpec:
    id: str
    title: str
    voice: str
    subtitle: str


SCENES: list[SceneSpec] = [
    SceneSpec(
        '01-intro',
        'Giriş',
        'Canlı demo turuna hoş geldiniz. Gu Live Chat panelinde müşteri desteğinizi tek yerden yönetirsiniz.',
        'Panel Turu · Gu Live Chat',
    ),
    SceneSpec(
        '02-overview',
        'Genel Bakış',
        'Genel Bakış ekranında açık sohbetler, aktif ziyaretçiler ve günlük performans özetini görürsünüz.',
        'Genel Bakış · Özet panel',
    ),
    SceneSpec(
        '03-inbox',
        'Gelen Kutusu',
        'Gelen Kutusu: tüm kanallardan gelen mesajlara anında yanıt verin. Kişiler menüsünde müşteri geçmişi saklanır.',
        'Gelen Kutusu · Kişiler',
    ),
    SceneSpec(
        '04-visitors',
        'Ziyaretçiler',
        'Ziyaretçiler menüsü sitede kim olduğunu canlı gösterir. Analitik ile yanıt süresi ve dönüşüm raporlarını izleyin.',
        'Ziyaretçiler · Analitik',
    ),
    SceneSpec(
        '05-widget',
        'Widget',
        'Widget menüsünden tek satır kodla canlı sohbeti sitenize ekleyin. Kanallardan WhatsApp ve e-postayı bağlayın.',
        'Widget · Kanallar',
    ),
    SceneSpec(
        '06-automation',
        'Otomasyon',
        'Bilgi Bankası, Chatbot ve otomasyon tekrarlayan soruları yanıtlar. Ekip menüsünden temsilcilerinizi davet edin.',
        'Bilgi Bankası · Chatbot · Ekip',
    ),
    SceneSpec(
        '07-cta',
        'Kayıt',
        'Planlar ve faturalama ayarlarından paketinizi yönetin. Hemen ücretsiz kayıt olun — gulivechat.com',
        '14 gün PRO ücretsiz · gulivechat.com',
    ),
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
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
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
    for r in range(280, 0, -6):
        a = int(18 * r / 280)
        gd.ellipse((W // 2 - r * 2, 60, W // 2 + r * 2, 60 + r * 2), fill=(ACCENT[0], ACCENT[1], ACCENT[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    return Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')


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


def _headline(draw, y, text, size=54, color=WHITE, t=1.0):
    e = _ease(t)
    f = _font(size, True)
    dy = int((1 - e) * 36)
    for i, line in enumerate(_wrap(text, f, 920)):
        lw = f.getlength(line)
        draw.text(((W - lw) // 2, y + dy + i * (size + 8)), line, font=f, fill=color)


def _subtitle_bar(img: Image.Image, text: str, alpha: float = 1.0) -> Image.Image:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    f = _font(30, True)
    lines = _wrap(text, f, W - 100)
    lh = 38
    bh = len(lines) * lh + 34
    by = H - bh - 150
    draw.rounded_rectangle((50, by, W - 50, by + bh), radius=18, fill=(0, 0, 0, int(215 * alpha)))
    cy = by + 17
    for ln in lines:
        lw = f.getlength(ln)
        draw.text(((W - lw) // 2, cy), ln, font=f, fill=(255, 255, 255, int(255 * alpha)))
        cy += lh
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')


def _brand_bar(draw, t: float = 1.0):
    e = _ease(t)
    draw.rounded_rectangle((50, 68, 460, 148), radius=16, fill=(255, 255, 255, int(14 * e)))
    draw.text((72, 86), 'Gu Live Chat', font=_font(32, True), fill=WHITE)
    draw.text((72, 122), 'Panel turu', font=_font(22), fill=ACCENT2)


def _sidebar(draw, y: int, active: int, items: list[str], t: float):
    e = _ease(min(1, t * 1.4))
    sx = int(50 + (1 - e) * 30)
    sw, sh = 300, len(items) * 72 + 40
    draw.rounded_rectangle((sx, y, sx + sw, y + sh), radius=20, fill=CARD, outline=(60, 68, 96))
    draw.text((sx + 20, y + 16), 'Menü', font=_font(22, True), fill=MUTED)
    for i, label in enumerate(items):
        iy = y + 52 + i * 72
        active_row = i == active
        if active_row:
            draw.rounded_rectangle((sx + 12, iy, sx + sw - 12, iy + 58), radius=12, fill=ACCENT)
        draw.text((sx + 28, iy + 16), label, font=_font(24, active_row), fill=WHITE if active_row else MUTED)


def _stat_cards(draw, y: int, labels: list[tuple[str, str]], t: float):
    for i, (val, lbl) in enumerate(labels):
        e = _ease(max(0, min(1, (t - i * 0.1) * 2.2)))
        x = 380 + (i % 2) * 320
        row_y = y + (i // 2) * 130 + int((1 - e) * 24)
        draw.rounded_rectangle((x, row_y, x + 280, row_y + 100), radius=16, fill=(24, 30, 52))
        draw.text((x + 20, row_y + 16), val, font=_font(34, True), fill=WHITE)
        draw.text((x + 20, row_y + 58), lbl, font=_font(20), fill=MUTED)


def _menu_list(draw, y: int, items: list[str], t: float):
    for i, it in enumerate(items):
        e = _ease(max(0, min(1, (t - i * 0.08) * 2.5)))
        iy = y + i * 88 + int((1 - e) * 20)
        draw.rounded_rectangle((80, iy, W - 80, iy + 68), radius=16, fill=(22, 28, 50))
        draw.text((110, iy + 20), it, font=_font(28, True), fill=WHITE)


def render_intro(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _brand_bar(draw, t)
    _headline(draw, 360, 'Canlı Demo', 64, WHITE, t)
    _headline(draw, 450, 'Panel Turu', 64, ACCENT2, max(0, t - 0.12))
    _headline(draw, 560, 'Menüler ne işe yarar?', 38, MUTED, max(0, t - 0.22))
    return _subtitle_bar(img, sub)


def render_overview(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Genel Bakış', 56, WHITE, t)
    _sidebar(draw, 320, 0, ['Genel Bakış', 'Gelen Kutusu', 'Kişiler', 'Analitik'], t)
    _stat_cards(draw, 340, [('12', 'Açık sohbet'), ('48', 'Bugünkü mesaj'), ('5', 'Canlı ziyaretçi'), ('%94', 'Memnuniyet')], t)
    return _subtitle_bar(img, sub)


def render_inbox(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Gelen Kutusu', 56, WHITE, t)
    _sidebar(draw, 320, 1, ['Genel Bakış', 'Gelen Kutusu', 'Kişiler', 'Analitik'], t)
    bx, by, bw = 380, 360, W - 430
    draw.rounded_rectangle((bx, by, bx + bw, by + 520), radius=22, fill=(16, 20, 38), outline=ACCENT, width=2)
    if t > 0.2:
        draw.rounded_rectangle((bx + 20, by + 30, bx + bw - 120, by + 90), radius=14, fill=(30, 36, 58))
        draw.text((bx + 36, by + 50), 'Siparişim nerede?', font=_font(24), fill=WHITE)
    if t > 0.45:
        draw.rounded_rectangle((bx + 100, by + 110, bx + bw - 20, by + 170), radius=14, fill=ACCENT)
        draw.text((bx + 118, by + 130), 'Hemen kontrol ediyorum ✓', font=_font(24), fill=WHITE)
    return _subtitle_bar(img, sub)


def render_visitors(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Ziyaretçiler & Analitik', 48, WHITE, t)
    _sidebar(draw, 320, 3, ['Genel Bakış', 'Gelen Kutusu', 'Ziyaretçiler', 'Analitik'], t)
    for i in range(4):
        e = _ease(max(0, min(1, (t - i * 0.1) * 2)))
        x = 400 + (i % 2) * 300
        y = 400 + (i // 2) * 140 + int((1 - e) * 20)
        draw.rounded_rectangle((x, y, x + 260, y + 100), radius=14, fill=(24, 30, 52))
        draw.text((x + 20, y + 22), f'Ziyaretçi {i + 1}', font=_font(24, True), fill=WHITE)
        draw.text((x + 20, y + 58), '/fiyatlandirma', font=_font(20), fill=ACCENT2)
    return _subtitle_bar(img, sub)


def render_widget(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Widget & Kanallar', 50, WHITE, t)
    _menu_list(draw, 340, ['📋 Widget kodu — sitene yapıştır', '💬 WhatsApp Business', '✉️ E-posta gelen kutusu', '📱 Instagram & Telegram'], t)
    return _subtitle_bar(img, sub)


def render_automation(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Otomasyon', 56, WHITE, t)
    _menu_list(draw, 340, ['📚 Bilgi Bankası makaleleri', '🤖 AI Chatbot kuralları', '⚡ Otomasyon workflow', '👥 Ekip davet et'], t)
    return _subtitle_bar(img, sub)


def render_cta(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    pulse = 1 + 0.02 * math.sin(t * math.pi * 3)
    _brand_bar(draw, 1)
    _headline(draw, 380, '14 Gün PRO Ücretsiz', 52, WHITE, t)
    bw, bh = int(720 * pulse), int(108 * pulse)
    bx, by = (W - bw) // 2, 560
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=26, fill=ACCENT)
    uf = _font(40, True)
    url = 'gulivechat.com/register'
    draw.text(((W - uf.getlength(url)) // 2, by + 32), url, font=uf, fill=WHITE)
    _headline(draw, 740, 'Kredi kartı gerekmez', 34, MUTED, max(0, t - 0.15))
    return _subtitle_bar(img, sub)


RENDERERS: list[Callable[[float, str], Image.Image]] = [
    render_intro,
    render_overview,
    render_inbox,
    render_visitors,
    render_widget,
    render_automation,
    render_cta,
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
        '-f', 'lavfi', '-i', f'sine=f=110:duration={d}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=146.83:duration={d}:sample_rate=44100',
        '-filter_complex',
        f'[0:a]volume=0.03[a0];[1:a]volume=0.025[a1];[a0][a1]amix=inputs=2,afade=t=in:d=2,afade=t=out:st={max(0,d-4)}:d=4',
        '-t', str(dur), str(path),
    ], check=True, capture_output=True)


async def _build_all() -> None:
    SCENES_DIR.mkdir(parents=True, exist_ok=True)
    durations: list[float] = []

    for spec in SCENES:
        print(f'🎙️  Sahne {spec.id}: seslendirme...')
        audio = SCENES_DIR / f'{spec.id}.mp3'
        await _tts(spec.voice, audio)
        durations.append(_duration(audio) + 0.35)

    scale = TARGET_TOTAL / sum(durations)
    voiced_parts: list[Path] = []

    for spec, renderer, raw_dur in zip(SCENES, RENDERERS, durations):
        dur = raw_dur * scale
        print(f'🎬 Sahne {spec.id}: {dur:.1f} sn video...')
        frames = _render_scene(renderer, spec.subtitle, dur)
        silent = SCENES_DIR / f'{spec.id}-silent.mp4'
        voiced = SCENES_DIR / f'{spec.id}.mp4'
        _frames_to_mp4(frames, silent)
        _mux(silent, SCENES_DIR / f'{spec.id}.mp3', voiced)
        voiced_parts.append(voiced)

    merged = OUT_DIR / 'panel-tour-merged.mp4'
    _concat(voiced_parts, merged)
    music = OUT_DIR / 'panel-tour-music.mp3'
    _make_music(TARGET_TOTAL, music)
    _add_music(merged, music, FINAL, TARGET_TOTAL)

    PREVIEW.write_text(f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — Panel Turu</title>
<style>
body{{margin:0;background:#0a0e1a;color:#fff;font-family:system-ui;padding:20px;text-align:center}}
video{{width:min(100%,420px);border-radius:16px;margin:12px 0;box-shadow:0 20px 60px #0008}}
a{{display:inline-block;margin:8px;padding:12px 22px;background:#9333ea;color:#fff;border-radius:12px;text-decoration:none}}
</style></head><body>
<h2>Gu Live Chat — Panel Turu (Canlı Demo)</h2>
<p>Menüler ne işe yarar? · ~50 sn · Türkçe seslendirme</p>
<video controls playsinline src="./gulivechat-panel-demo-tr.mp4"></video><br>
<a href="./gulivechat-panel-demo-tr.mp4" download>Videoyu indir</a>
<a href="/register">Ücretsiz Başla</a>
</body></html>''', encoding='utf-8')

    print(f'\n✅ Video: {FINAL}')
    print(f'🌐 İzle: {PREVIEW.name}')


def main() -> None:
    print('🎬 Panel turu videosu üretiliyor...')
    asyncio.run(_build_all())


if __name__ == '__main__':
    main()
