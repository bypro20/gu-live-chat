#!/usr/bin/env python3
"""
Gu Live Chat — Instagram reel klonu (oncanreklam tarzı).
Kaynak: instagram.com/reel/DZispheMDhM
Sesli anlatım + altyazı + arka plan müziği + 9:16
"""

from __future__ import annotations

import asyncio
import math
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).parent
OUT_DIR = ROOT / 'output'
VOICE_MP3 = OUT_DIR / 'reel-instagram-voice.mp3'
MUSIC_MP3 = OUT_DIR / 'reel-instagram-music.mp3'
VIDEO_MP4 = OUT_DIR / 'reel-instagram-silent.mp4'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-instagram.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-instagram-izle.html'

W, H, FPS = 1080, 1920, 30

# Instagram gönderisindeki metin — seslendirme
SENTENCES = [
    'Gu Live Chat — Dijital Müşteri Deneyiminde Yeni Nesil Çözüm.',
    'Gu Live Chat, işletmelerin dijital dünyada müşterileriyle anında, etkili ve kesintisiz iletişim kurmasını sağlayan yeni nesil canlı destek platformudur.',
    'Modern işletmeler için geliştirilen bu sistem, ziyaretçilerin web sitenize geldiği andan itibaren onları karşılayan akıllı bir iletişim altyapısı sunar.',
    'Web sitenizi ziyaret eden her kullanıcı, artık yalnız değildir.',
    'Gu Live Chat\'in güçlü canlı sohbet widget\'ı sayesinde müşteriler sorularına saniyeler içinde yanıt alır.',
    'Satın alma kararlarını daha hızlı verir ve işletmeniz dönüşüm oranlarını artırır.',
    'Hemen başlayın — gulivechat.com',
]

VOICE = 'tr-TR-EmelNeural'  # ajans reklam tonu
VOICE_RATE = '-8%'
VOICE_PITCH = '+0Hz'

