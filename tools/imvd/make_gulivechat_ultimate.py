#!/usr/bin/env python3
"""
Gu Live Chat — Ultimate reklam videosu.
Gerçek site ekran görüntüsü + premium motion graphics + sinematik geçişler.
Çıktı: output/gulivechat-reel-ultimate.mp4 (~32 sn, 9:16, 1080p)
"""

from __future__ import annotations

import math
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Mevcut sahneleri yeniden kullan
from make_gulivechat_ad import (
    FPS,
    H,
    W,
    scene_cta,
    scene_features,
    scene_inbox,
    scene_intro,
    scene_stats,
    scene_widget,
    _concat_scenes,
    _ease,
    _ffmpeg_exe,
    _grid_bg,
    _font,
    _gradient_text,
    _logo_full,
    _text_block,
    BG,
    INDIGO,
    INDIGO600,
    SLATE500,
    SLATE900,
    WHITE,
)

ROOT = Path(__file__).parent
ASSETS = ROOT / 'assets'
OUTPUT = ROOT / 'output' / 'gulivechat-reel-ultimate.mp4'


def _capture_site_assets() -> None:
    assets = ['home-hero.png', 'home-pricing.png', 'features.png']
    if all((ASSETS / a).exists() for a in assets):
        return
    ASSETS.mkdir(parents=True, exist_ok=True)
    script = ROOT / 'capture_gulivechat.mjs'
    print('📸 gulivechat.com ekran görüntüleri alınıyor...')
    proc = subprocess.run(
        ['npx', 'playwright', 'run', str(script)] if False else ['node', str(script)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    # playwright as node module — install if needed
    if proc.returncode != 0:
        install = subprocess.run(
            ['npm', 'install', 'playwright', '--no-save'],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        subprocess.run(['npx', 'playwright', 'install', 'chromium'], cwd=str(ROOT), capture_output=True)
        proc = subprocess.run(['node', str(script)], cwd=str(ROOT), capture_output=True, text=True)
    if proc.returncode != 0:
        print('⚠️  Site görüntüsü alınamadı, motion-only mod:', proc.stderr[-300:] if proc.stderr else '')
    else:
        print(proc.stdout)


def _fit_cover(img: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def _ken_burns(img: Image.Image, t: float, mode: str = 'in') -> Image.Image:
    """Sinematik zoom/pan — gerçek site görüntüsü üzerinde."""
    base = _fit_cover(img, W, H)
    sw, sh = base.size
    zoom = 1.0 + (0.12 if mode == 'in' else -0.08) * _ease(t)
    cw, ch = int(W / zoom), int(H / zoom)
    cx = int((sw - cw) * (0.35 + 0.3 * t))
    cy = int((sh - ch) * (0.15 + 0.1 * math.sin(t * math.pi)))
    cx = max(0, min(sw - cw, cx))
    cy = max(0, min(sh - ch, cy))
    cropped = base.crop((cx, cy, cx + cw, cy + ch)).resize((W, H), Image.Resampling.LANCZOS)
    return cropped


def _overlay_bar(img: Image.Image, title: str, subtitle: str, t: float) -> Image.Image:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    e = _ease(min(1.0, t * 2))
    draw.rectangle((0, 0, W, 280), fill=(250, 251, 255, int(230 * e)))
    draw.rectangle((0, H - 200, W, H), fill=(15, 23, 42, int(200 * e)))
    out = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(out)
    _text_block(draw, 0, 40, [title], _font(46, True), SLATE900)
    _text_block(draw, 0, 110, [subtitle], _font(28), SLATE500)
    draw.text((60, H - 130), 'gulivechat.com', font=_font(32, True), fill=WHITE)
    return out


def scene_site_hero(t: float) -> Image.Image:
    path = ASSETS / 'home-hero.png'
    if not path.exists():
        return scene_widget(t)
    raw = Image.open(path).convert('RGB')
    frame = _ken_burns(raw, t, 'in')
    return _overlay_bar(frame, 'Gerçek platform.', 'Canlı demo — gulivechat.com', t)


def scene_site_features(t: float) -> Image.Image:
    path = ASSETS / 'features.png'
    if not path.exists():
        return scene_features(t)
    raw = Image.open(path).convert('RGB')
    frame = _ken_burns(raw, t, 'in')
    return _overlay_bar(frame, 'Profesyonel özellikler', 'AI · Widget · Inbox · Çeviri', t)


def scene_pricing(t: float) -> Image.Image:
    path = ASSETS / 'home-pricing.png'
    if not path.exists():
        return scene_stats(t)
    raw = Image.open(path).convert('RGB')
    frame = _ken_burns(raw, t, 'out')
    return _overlay_bar(frame, '7 gün PRO ücretsiz', 'Kredi kartı gerekmez', t)


def _render_scene(duration: float, fn) -> list[Image.Image]:
    n = max(1, int(duration * FPS))
    return [fn(i / max(n - 1, 1)) for i in range(n)]


def _frames_to_mp4(frames: list[Image.Image], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ff = _ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(td / f'{i:05d}.jpg', quality=95)
        cmd = [
            ff, '-y', '-framerate', str(FPS),
            '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            str(path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr[-600:])


def _xfade_concat(segments: list[Path], out: Path, fade: float = 0.6) -> None:
    """ffmpeg xfade ile sinematik geçiş."""
    ff = _ffmpeg_exe()
    if len(segments) == 1:
        subprocess.run(['cp', str(segments[0]), str(out)], check=True)
        return

    # Probe durations
    durs: list[float] = []
    for seg in segments:
        p = subprocess.run(
            [ff, '-i', str(seg), '-f', 'null', '-'],
            capture_output=True,
            text=True,
        )
        # parse Duration: HH:MM:SS.ms from stderr
        dur = 5.0
        for line in (p.stderr or '').split('\n'):
            if 'Duration:' in line:
                part = line.split('Duration:')[1].split(',')[0].strip()
                h, m, s = part.split(':')
                dur = int(h) * 3600 + int(m) * 60 + float(s)
                break
        durs.append(dur)

    # Build filter_complex
    inputs: list[str] = []
    for seg in segments:
        inputs.extend(['-i', str(seg)])

    n = len(segments)
    if n == 2:
        offset = durs[0] - fade
        fc = f'[0:v][1:v]xfade=transition=fadeblack:duration={fade}:offset={offset:.3f}[v]'
        cmd = [ff, '-y', *inputs, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            # fallback concat
            _simple_concat(segments, out)
        return

    # Multi-segment xfade chain
    parts: list[str] = []
    prev = '[0:v]'
    cumulative = durs[0]
    for i in range(1, n):
        offset = cumulative - fade
        out_label = f'[v{i}]' if i < n - 1 else '[vout]'
        parts.append(f'{prev}[{i}:v]xfade=transition=fadeblack:duration={fade}:offset={offset:.3f}{out_label}')
        prev = out_label
        cumulative += durs[i] - fade
    fc = ';'.join(parts)
    cmd = [ff, '-y', *inputs, '-filter_complex', fc, '-map', '[vout]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print('⚠️  xfade birleştirme başarısız, basit concat:', proc.stderr[-200:])
        _simple_concat(segments, out)


def _simple_concat(segments: list[Path], out: Path) -> None:
    ff = _ffmpeg_exe()
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        for seg in segments:
            f.write(f"file '{seg.resolve()}'\n")
        list_path = f.name
    subprocess.run(
        [ff, '-y', '-f', 'concat', '-safe', '0', '-i', list_path, '-c', 'copy', str(out)],
        check=True,
        capture_output=True,
    )


def main() -> None:
    print('🏆 Gu Live Chat ULTIMATE reklam videosu üretiliyor...')
    _capture_site_assets()

    tmp_dir = ROOT / 'output' / '_segments'
    tmp_dir.mkdir(parents=True, exist_ok=True)

    segments_spec = [
        ('01-intro', 3.2, scene_intro),
        ('02-site-hero', 4.0, scene_site_hero),
        ('03-widget', 4.0, scene_widget),
        ('04-stats', 3.2, scene_stats),
        ('05-features', 4.5, scene_features),
        ('06-site-features', 3.5, scene_site_features),
        ('07-inbox', 4.0, scene_inbox),
        ('08-pricing', 3.0, scene_pricing),
        ('09-cta', 4.5, scene_cta),
    ]

    mp4s: list[Path] = []
    for name, dur, fn in segments_spec:
        print(f'  → {name} ({dur}s)')
        frames = _render_scene(dur, fn)
        seg_path = tmp_dir / f'{name}.mp4'
        _frames_to_mp4(frames, seg_path)
        mp4s.append(seg_path)

    print('🎞️  Segmentler birleştiriliyor (sinematik geçiş)...')
    _xfade_concat(mp4s, OUTPUT, fade=0.5)

    ff = _ffmpeg_exe()
    probe = subprocess.run([ff, '-i', str(OUTPUT)], capture_output=True, text=True)
    dur_line = next((l for l in probe.stderr.split('\n') if 'Duration:' in l), '')
    print(f'✅ ULTIMATE hazır: {OUTPUT.resolve()}')
    if dur_line:
        print(f'   {dur_line.strip()}')


if __name__ == '__main__':
    main()
