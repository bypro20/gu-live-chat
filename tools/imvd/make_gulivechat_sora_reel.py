#!/usr/bin/env python3
"""
Gu Live Chat — Sora 2 (OpenAI/ChatGPT) ile Instagram reel tarzı video.
Gerçek insan + telefon sahneleri, seslendirme, birleşik 40 sn.

Gerekli: OPENAI_API_KEY (Sora erişimi + bakiye)
  export OPENAI_API_KEY=sk-...
  python3 make_gulivechat_sora_reel.py

Çıktı: ../../gulivechat-reklam-sora.mp4
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).parent
CLIPS_DIR = ROOT / 'output' / 'sora-clips'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-sora.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-sora-izle.html'

# 5 x 8 sn = 40 sn · dikey Reels
MODEL = os.environ.get('SORA_MODEL', 'sora-2')
SIZE = os.environ.get('SORA_SIZE', '720x1280')
SECONDS = os.environ.get('SORA_SECONDS', '8')

SCENE_PROMPTS = [
    {
        'id': '01-businessman-phone',
        'prompt': (
            'Vertical 9:16 commercial ad. Professional Turkish businessman in smart casual, '
            'smiling while texting on smartphone in bright modern office. Soft natural window light, '
            'shallow depth of field, cinematic slow push-in, premium SaaS advertisement style, '
            'no logos, no text overlay.'
        ),
    },
    {
        'id': '02-woman-shopping-phone',
        'prompt': (
            'Vertical 9:16 social media ad. Young woman browsing on phone at home couch, '
            'receives chat notification, smiles with relief. Warm cozy lighting, realistic skin, '
            'customer support app mood, cinematic commercial, no logos.'
        ),
    },
    {
        'id': '03-hands-whatsapp',
        'prompt': (
            'Vertical 9:16 close-up. Hands holding smartphone, typing business message, '
            'WhatsApp-style chat interface blurred on screen, office desk background, '
            'professional product ad, smooth camera drift, photorealistic.'
        ),
    },
    {
        'id': '04-team-support',
        'prompt': (
            'Vertical 9:16. Small startup team with laptops and phones, customer support agents '
            'helping clients, dynamic office energy, indigo accent lighting subtle, '
            'modern tech company B-roll, commercial quality, no readable logos.'
        ),
    },
    {
        'id': '05-happy-customer-cta',
        'prompt': (
            'Vertical 9:16. Satisfied customer closing laptop and phone, thumbs up gesture, '
            'golden hour window light, positive ending shot for tech ad, cinematic, '
            'professional marketing video, no text on screen.'
        ),
    },
]


def _load_env() -> None:
    for p in (ROOT / '.env', ROOT.parent.parent / '.env.local', ROOT.parent.parent / '.env'):
        if not p.exists():
            continue
        for line in p.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k == 'OPENAI_API_KEY' and v and k not in os.environ:
                os.environ[k] = v


def _ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _require_openai():
    _load_env()
    key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not key:
        print(
            '❌ OPENAI_API_KEY gerekli.\n'
            '   1. https://platform.openai.com/api-keys adresinden anahtar alın\n'
            '   2. Sora erişimi ve bakiye olduğundan emin olun\n'
            '   3. tools/imvd/.env içine OPENAI_API_KEY=sk-... ekleyin\n'
            '   4. Tekrar: python3 make_gulivechat_sora_reel.py',
            file=sys.stderr,
        )
        sys.exit(1)
    from openai import OpenAI
    return OpenAI(api_key=key)


def _poll_and_download(client, video_id: str, dest: Path) -> None:
    print(f'   ⏳ Render tamamlanıyor: {video_id}')
    job = client.videos.poll(video_id, poll_interval_ms=8000)
    if job.status != 'completed':
        err = getattr(job, 'error', None)
        raise RuntimeError(f'Sora render başarısız: {err}')
    content = client.videos.download_content(video_id)
    dest.parent.mkdir(parents=True, exist_ok=True)
    data = content.read() if hasattr(content, 'read') else content
    dest.write_bytes(data)
    print(f'   ✅ {dest}')


def generate_sora_clips(client) -> list[Path]:
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for scene in SCENE_PROMPTS:
        dest = CLIPS_DIR / f"{scene['id']}.mp4"
        if dest.exists() and dest.stat().st_size > 50_000:
            print(f'⏭️  Mevcut: {dest.name}')
            paths.append(dest)
            continue
        print(f'🎬 Sora: {scene["id"]}...')
        video = client.videos.create(
            model=MODEL,
            prompt=scene['prompt'],
            size=SIZE,
            seconds=SECONDS,
        )
        _poll_and_download(client, video.id, dest)
        paths.append(dest)
    return paths


async def _voiceover() -> Path:
    from tts_brand import SCENES_VOICE, plain_to_ssml
    import edge_tts

    parts = []
    for i, text in enumerate(SCENES_VOICE):
        mp3 = CLIPS_DIR / f'voice-{i + 1}.mp3'
        ssml = plain_to_ssml(text)
        await edge_tts.Communicate(ssml, voice='tr-TR-AhmetNeural').save(str(mp3))
        parts.append(mp3)
    # concat audio
    ff = _ffmpeg()
    lst = CLIPS_DIR / 'voice-list.txt'
    lst.write_text('\n'.join(f"file '{p.resolve()}'" for p in parts), encoding='utf-8')
    out = CLIPS_DIR / 'voiceover-full.mp3'
    subprocess.run(
        [ff, '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(out)],
        check=True,
        capture_output=True,
    )
    return out


def _concat_videos(clips: list[Path], out: Path) -> None:
    ff = _ffmpeg()
    lst = CLIPS_DIR / 'clips-list.txt'
    lst.write_text('\n'.join(f"file '{p.resolve()}'" for p in clips), encoding='utf-8')
    subprocess.run(
        [ff, '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(out)],
        check=True,
        capture_output=True,
    )


def _mux(video: Path, audio: Path, out: Path) -> None:
    ff = _ffmpeg()
    subprocess.run([
        ff, '-y', '-i', str(video), '-i', str(audio),
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-shortest', '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def _preview() -> None:
    PREVIEW.write_text('''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gu Live Chat — Sora Reklam</title>
<style>body{margin:0;background:#000;color:#fff;font-family:system-ui;text-align:center;padding:24px}
video{width:min(100%,400px);border-radius:16px}a{display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:12px}</style>
</head><body><h2>Sora — Gerçek İnsanlı Reklam</h2>
<video controls playsinline autoplay src="./gulivechat-reklam-sora.mp4"></video>
<a href="./gulivechat-reklam-sora.mp4" download>İndir</a></body></html>''', encoding='utf-8')


def main() -> None:
    print('🚀 OpenAI Sora ile Gu Live Chat reklam videosu...')
    client = _require_openai()
    clips = generate_sora_clips(client)
    merged = CLIPS_DIR / 'merged-silent.mp4'
    _concat_videos(clips, merged)
    print('🎙️  Seslendirme (Gu Live Chat telaffuzu düzeltilmiş)...')
    voice = asyncio.run(_voiceover())
    _mux(merged, voice, FINAL)
    _preview()
    print(f'\n✅ Hazır: {FINAL}')
    print(f'🌐 http://127.0.0.1:8765/gulivechat-reklam-sora-izle.html')


if __name__ == '__main__':
    main()
