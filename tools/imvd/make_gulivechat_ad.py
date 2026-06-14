#!/usr/bin/env python3
"""
Gu Live Chat — Profesyonel 9:16 Instagram/TikTok reklam videosu.
Site tasarımıyla uyumlu: #fafbff arka plan, indigo marka, widget mockup.
API gerekmez — Pillow + ffmpeg.
"""

from __future__ import annotations

import math
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
FPS = 30
OUT = Path(__file__).parent / 'output' / 'gulivechat-reel-pro.mp4'

# gulivechat.com marketing tokens
BG = (250, 251, 255)
SLATE900 = (15, 23, 42)
SLATE700 = (51, 65, 85)
SLATE500 = (100, 116, 139)
SLATE200 = (226, 232, 240)
SLATE100 = (241, 245, 249)
INDIGO = (99, 102, 241)
INDIGO600 = (79, 70, 229)
VIOLET = (124, 58, 237)
CYAN = (34, 211, 238)
GREEN = (16, 185, 129)
WHITE = (255, 255, 255)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _blend(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(_lerp(c1[i], c2[i], t)) for i in range(3))  # type: ignore


def _grid_bg() -> Image.Image:
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)
    step = 48
    for x in range(0, W, step):
        draw.line([(x, 0), (x, H)], fill=(99, 102, 241, 8) if False else (238, 242, 255))
    for y in range(0, H, step):
        draw.line([(0, y), (W, y)], fill=(238, 242, 255))
    # aurora glow
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.22)
    for r in range(280, 0, -4):
        alpha = int(14 * (r / 280))
        gd.ellipse((cx - r * 2, cy - r, cx + r * 2, cy + r), fill=(INDIGO[0], INDIGO[1], INDIGO[2], alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    img.paste(glow, (0, 0), glow)
    return img


def _wrap(text: str, font: ImageFont.ImageFont, max_w: int) -> list[str]:
    words = text.split()
    lines, cur = [], ''
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


def _text_block(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    lines: list[str],
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    align: str = 'center',
    gap: int = 10,
    max_w: int = 920,
) -> int:
    wrapped: list[str] = []
    for line in lines:
        wrapped.extend(_wrap(line, font, max_w))
    lh = font.getbbox('Ag')[3] - font.getbbox('Ag')[1]
    cy = y
    for line in wrapped:
        lw = font.getlength(line)
        tx = x if align == 'left' else (W - lw) // 2 if align == 'center' else x - lw
        draw.text((tx, cy), line, font=font, fill=fill)
        cy += lh + gap
    return cy


def _gradient_text(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, font: ImageFont.ImageFont) -> None:
    """Simulate gradient brand text with layered draw."""
    lw = font.getlength(text)
    tx = (W - lw) // 2
    draw.text((tx + 1, y + 1), text, font=font, fill=(INDIGO[0], INDIGO[1], INDIGO[2], 40))
    draw.text((tx, y), text, font=font, fill=INDIGO600)


def _badge(draw: ImageDraw.ImageDraw, y: int, text: str, t: float = 1.0) -> None:
    f = _font(28)
    pad_x, pad_y = 28, 14
    tw = f.getlength(text)
    bw, bh = int(tw + pad_x * 2), 56
    bx = (W - bw) // 2
    e = _ease(t)
    by = y + int((1 - e) * 20)
    alpha = int(255 * e)
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=28, fill=WHITE, outline=SLATE200)
    draw.text((bx + pad_x, by + pad_y - 2), text, font=f, fill=(INDIGO[0], INDIGO[1], INDIGO[2]))


def _logo_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int = 48) -> None:
    r = size // 2
    draw.rounded_rectangle((cx - r, cy - r, cx + r, cy + r), radius=14, fill=INDIGO)
    # chat bubble
    bx, by = cx - r // 2, cy - r // 3
    draw.ellipse((bx - 8, by - 8, bx + 8, by + 8), fill=WHITE)
    draw.ellipse((bx + 14, by - 4, bx + 22, by + 4), fill=WHITE)
    draw.ellipse((bx + 26, by, bx + 32, by + 6), fill=WHITE)


def _logo_full(draw: ImageDraw.ImageDraw, y: int, scale: float = 1.0) -> None:
    s = scale
    f1 = _font(int(42 * s), True)
    f2 = _font(int(42 * s), True)
    mark_x = W // 2 - int(180 * s)
    _logo_mark(draw, mark_x, y + int(24 * s), int(48 * s))
    draw.text((mark_x + int(40 * s), y), 'Gu Live ', font=f1, fill=SLATE900)
    chat_w = f2.getlength('Chat')
    draw.text((mark_x + int(40 * s) + f1.getlength('Gu Live '), y), 'Chat', font=f2, fill=INDIGO)


