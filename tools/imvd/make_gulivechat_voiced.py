#!/usr/bin/env python3
"""Gu Live Chat — sesli reklam videosu (TTS + motion graphics + ffmpeg)."""

from __future__ import annotations

import asyncio
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / 'output'
VOICE_MP3 = OUTPUT_DIR / 'gulivechat-voiceover.mp3'
VIDEO_SILENT = OUTPUT_DIR / 'gulivechat-reel-voiced-silent.mp4'
VIDEO_FINAL = ROOT.parent.parent / 'gulivechat-reklam-sesli.mp4'
PREVIEW_HTML = ROOT.parent.parent / 'gulivechat-reklam-sesli-izle.html'

# Instagram reel tarzı — profesyonel Türkçe seslendirme metni
VOICEOVER = """
Müşterileriniz web sitenizde yalnız kalmamalı.

Gu Live Chat ile ziyaretçilerinize anında canlı destek sunun.
Tek satır kod ile sitenize ekleyin — kurulum sadece otuz saniye.

AI destekli otomatik yanıt, WhatsApp ve e-posta…
Hepsi tek gelen kutusunda.

Yedi gün PRO paketi ücretsiz deneyin.
Kredi kartı gerekmez.

Gu Live Chat — dijital müşteri deneyiminde yeni nesil çözüm.
Hemen başlayın: gulivechat.com
""".strip()

VOICE = 'tr-TR-AhmetNeural'  # reklam tonu erkek ses
VOICE_RATE = '-5%'           # biraz yavaş, daha kurumsal
VOICE_PITCH = '-2Hz'


def _ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _audio_duration(path: Path) -> float:
    ff = _ffmpeg()
    p = subprocess.run(
        [ff, '-i', str(path), '-f', 'null', '-'],
        capture_output=True,
        text=True,
    )
    for line in (p.stderr or '').split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 28.0


async def _generate_tts() -> Path:
    import edge_tts

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    comm = edge_tts.Communicate(
        VOICEOVER,
        voice=VOICE,
        rate=VOICE_RATE,
        pitch=VOICE_PITCH,
    )
    await comm.save(str(VOICE_MP3))
    print(f'🎙️  Seslendirme: {VOICE_MP3}')
    return VOICE_MP3


def _generate_video(total_seconds: float) -> Path:
    """Sahne sürelerini ses uzunluğuna göre ölçekle."""
    from make_gulivechat_ad import (
        FPS,
        _concat_scenes,
        _ffmpeg_exe,
        scene_cta,
        scene_features,
        scene_inbox,
        scene_intro,
        scene_stats,
        scene_widget,
    )

    base_scenes = [
        (3.5, scene_intro),
        (4.5, scene_widget),
        (3.5, scene_stats),
        (5.0, scene_features),
        (4.5, scene_inbox),
        (4.0, scene_cta),
    ]
    base_total = sum(d for d, _ in base_scenes)
    scale = total_seconds / base_total
    scaled = [(d * scale, fn) for d, fn in base_scenes]

    print(f'🎬 Video üretiliyor ({total_seconds:.1f} sn, ses ile senkron)...')
    frames = _concat_scenes(scaled, crossfade_frames=12)

    ff = _ffmpeg_exe()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        td = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(td / f'{i:05d}.jpg', quality=95)
        cmd = [
            ff, '-y', '-framerate', str(FPS),
            '-i', str(td / '%05d.jpg'),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            str(VIDEO_SILENT),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr[-600:])
    print(f'   → {VIDEO_SILENT}')
    return VIDEO_SILENT


def _mux_video_audio(video: Path, audio: Path, out: Path) -> None:
    ff = _ffmpeg()
    # Ses biraz yüksek, net duyulsun
    cmd = [
        ff, '-y',
        '-i', str(video),
        '-i', str(audio),
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
        '-shortest',
        '-movflags', '+faststart',
        str(out),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f'ffmpeg mux hatası:\n{proc.stderr[-800:]}')
    print(f'✅ Sesli video: {out}')


def _write_preview_html() -> None:
    PREVIEW_HTML.write_text(
        f'''<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — Sesli Reklam</title>
<style>
body{{margin:0;min-height:100vh;background:#0f172a;color:#fff;font-family:system-ui,sans-serif;
display:flex;flex-direction:column;align-items:center;padding:24px}}
h1{{font-size:1.2rem;margin-bottom:8px}}
p{{color:#94a3b8;font-size:.9rem;margin-bottom:16px;text-align:center}}
video{{width:min(100%,380px);border-radius:20px;box-shadow:0 20px 50px #0008}}
a{{margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:12px;font-weight:600}}
</style></head><body>
<h1>Gu Live Chat — Sesli Reklam</h1>
<p>Profesyonel Türkçe seslendirme · 9:16 Reels formatı</p>
<video controls playsinline autoplay src="./gulivechat-reklam-sesli.mp4"></video>
<a href="./gulivechat-reklam-sesli.mp4" download>İndir (MP4)</a>
</body></html>''',
        encoding='utf-8',
    )


def main() -> None:
    print('🏆 Sesli Gu Live Chat reklam videosu üretiliyor...')
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'edge-tts', '--user', '-q'],
            check=True,
        )

    asyncio.run(_generate_tts())
    dur = _audio_duration(VOICE_MP3) + 0.8  # kısa nefes payı
    print(f'   Ses süresi: {dur:.1f} sn')

    video = _generate_video(dur)
    _mux_video_audio(video, VOICE_MP3, VIDEO_FINAL)
    _write_preview_html()
    print(f'🌐 İzle: gulivechat-reklam-sesli-izle.html veya http://127.0.0.1:8765/gulivechat-reklam-sesli-izle.html')


if __name__ == '__main__':
    main()
