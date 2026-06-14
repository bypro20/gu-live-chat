#!/usr/bin/env python3
"""
Gu Live Chat — gerçek stok B-roll + Türkçe seslendirme → ~40 sn Instagram reel.
Mixkit (ücretsiz, ticari kullanım) + Edge TTS + ffmpeg montaj.
"""

from __future__ import annotations

import asyncio
import subprocess
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from tts_brand import SCENES_SUBTITLE, SCENES_VOICE, plain_to_ssml

ROOT = Path(__file__).parent
STOCK_DIR = ROOT / 'output' / 'stock-clips'
SCENES_DIR = ROOT / 'output' / 'stock-scenes'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-40sn.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-40sn-izle.html'
TARGET = 40.0
W, H = 1080, 1920
VOICE = 'tr-TR-EmelNeural'

SCENE_STOCK = [
    ('01-marka', 'https://assets.mixkit.co/videos/3450/3450-720.mp4'),
    ('02-hook', 'https://assets.mixkit.co/videos/39877/39877-720.mp4'),
    ('03-widget', 'https://assets.mixkit.co/videos/4477/4477-720.mp4'),
    ('04-platform', 'https://assets.mixkit.co/videos/3452/3452-720.mp4'),
    ('05-sonuc', 'https://assets.mixkit.co/videos/3451/3451-720.mp4'),
    ('06-cta', 'https://assets.mixkit.co/videos/39878/39878-720.mp4'),
]


