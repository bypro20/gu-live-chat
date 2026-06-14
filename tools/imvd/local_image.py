"""Admin yedek — API olmadan anında yerel görsel (sonsuz ücretsiz)."""

from __future__ import annotations

import hashlib
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASPECT_TO_SIZE: dict[str, tuple[int, int]] = {
    '9:16': (768, 1344),
    '1:1': (1024, 1024),
    '16:9': (1344, 768),
    '4:5': (896, 1120),
}


def _colors_from_prompt(prompt: str) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    h = hashlib.md5(prompt.encode()).hexdigest()
    r1, g1, b1 = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r2, g2, b2 = int(h[6:8], 16), int(h[8:10], 16), int(h[10:12], 16)
    c1 = (40 + r1 % 160, 30 + g1 % 140, 60 + b1 % 160)
    c2 = (20 + r2 % 120, 40 + g2 % 120, 80 + b2 % 140)
    return c1, c2


def generate_local_poster(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
) -> Path:
    """Anında yerel reklam görseli — AI değil ama her zaman çalışır."""
    w, h = ASPECT_TO_SIZE.get(aspect, (1024, 1024))
    c1, c2 = _colors_from_prompt(prompt)
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    rng = random.Random(hashlib.sha256(prompt.encode()).hexdigest())
    for _ in range(18):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        rad = rng.randint(40, min(w, h) // 3)
        col = (rng.randint(180, 255), rng.randint(160, 255), rng.randint(180, 255), 35)
        overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        odraw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=col)
        img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        draw = ImageDraw.Draw(img)

    # Metin
    words = prompt.split()
    title = ' '.join(words[:6]) + ('...' if len(words) > 6 else '')
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', size=max(28, w // 22))
        small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', size=max(18, w // 36))
    except OSError:
        font = ImageFont.load_default()
        small = font

    tw, th = draw.textbbox((0, 0), title, font=font)[2:]
    draw.rectangle((w // 2 - tw // 2 - 20, h - th - 120, w // 2 + tw // 2 + 20, h - 80), fill=(0, 0, 0, 128))
    draw.text((w // 2 - tw // 2, h - th - 100), title, fill=(255, 255, 255), font=font)
    draw.text((w // 2 - 60, h - 60), 'imvd', fill=(200, 210, 255), font=small)

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, 'PNG', quality=95)
    return out
