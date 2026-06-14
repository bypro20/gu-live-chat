#!/usr/bin/env python3
"""
Gu Live Chat — Google Gemini Veo 3.1 ile Instagram reel (gerçek insan sahneleri).

Gerekli: GEMINI_API_KEY (Google AI Studio — ücretli Veo erişimi)
  https://aistudio.google.com/apikey

  tools/imvd/.env:
    GEMINI_API_KEY=AIza...

  python3 make_gulivechat_veo_reel.py

Çıktı: ../../gulivechat-reklam-veo.mp4 (~40 sn, 5 x 8 sn klip)
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
CLIPS_DIR = ROOT / 'output' / 'veo-clips'
FINAL = ROOT.parent.parent / 'gulivechat-reklam-veo.mp4'
PREVIEW = ROOT.parent.parent / 'gulivechat-reklam-veo-izle.html'

MODEL = os.environ.get('VEO_MODEL', 'veo-3.1-fast-generate-preview')
ASPECT = '9:16'
RESOLUTION = '1080p'
DURATION = 8

SCENES = [
    ('01-businessman', (
        'Vertical 9:16 premium SaaS commercial. Professional businessman smiling, '
        'texting on smartphone in modern bright office. Slow cinematic push-in, '
        'realistic skin, natural window light, no logos, no text.'
    )),
    ('02-woman-chat', (
        'Vertical 9:16 ad. Young woman on couch using phone, happy reaction to '
        'message notification, warm home lighting, customer support mood, photorealistic.'
    )),
    ('03-hands-phone', (
        'Vertical 9:16 close-up. Hands typing on smartphone, business chat app blurred, '
        'office desk, shallow depth of field, commercial B-roll quality.'
    )),
    ('04-team-office', (
        'Vertical 9:16. Startup team with laptops and phones, customer support energy, '
        'modern office, subtle indigo accent lighting, tech company ad style.'
    )),
    ('05-success', (
        'Vertical 9:16. Satisfied customer giving thumbs up with phone, golden hour light, '
        'positive ending for tech advertisement, cinematic, no text on screen.'
    )),
]


def _load_env() -> None:
    for p in (ROOT / '.env', ROOT.parent.parent / '.env.local', ROOT.parent.parent / '.env'):
        if not p.exists():
            continue
        for line in p.read_text(encoding='utf-8').splitlines():
            if not line.strip() or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k in ('GEMINI_API_KEY', 'GOOGLE_AI_API_KEY') and v and k not in os.environ:
                os.environ['GEMINI_API_KEY'] = v


def _ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _client():
    _load_env()
    key = (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_AI_API_KEY') or '').strip()
    if not key:
        print(
            '❌ GEMINI_API_KEY gerekli.\n'
            '   1. https://aistudio.google.com/apikey — anahtar alın\n'
            '   2. Veo 3.1 için ücretli plan gerekebilir (free tier video vermez)\n'
            '   3. tools/imvd/.env → GEMINI_API_KEY=AIza...\n'
            '   4. python3 make_gulivechat_veo_reel.py',
            file=sys.stderr,
        )
        sys.exit(1)
    from google import genai
    return genai.Client(api_key=key)


def _generate_clip(client, scene_id: str, prompt: str, dest: Path) -> None:
    from google.genai import types

    if dest.exists() and dest.stat().st_size > 50_000:
        print(f'⏭️  {dest.name}')
        return

    print(f'🎬 Veo: {scene_id}...')
    op = client.models.generate_videos(
        model=MODEL,
        prompt=prompt,
        config=types.GenerateVideosConfig(
            aspect_ratio=ASPECT,
            resolution=RESOLUTION,
            duration_seconds=DURATION,
            enhance_prompt=True,
        ),
    )
    while not op.done:
        print(f'   ⏳ bekleniyor... ({scene_id})')
        time.sleep(12)
        op = client.operations.get(op)

    if not op.response or not op.response.generated_videos:
        raise RuntimeError(f'Veo başarısız: {scene_id}')

    video_obj = op.response.generated_videos[0].video
    data = client.files.download(file=video_obj)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data if isinstance(data, bytes) else data.read())
    print(f'   ✅ {dest}')


async def _voiceover() -> Path:
    from tts_brand import SCENES_VOICE, plain_to_ssml
    import edge_tts

    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, text in enumerate(SCENES_VOICE):
        mp3 = CLIPS_DIR / f'v-{i + 1}.mp3'
        await edge_tts.Communicate(plain_to_ssml(text), voice='tr-TR-AhmetNeural').save(str(mp3))
        parts.append(mp3)
    lst = CLIPS_DIR / 'v-list.txt'
    lst.write_text('\n'.join(f"file '{p.resolve()}'" for p in parts), encoding='utf-8')
    out = CLIPS_DIR / 'voiceover.mp3'
    subprocess.run([_ffmpeg(), '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(out)], check=True, capture_output=True)
    return out


def _concat(clips: list[Path], out: Path) -> None:
    lst = CLIPS_DIR / 'c-list.txt'
    lst.write_text('\n'.join(f"file '{p.resolve()}'" for p in clips), encoding='utf-8')
    subprocess.run([_ffmpeg(), '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(out)], check=True, capture_output=True)


def _mux(video: Path, audio: Path, out: Path) -> None:
    subprocess.run([
        _ffmpeg(), '-y', '-i', str(video), '-i', str(audio),
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-shortest', '-movflags', '+faststart', str(out),
    ], check=True, capture_output=True)


def main() -> None:
    print('🚀 Gemini Veo 3.1 ile Gu Live Chat reklam videosu...')
    client = _client()
    clips: list[Path] = []
    for sid, prompt in SCENES:
        dest = CLIPS_DIR / f'{sid}.mp4'
        _generate_clip(client, sid, prompt, dest)
        clips.append(dest)

    merged = CLIPS_DIR / 'merged.mp4'
    _concat(clips, merged)
    print('🎙️  Seslendirme...')
    voice = asyncio.run(_voiceover())
    _mux(merged, voice, FINAL)

    PREVIEW.write_text(
        f'<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>'
        f'<meta name="viewport" content="width=device-width,initial-scale=1"/>'
        f'<title>Veo Reklam</title></head><body style="background:#000;color:#fff;text-align:center;padding:24px">'
        f'<h2>Gemini Veo — Gu Live Chat</h2>'
        f'<video controls playsinline autoplay style="width:min(100%,400px)" src="./gulivechat-reklam-veo.mp4"></video>'
        f'<p><a style="color:#818cf8" href="./gulivechat-reklam-veo.mp4" download>İndir</a></p>'
        f'<p><a style="color:#94a3b8" href="http://127.0.0.1:8765/videolar.html">Tüm videolar</a></p>'
        f'</body></html>',
        encoding='utf-8',
    )
    print(f'\n✅ {FINAL}')
    print('🌐 http://127.0.0.1:8765/gulivechat-reklam-veo-izle.html')


if __name__ == '__main__':
    main()