def _browser_widget(draw: ImageDraw.ImageDraw, y: int, chat_step: float) -> None:
    """Crisp/Tidio tarzı tarayıcı + widget mockup."""
    bx, bw, bh = 80, W - 160, 680
    draw.rounded_rectangle((bx, y, bx + bw, y + bh), radius=28, fill=WHITE, outline=SLATE200, width=2)
    # chrome
    draw.rectangle((bx, y, bx + bw, y + 56), fill=SLATE100)
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        draw.ellipse((bx + 24 + i * 28, y + 18, bx + 40 + i * 28, y + 34), fill=c)
    url_f = _font(22)
    url = 'sizin-siteniz.com'
    uw = url_f.getlength(url)
    draw.rounded_rectangle(((W - uw) // 2 - 20, y + 12, (W + uw) // 2 + 20, y + 44), radius=8, fill=WHITE, outline=SLATE200)
    draw.text(((W - uw) // 2, y + 16), url, font=url_f, fill=SLATE500)
    # page skeleton
    py = y + 80
    draw.rounded_rectangle((bx + 32, py, bx + 200, py + 28), radius=6, fill=SLATE200)
    draw.rounded_rectangle((bx + 32, py + 44, bx + bw - 80, py + 58), radius=4, fill=SLATE100)
    draw.rounded_rectangle((bx + 32, py + 72, bx + bw - 200, py + 86), radius=4, fill=SLATE100)
    for i in range(3):
        draw.rounded_rectangle((bx + 32 + i * 130, py + 120, bx + 150 + i * 130, py + 240), radius=12, fill=SLATE100)
    # widget
    wx = bx + bw - 340
    wy = y + bh - 380
    ww, wh = 300, 340
    e = _ease(min(1.0, chat_step * 2))
    offset = int((1 - e) * 30)
    draw.rounded_rectangle((wx, wy + offset, wx + ww, wy + wh + offset), radius=22, fill=WHITE, outline=(199, 210, 254), width=2)
    # header gradient bar
    for i in range(ww):
        t = i / ww
        col = _blend(INDIGO600, VIOLET, t)
        draw.line([(wx + i, wy + offset), (wx + i, wy + 56 + offset)], fill=col)
    wf = _font(20, True)
    draw.text((wx + 16, wy + 12 + offset), 'Gu Live Chat', font=wf, fill=WHITE)
    sf = _font(16)
    draw.text((wx + 16, wy + 36 + offset), '● Çevrimiçi · ~30 sn yanıt', font=sf, fill=(187, 247, 208))
    # messages
    mf = _font(18)
    if chat_step > 0.15:
        m1e = _ease(min(1.0, (chat_step - 0.15) * 3))
        draw.rounded_rectangle((wx + 14, wy + 72 + offset, wx + ww - 60, wy + 120 + offset), radius=14, fill=SLATE100)
        draw.text((wx + 24, wy + 86 + offset), 'Bu ürün stokta mı?', font=mf, fill=SLATE700)
    if chat_step > 0.45:
        m2e = _ease(min(1.0, (chat_step - 0.45) * 3))
        draw.rounded_rectangle((wx + 50, wy + 132 + offset, wx + ww - 14, wy + 188 + offset), radius=14, fill=INDIGO)
        draw.text((wx + 62, wy + 146 + offset), 'Evet! Hemen\nsipariş verebilirsiniz ✓', font=mf, fill=WHITE)
    if chat_step > 0.7:
        draw.rounded_rectangle((wx + 14, wy + wh - 58 + offset, wx + ww - 14, wy + wh - 14 + offset), radius=12, fill=SLATE100)
        draw.text((wx + 24, wy + wh - 46 + offset), 'Mesajınızı yazın...', font=sf, fill=SLATE500)


def _stat_cards(draw: ImageDraw.ImageDraw, y: int, t: float) -> None:
    stats = [
        ('30 sn', 'Kurulum'),
        ('7 gün', 'PRO deneme'),
        ('50+', 'Dil'),
        ('KVKK', 'Uyumlu'),
    ]
    gap = 16
    cw = (W - 80 - gap * 3) // 4
    for i, (val, lbl) in enumerate(stats):
        e = _ease(max(0.0, min(1.0, (t - i * 0.08) * 2.5)))
        x = 40 + i * (cw + gap)
        dy = int((1 - e) * 24)
        draw.rounded_rectangle((x, y + dy, x + cw, y + dy + 130), radius=18, fill=WHITE, outline=SLATE200)
        vf = _font(34, True)
        lf = _font(18)
        vw = vf.getlength(val)
        draw.text((x + (cw - vw) // 2, y + 28 + dy), val, font=vf, fill=INDIGO)
        lw = lf.getlength(lbl)
        draw.text((x + (cw - lw) // 2, y + 78 + dy), lbl, font=lf, fill=SLATE500)


def _feature_card(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, icon: str, title: str, desc: str, t: float) -> None:
    e = _ease(t)
    dy = int((1 - e) * 20)
    draw.rounded_rectangle((x, y + dy, x + w, y + h + dy), radius=22, fill=WHITE, outline=SLATE200)
    draw.text((x + 24, y + 20 + dy), icon, font=_font(36))
    draw.text((x + 24, y + 68 + dy), title, font=_font(28, True), fill=SLATE900)
    _text_block(draw, x + 24, y + 108 + dy, [desc], _font(22), SLATE500, align='left', gap=6, max_w=w - 48)


def _channels_row(draw: ImageDraw.ImageDraw, y: int, t: float) -> None:
    channels = ['Widget', 'WhatsApp', 'Instagram', 'E-posta', 'Telegram']
    f = _font(24, True)
    total_w = sum(f.getlength(c) + 48 for c in channels) + 16 * (len(channels) - 1)
    x = (W - total_w) // 2
    for i, ch in enumerate(channels):
        e = _ease(max(0.0, min(1.0, (t - i * 0.07) * 2.2)))
        cw = int(f.getlength(ch) + 48)
        col = INDIGO if i == 0 else WHITE
        tc = WHITE if i == 0 else SLATE700
        draw.rounded_rectangle((x, y + int((1 - e) * 16), x + cw, y + 56 + int((1 - e) * 16)), radius=28, fill=col, outline=SLATE200 if i else None)
        draw.text((x + 24, y + 14 + int((1 - e) * 16)), ch, font=f, fill=tc)
        x += cw + 16


# ─── Scenes ───────────────────────────────────────────────────────

def scene_intro(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    _badge(draw, 120, "Türkiye'nin canlı destek platformu", _ease(t * 2))
    title_f = _font(62, True)
    sub_f = _font(34)
    e1 = _ease(min(1.0, max(0.0, (t - 0.12) * 2)))
    e2 = _ease(min(1.0, max(0.0, (t - 0.28) * 2)))
    y1 = int(220 + (1 - e1) * 30)
    _text_block(draw, 0, y1, ['Ziyaretçinizi müşteriye'], title_f, SLATE900)
    _gradient_text(draw, 0, y1 + 78, 'dönüştürün', _font(62, True))
    _text_block(draw, 0, int(420 + (1 - e2) * 20), ['Canlı sohbet · AI chatbot · WhatsApp'], sub_f, SLATE500)
    _text_block(draw, 0, int(480 + (1 - e2) * 20), ['Tek gelen kutusunda'], sub_f, SLATE500)
    return img


def scene_widget(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    _text_block(draw, 0, 100, ['Web sitenize canlı sohbet'], _font(48, True), SLATE900)
    _gradient_text(draw, 0, 158, '30 saniyede ekleyin', _font(48, True))
    _browser_widget(draw, 320, t)
    return img


def scene_stats(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    _logo_full(draw, 100, 1.1)
    _text_block(draw, 0, 200, ['Neden Gu Live Chat?'], _font(44, True), SLATE900)
    _stat_cards(draw, 340, t)
    _text_block(draw, 0, 520, ['Kredi kartı gerekmez · Kurulum 30 saniye'], _font(26), SLATE500)
    return img


def scene_features(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    _text_block(draw, 0, 90, ['Her şey tek platformda'], _font(46, True), SLATE900)
    cw, ch, gap = W - 120, 200, 20
    items = [
        ('💬', 'Canlı Sohbet Widget', 'Tek satır kod — anlık mesaj, dosya, çeviri'),
        ('🤖', 'AI Agent', 'SSS ve tekrarlayan talepleri otomatik yanıtla'),
        ('📥', 'Birleşik Inbox', 'Widget, WhatsApp, e-posta tek panelde'),
    ]
    y0 = 200
    for i, (ic, ti, de) in enumerate(items):
        _feature_card(draw, 60, y0 + i * (ch + gap), cw, ch, ic, ti, de, max(0.0, min(1.0, (t - i * 0.12) * 2)))
    return img


def scene_inbox(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    _text_block(draw, 0, 120, ['Tüm kanallar'], _font(52, True), SLATE900)
    _gradient_text(draw, 0, 188, 'tek gelen kutusunda', _font(52, True))
    _channels_row(draw, 320, t)
    # mini inbox list
    samples = [
        ('Widget', 'Ayşe K.', 'Sipariş durumu?', '2 dk'),
        ('WhatsApp', 'Mehmet D.', 'Fatura talebi', '14 dk'),
        ('E-posta', 'Zeynep A.', 'İade süreci', '1 sa'),
    ]
    y = 420
    for i, (ch, name, msg, tm) in enumerate(samples):
        e = _ease(max(0.0, min(1.0, (t - 0.2 - i * 0.1) * 2.5)))
        dy = int((1 - e) * 24)
        draw.rounded_rectangle((60, y + dy, W - 60, y + 130 + dy), radius=20, fill=WHITE, outline=SLATE200)
        bf = _font(20, True)
        draw.rounded_rectangle((80, y + 20 + dy, 80 + bf.getlength(ch) + 24, y + 52 + dy), radius=12, fill=(238, 242, 255))
        draw.text((92, y + 24 + dy), ch, font=bf, fill=INDIGO)
        draw.text((80, y + 64 + dy), name, font=_font(26, True), fill=SLATE900)
        draw.text((80, y + 98 + dy), msg, font=_font(22), fill=SLATE500)
        draw.text((W - 140, y + 24 + dy), tm, font=_font(20), fill=SLATE500)
        y += 150
    return img


def scene_cta(t: float) -> Image.Image:
    img = _grid_bg()
    draw = ImageDraw.Draw(img)
    pulse = 1.0 + 0.025 * math.sin(t * math.pi * 3)
    _logo_full(draw, 280, 1.3 * pulse)
    _text_block(draw, 0, 400, ['7 gün PRO ücretsiz deneyin'], _font(48, True), SLATE900)
    _text_block(draw, 0, 470, ['Kredi kartı gerekmez'], _font(32), SLATE500)
    btn_w, btn_h = int(720 * pulse), int(108 * pulse)
    bx, by = (W - btn_w) // 2, 620
    for i in range(btn_w):
        col = _blend(INDIGO600, VIOLET, i / btn_w)
        draw.line([(bx + i, by), (bx + i, by + btn_h)], fill=col)
    draw.rounded_rectangle((bx, by, bx + btn_w, by + btn_h), radius=28)
    uf = _font(40, True)
    url = 'gulivechat.com'
    draw.text(((W - uf.getlength(url)) // 2, by + 30), url, font=uf, fill=WHITE)
    _text_block(draw, 0, 780, ['Ücretsiz Hesap Oluştur →'], _font(30, True), INDIGO)
    badges = ['KVKK uyumlu', 'Türk yapımı', '7/24 destek']
    bx2 = (W - sum(_font(22).getlength(b) + 40 for b in badges) - 32) // 2
    for b in badges:
        bw = int(_font(22).getlength(b) + 36)
        draw.rounded_rectangle((bx2, 880, bx2 + bw, 930), radius=18, fill=WHITE, outline=SLATE200)
        draw.text((bx2 + 18, 892), b, font=_font(22), fill=SLATE700)
        bx2 += bw + 16
    return img


def _render_scene(duration: float, fn) -> list[Image.Image]:
    n = max(1, int(duration * FPS))
    return [fn(i / max(n - 1, 1)) for i in range(n)]


def _crossfade(frames_a: list[Image.Image], frames_b: list[Image.Image], cross: int) -> list[Image.Image]:
    if cross <= 0:
        return frames_a + frames_b
    out = frames_a[:-cross] if len(frames_a) > cross else []
    for i in range(cross):
        ta = frames_a[-cross + i] if len(frames_a) >= cross else frames_a[-1]
        tb = frames_b[i] if i < len(frames_b) else frames_b[-1]
        t = i / max(cross - 1, 1)
        blended = Image.blend(ta, tb, _ease(t))
        out.append(blended)
    out.extend(frames_b[cross:])
    return out


def _concat_scenes(scenes: list[tuple[float, callable]], crossfade_frames: int = 12) -> list[Image.Image]:
    all_frames: list[Image.Image] = []
    for i, (dur, fn) in enumerate(scenes):
        fr = _render_scene(dur, fn)
        if i == 0:
            all_frames = fr
        else:
            all_frames = _crossfade(all_frames, fr, crossfade_frames)
    return all_frames


def _ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def save_mp4(frames: list[Image.Image], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ff = _ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(td / f'{i:05d}.jpg', quality=94)
        cmd = [
            ff, '-y', '-framerate', str(FPS),
            '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            str(path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f'ffmpeg hatası:\n{proc.stderr[-600:]}')


def main() -> None:
    print('🎬 Gu Live Chat PRO reklam videosu üretiliyor (9:16 · ~30 sn)...')
    scenes = [
        (3.5, scene_intro),
        (4.5, scene_widget),
        (3.5, scene_stats),
        (5.0, scene_features),
        (4.5, scene_inbox),
        (4.0, scene_cta),
    ]
    frames = _concat_scenes(scenes, crossfade_frames=10)
    save_mp4(frames, OUT)
    sec = len(frames) / FPS
    print(f'✅ Hazır: {OUT.resolve()}')
    print(f'   Süre: {sec:.1f} sn · {len(frames)} kare · {W}x{H}')


if __name__ == '__main__':
    main()