def _ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _download(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 100_000:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0',
            'Referer': 'https://mixkit.co/',
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r, dest.open('wb') as f:
        f.write(r.read())


def _duration(path: Path) -> float:
    p = subprocess.run([_ffmpeg(), '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    for line in (p.stderr or '').split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 6.0


async def _tts(text: str, path: Path) -> None:
    import edge_tts
    ssml = plain_to_ssml(text, voice=VOICE, rate='-5%', pitch='-1Hz')
    await edge_tts.Communicate(ssml, voice=VOICE).save(str(path))


def _font(size: int, bold: bool = True):
    for p in (
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold
        else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    ):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _overlay_png(subtitle: str, path: Path) -> None:
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, 180), fill=(0, 0, 0, 140))
    bf = _font(52)
    brand = 'Gu Live Chat'
    draw.text(((W - bf.getlength(brand)) // 2, 55), brand, font=bf, fill=(255, 255, 255, 242))
    draw.rectangle((0, H - 220, W, H), fill=(0, 0, 0, 158))
    sf = _font(38)
    draw.text(((W - sf.getlength(subtitle)) // 2, H - 145), subtitle, font=sf, fill=(255, 255, 255, 250))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def _process_clip(src: Path, audio: Path, subtitle: str, dur: float, out: Path) -> None:
    ff = _ffmpeg()
    overlay = out.with_suffix('.png')
    _overlay_png(subtitle, overlay)
    vf = (
        f'[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,'
        f'crop={W}:{H},'
        f'eq=brightness=-0.06:saturation=1.08,'
        f'fade=t=in:st=0:d=0.4,fade=t=out:st={max(0.1, dur - 0.5):.2f}:d=0.5[base];'
        f'[base][1:v]overlay=0:0:format=auto[v]'
    )
    subprocess.run([
        ff, '-y', '-stream_loop', '-1', '-i', str(src), '-i', str(overlay), '-i', str(audio),
        '-filter_complex', vf,
        '-map', '[v]', '-map', '2:a',
        '-t', f'{dur:.3f}',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _concat(paths: list[Path], out: Path) -> None:
    ff = _ffmpeg()
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        for p in paths:
            f.write(f"file '{p.resolve()}'\n")
        lst = f.name
    subprocess.run([
        ff, '-y', '-f', 'concat', '-safe', '0', '-i', lst,
        '-c', 'copy', '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _music(dur: float, path: Path) -> None:
    ff = _ffmpeg()
    d = int(dur) + 1
    subprocess.run([
        ff, '-y',
        '-f', 'lavfi', '-i', f'sine=f=130.81:duration={d}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=f=164.81:duration={d}:sample_rate=44100',
        '-filter_complex',
        f'[0:a]volume=0.04[a0];[1:a]volume=0.03[a1];[a0][a1]amix=inputs=2,afade=t=in:d=2,afade=t=out:st={max(0, d - 4)}:d=4',
        '-t', str(dur), str(path),
    ], check=True, capture_output=True)


def _mix_music(video: Path, music: Path, out: Path, dur: float) -> None:
    ff = _ffmpeg()
    subprocess.run([
        ff, '-y', '-i', str(video), '-i', str(music),
        '-filter_complex', '[1:a]volume=0.35[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]',
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-t', str(dur), '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


async def _build() -> None:
    STOCK_DIR.mkdir(parents=True, exist_ok=True)
    SCENES_DIR.mkdir(parents=True, exist_ok=True)

    print('📥 Stok videolar indiriliyor...')
    stock_paths: list[Path] = []
    for sid, url in SCENE_STOCK:
        dest = STOCK_DIR / f'{sid}.mp4'
        print(f'   {sid}')
        _download(url, dest)
        stock_paths.append(dest)

    print('🎙️  Seslendirme...')
    audio_durs: list[float] = []
    for i, text in enumerate(SCENES_VOICE):
        mp3 = SCENES_DIR / f'v-{i + 1}.mp3'
        await _tts(text, mp3)
        audio_durs.append(_duration(mp3) + 0.4)

    raw = sum(audio_durs)
    scale = TARGET / raw
    scene_durs = [d * scale for d in audio_durs]

    scene_mp4s: list[Path] = []
    for (sid, _), stock, text, sub, dur in zip(
        SCENE_STOCK, stock_paths, SCENES_VOICE, SCENES_SUBTITLE, scene_durs
    ):
        print(f'🎬 Montaj: {sid} ({dur:.1f}s)...')
        mp3 = SCENES_DIR / f'v-{sid[:2]}.mp3'
        # re-use correct mp3 index
        idx = int(sid.split('-')[0]) - 1
        mp3 = SCENES_DIR / f'v-{idx + 1}.mp3'
        out = SCENES_DIR / f'{sid}.mp4'
        _process_clip(stock, mp3, sub, dur, out)
        scene_mp4s.append(out)
        print(f'   ✅ {out}')

    merged = SCENES_DIR / 'merged.mp4'
    _concat(scene_mp4s, merged)
    music = SCENES_DIR / 'music.mp3'
    _music(TARGET, music)
    tmp = SCENES_DIR / 'final-tmp.mp4'
    _mix_music(merged, music, tmp, TARGET)
    tmp.replace(FINAL)

    PREVIEW.write_text(
        f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat Reklam</title>
<style>body{{margin:0;background:#0a0e1a;color:#fff;font-family:system-ui;padding:24px;text-align:center}}
video{{width:min(100%,420px);border-radius:16px;margin:16px 0;box-shadow:0 20px 60px #0008}}
a{{display:inline-block;margin:8px;padding:12px 22px;background:#6366f1;color:#fff;border-radius:12px;text-decoration:none}}
</style></head><body>
<h2>Gu Live Chat — 40 Sn Reklam (Gerçek Görüntü)</h2>
<p>Stok B-roll · Profesyonel ses · 9:16 Instagram</p>
<video controls playsinline autoplay src="./gulivechat-reklam-40sn.mp4"></video><br>
<a href="./gulivechat-reklam-40sn.mp4" download>Videoyu indir</a>
<a href="./videolar.html">Tüm videolar</a>
</body></html>''',
        encoding='utf-8',
    )
    print(f'\n✅ {FINAL} ({FINAL.stat().st_size // 1024} KB)')


def main() -> None:
    print('🚀 Gerçek stok görüntü + seslendirme ile 40 sn reklam...')
    asyncio.run(_build())


if __name__ == '__main__':
    main()