# Renkler — koyu kurumsal reel
BG1 = (8, 12, 28)
BG2 = (22, 18, 62)
ACCENT = (99, 102, 241)
ACCENT2 = (56, 189, 248)
GOLD = (251, 191, 36)
WHITE = (255, 255, 255)
SUB_BG = (0, 0, 0, 180)


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
    for r in range(300, 0, -6):
        a = int(22 * r / 300)
        gd.ellipse((W // 2 - r * 2, 120 - r // 2, W // 2 + r * 2, 120 + r), fill=(ACCENT[0], ACCENT[1], ACCENT[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
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


def _draw_subtitle(base: Image.Image, text: str, alpha: float = 1.0) -> Image.Image:
    if not text:
        return base
    img = base.convert('RGBA')
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    f = _font(34, True)
    lines = _wrap(text, f, W - 120)
    lh = 42
    box_h = len(lines) * lh + 48
    by = H - box_h - 180
    a = int(200 * alpha)
    draw.rounded_rectangle((40, by, W - 40, by + box_h), radius=20, fill=(0, 0, 0, a))
    cy = by + 24
    for line in lines:
        lw = f.getlength(line)
        draw.text(((W - lw) // 2, cy), line, font=f, fill=(255, 255, 255, int(255 * alpha)))
        cy += lh
    return Image.alpha_composite(img, overlay).convert('RGB')


def _headline(draw: ImageDraw.ImageDraw, y: int, text: str, size: int = 58, color=WHITE, t: float = 1.0) -> None:
    e = _ease(t)
    dy = int((1 - e) * 35)
    f = _font(size, True)
    for i, line in enumerate(_wrap(text, f, 920)):
        lw = f.getlength(line)
        draw.text(((W - lw) // 2, y + dy + i * (size + 8)), line, font=f, fill=color)


def _logo_header(draw: ImageDraw.ImageDraw, t: float) -> None:
    e = _ease(t)
    f = _font(36, True)
    draw.text((60, 80), '🚀', font=_font(48))
    title = 'Gu Live Chat'
    draw.text((130, 88), title, font=f, fill=WHITE)
    sub = 'gulivechat.com'
    sf = _font(24)
    draw.text((130, 132), sub, font=sf, fill=ACCENT2)


def _widget_card(draw: ImageDraw.ImageDraw, y: int, t: float) -> None:
    e = _ease(min(1.0, t * 1.5))
    bx = 80 + int((1 - e) * 40)
    bw, bh = W - 160, 420
    draw.rounded_rectangle((bx, y, bx + bw, y + bh), radius=28, fill=(20, 25, 45), outline=ACCENT, width=2)
    draw.rectangle((bx, y, bx + bw, y + 70), fill=ACCENT)
    draw.text((bx + 24, y + 18), '💬 Canlı Sohbet Widget', font=_font(30, True), fill=WHITE)
    draw.text((bx + 24, y + 100), '● Çevrimiçi · Yanıt ~30 sn', font=_font(24), fill=(110, 231, 183))
    if t > 0.3:
        draw.rounded_rectangle((bx + 24, y + 150, bx + bw - 120, y + 210), radius=16, fill=(35, 42, 70))
        draw.text((bx + 40, y + 168), 'Ürün hakkında bilgi alabilir miyim?', font=_font(22), fill=WHITE)
    if t > 0.55:
        draw.rounded_rectangle((bx + 100, y + 230, bx + bw - 24, y + 300), radius=16, fill=ACCENT)
        draw.text((bx + 120, y + 250), 'Tabii! Size hemen yardımcı oluyorum ✓', font=_font(22), fill=WHITE)


def _stats_row(draw: ImageDraw.ImageDraw, y: int, t: float) -> None:
    stats = [('Saniyeler', 'içinde yanıt'), ('Daha hızlı', 'satın alma'), ('Artan', 'dönüşüm')]
    for i, (a, b) in enumerate(stats):
        e = _ease(max(0, min(1, (t - i * 0.15) * 2)))
        x = 60 + i * ((W - 120) // 3 + 10)
        w = (W - 160) // 3
        draw.rounded_rectangle((x, y + int((1 - e) * 30), x + w, y + 140 + int((1 - e) * 30)), radius=18, fill=(25, 30, 55), outline=GOLD if i == 2 else ACCENT)
        draw.text((x + 16, y + 24 + int((1 - e) * 30)), a, font=_font(26, True), fill=GOLD if i == 2 else WHITE)
        draw.text((x + 16, y + 62 + int((1 - e) * 30)), b, font=_font(20), fill=(180, 190, 210))


def _scene_hook(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _logo_header(draw, t)
    _headline(draw, 340, 'Dijital Müşteri Deneyiminde', 52, WHITE, t)
    _headline(draw, 410, 'Yeni Nesil Çözüm', 64, ACCENT2, max(0, t - 0.15))
    return _draw_subtitle(img, sub, _ease(min(1, t * 3)))


def _scene_platform(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _logo_header(draw, 1)
    _headline(draw, 280, 'Yeni Nesil Canlı Destek', 48, WHITE, t)
    _headline(draw, 360, 'Platformu', 48, ACCENT2, max(0, t - 0.1))
    draw.rounded_rectangle((80, 520, W - 80, 720), radius=24, fill=(18, 22, 42))
    lines = [
        '✓ Anında iletişim',
        '✓ Etkili destek',
        '✓ Kesintisiz deneyim',
    ]
    for i, ln in enumerate(lines):
        e = _ease(max(0, min(1, (t - i * 0.12) * 2.5)))
        draw.text((120, 560 + i * 52 + int((1 - e) * 20)), ln, font=_font(32, True), fill=(int(255 * e), int(255 * e), int(255 * e)))
    return _draw_subtitle(img, sub)


def _scene_smart(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 220, 'Akıllı İletişim Altyapısı', 46, WHITE, t)
    _widget_card(draw, 420, t)
    return _draw_subtitle(img, sub)


def _scene_alone(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    pulse = 1 + 0.03 * math.sin(t * math.pi * 4)
    _headline(draw, 380, 'Artık yalnız değildir.', int(62 * pulse), GOLD, t)
    _headline(draw, 480, 'Her ziyaretçi karşılanır.', 40, WHITE, max(0, t - 0.2))
    return _draw_subtitle(img, sub)


def _scene_widget(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 200, 'Güçlü Canlı Sohbet Widget', 44, WHITE, t)
    _widget_card(draw, 380, t)
    _stats_row(draw, 880, max(0, t - 0.25))
    return _draw_subtitle(img, sub)


def _scene_conversion(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    _headline(draw, 300, 'Dönüşüm Oranlarınızı', 50, WHITE, t)
    _headline(draw, 380, 'Artırın', 72, GOLD, max(0, t - 0.15))
    # chart bars
    for i, h in enumerate([120, 180, 260, 340]):
        e = _ease(max(0, min(1, (t - i * 0.08) * 2)))
        bh = int(h * e)
        x = 180 + i * 180
        draw.rounded_rectangle((x, 900 - bh, x + 100, 900), radius=12, fill=ACCENT if i < 3 else GOLD)
    return _draw_subtitle(img, sub)


def _scene_cta(t: float, sub: str) -> Image.Image:
    img = _bg()
    draw = ImageDraw.Draw(img)
    pulse = 1 + 0.02 * math.sin(t * math.pi * 3)
    _logo_header(draw, 1)
    _headline(draw, 420, 'Gu Live Chat', 56, WHITE, t)
    bw, bh = int(680 * pulse), int(100 * pulse)
    bx, by = (W - bw) // 2, 620
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=24, fill=ACCENT)
    uf = _font(42, True)
    url = 'gulivechat.com'
    draw.text(((W - uf.getlength(url)) // 2, by + 26), url, font=uf, fill=WHITE)
    _headline(draw, 780, 'Ücretsiz Deneyin →', 36, ACCENT2, t)
    return _draw_subtitle(img, sub)


SCENE_FNS = [
    _scene_hook,
    _scene_platform,
    _scene_platform,
    _scene_alone,
    _scene_widget,
    _scene_conversion,
    _scene_cta,
]


def _subtitle_timeline(total: float) -> list[tuple[float, float, str]]:
    weights = [max(1, len(s)) for s in SENTENCES]
    wsum = sum(weights)
    timeline: list[tuple[float, float, str]] = []
    cur = 0.0
    for s, w in zip(SENTENCES, weights):
        dur = total * (w / wsum)
        timeline.append((cur, cur + dur, s))
        cur += dur
    return timeline


def _sub_at(timeline, t: float) -> str:
    for a, b, s in timeline:
        if a <= t < b:
            return s
    return timeline[-1][2] if timeline else ''


def _scene_at_time(t: float, total: float, timeline) -> Image.Image:
    sub = _sub_at(timeline, t)
    idx = min(len(SCENE_FNS) - 1, int(t / total * len(SCENE_FNS)))
    local_t = (t - idx * (total / len(SCENE_FNS))) / max(total / len(SCENE_FNS), 0.001)
    return SCENE_FNS[idx](max(0, min(1, local_t * 1.2)), sub)


async def _tts() -> None:
    import edge_tts
    text = '\n'.join(SENTENCES)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, voice=VOICE, rate=VOICE_RATE, pitch=VOICE_PITCH).save(str(VOICE_MP3))
    print(f'🎙️  {VOICE_MP3}')


def _duration(path: Path) -> float:
    p = subprocess.run([_ffmpeg(), '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    for line in (p.stderr or '').split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 45.0


def _make_music(duration: float) -> None:
    ff = _ffmpeg()
    # Kurumsal ambient pad (telifsiz — sentez)
    dur = int(duration) + 2
    cmd = [
        ff, '-y',
        '-f', 'lavfi', '-i', f'sine=f=130.81:duration={dur}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=164.81:duration={dur}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=196.00:duration={dur}:sample_rate=44100',
        '-filter_complex',
        '[0:a]volume=0.04[a0];[1:a]volume=0.03[a1];[2:a]volume=0.025[a2];'
        '[a0][a1][a2]amix=inputs=3:duration=first,afade=t=in:st=0:d=2,afade=t=out:st=' + str(max(0, dur - 3)) + ':d=3',
        '-t', str(duration),
        str(MUSIC_MP3),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f'🎵 {MUSIC_MP3}')


def _render_video(duration: float) -> None:
    timeline = _subtitle_timeline(duration)
    n = max(1, int(duration * FPS))
    ff = _ffmpeg()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i in range(n):
            t = i / FPS
            fr = _scene_at_time(t, duration, timeline)
            fr.save(td / f'{i:05d}.jpg', quality=94)
        subprocess.run([
            ff, '-y', '-framerate', str(FPS), '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', str(VIDEO_MP4),
        ], check=True, capture_output=True)
    print(f'🎬 {VIDEO_MP4}')


def _mux(duration: float) -> None:
    ff = _ffmpeg()
    # Ses + müzik karışımı, ses ön planda
    subprocess.run([
        ff, '-y',
        '-i', str(VIDEO_MP4),
        '-i', str(VOICE_MP3),
        '-i', str(MUSIC_MP3),
        '-filter_complex',
        '[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[voice];[2:a]volume=0.35[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]',
        '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', '-movflags', '+faststart',
        str(FINAL),
    ], check=True, capture_output=True)
    print(f'✅ {FINAL}')


def _preview() -> None:
    PREVIEW.write_text(f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — Instagram Reel</title>
<style>body{{margin:0;background:#000;color:#fff;font-family:system-ui;display:flex;flex-direction:column;align-items:center;padding:20px}}
video{{width:min(100%,400px);border-radius:16px}} a{{margin-top:16px;padding:12px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px}}</style>
</head><body>
<h2>Instagram Reel — Sesli Reklam</h2>
<video controls playsinline autoplay src="./gulivechat-reklam-instagram.mp4"></video>
<a href="./gulivechat-reklam-instagram.mp4" download>MP4 İndir</a>
</body></html>''', encoding='utf-8')


def main() -> None:
    try:
        import edge_tts  # noqa
    except ImportError:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'edge-tts', '--user', '-q'], check=True)
    print('📱 Instagram reel klonu üretiliyor (sesli + altyazı + müzik)...')
    asyncio.run(_tts())
    dur = _duration(VOICE_MP3) + 1.0
    print(f'   Süre: {dur:.1f} sn')
    _make_music(dur)
    _render_video(dur)
    _mux(dur)
    _preview()
    print(f'🌐 İzle: {PREVIEW.name}')


if __name__ == '__main__':
    main()
