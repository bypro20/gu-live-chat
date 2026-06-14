"""Kling AI resmi API — kling.ai/app ile aynı akış (resim + video)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = os.environ.get('KLING_API_BASE', 'https://api.klingai.com/v1')

ASPECT_MAP = {
    '9:16': '9:16',
    '1:1': '1:1',
    '16:9': '16:9',
    '4:5': '3:4',
    '4:3': '4:3',
}


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _jwt(ak: str, sk: str) -> str:
    header = _b64url(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    now = int(time.time())
    payload = _b64url(json.dumps({'iss': ak, 'exp': now + 1800, 'nbf': now - 5}, separators=(',', ':')).encode())
    msg = f'{header}.{payload}'.encode()
    sig = _b64url(hmac.new(sk.encode(), msg, hashlib.sha256).digest())
    return f'{header}.{payload}.{sig}'


def get_credentials() -> tuple[str, str] | None:
    ak = os.environ.get('KLING_ACCESS_KEY') or os.environ.get('KLING_AK')
    sk = os.environ.get('KLING_SECRET_KEY') or os.environ.get('KLING_SK')
    if not ak or not sk or not ak.strip() or not sk.strip():
        return None
    return ak.strip(), sk.strip()


def kling_available() -> bool:
    return get_credentials() is not None


def _request(method: str, path: str, body: dict | None = None) -> dict:
    creds = get_credentials()
    if not creds:
        raise RuntimeError(
            'Kling API anahtarı gerekli.\n'
            '1. https://app.klingai.com/global/dev → API Keys\n'
            '2. .env dosyasına KLING_ACCESS_KEY ve KLING_SECRET_KEY ekle'
        )
    ak, sk = creds
    token = _jwt(ak, sk)
    url = f'{BASE}{path}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'imvd/1.0',
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:500]
        raise RuntimeError(f'Kling API hata {e.code}: {detail}') from e


def _poll(task_id: str, task_type: str, *, timeout: int = 600) -> dict:
    """task_type: images/generations | videos/image2video | videos/text2video"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        result = _request('GET', f'/{task_type}/{task_id}')
        data = result.get('data') or result
        status = data.get('task_status', '')
        if status == 'succeed':
            return data
        if status == 'failed':
            msg = data.get('task_status_msg') or 'Kling üretim başarısız'
            raise RuntimeError(msg)
        time.sleep(8)
    raise RuntimeError('Kling zaman aşımı — tekrar deneyin')


def _download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'imvd/1.0'})
    with urllib.request.urlopen(req, timeout=180) as resp:
        dest.write_bytes(resp.read())
    return dest


def _kling_duration(seconds: int) -> int:
    """Kling: 5 veya 10 sn."""
    return 10 if seconds >= 8 else 5


def generate_image(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
    model: str | None = None,
) -> Path:
    """Kling text-to-image — kling.ai/app resim üretimi."""
    model = model or os.environ.get('KLING_IMAGE_MODEL', 'kling-v2')
    body = {
        'model_name': model,
        'prompt': prompt[:500],
        'negative_prompt': 'blur, distortion, low quality, watermark, text',
        'n': 1,
        'aspect_ratio': ASPECT_MAP.get(aspect, '9:16'),
    }
    resp = _request('POST', '/images/generations', body)
    task_id = (resp.get('data') or resp).get('task_id')
    if not task_id:
        raise RuntimeError(f'Kling task_id yok: {resp}')

    data = _poll(task_id, 'images/generations')
    images = (data.get('task_result') or {}).get('images') or []
    if not images:
        raise RuntimeError('Kling görsel döndürmedi')

    url = images[0].get('url') if isinstance(images[0], dict) else str(images[0])
    return _download(url, Path(output_path))


def image_to_video(
    image_path: str | Path,
    output_path: str | Path,
    *,
    prompt: str = '',
    duration: int = 5,
    mode: str | None = None,
    model: str | None = None,
) -> Path:
    """Kling image-to-video — kling.ai/app resmi videoya çevirme."""
    model = model or os.environ.get('KLING_VIDEO_MODEL', 'kling-v2-1')
    mode = mode or os.environ.get('KLING_VIDEO_MODE', 'pro')
    image_path = Path(image_path)
    b64 = base64.b64encode(image_path.read_bytes()).decode()

    body = {
        'model_name': model,
        'image': b64,
        'prompt': (prompt or 'smooth cinematic motion, natural movement, high quality')[:500],
        'negative_prompt': 'blur, distortion, low quality',
        'duration': str(_kling_duration(duration)),
        'mode': mode,
        'cfg_scale': 0.5,
    }
    resp = _request('POST', '/videos/image2video', body)
    task_id = (resp.get('data') or resp).get('task_id')
    if not task_id:
        raise RuntimeError(f'Kling video task_id yok: {resp}')

    data = _poll(task_id, 'videos/image2video', timeout=900)
    videos = (data.get('task_result') or {}).get('videos') or []
    if not videos:
        raise RuntimeError('Kling video döndürmedi')

    url = videos[0].get('url') if isinstance(videos[0], dict) else str(videos[0])
    return _download(url, Path(output_path))
