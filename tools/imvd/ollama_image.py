"""Ollama ile yerel resim üretimi (Linux desteği geldiğinde hazır)."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

OLLAMA_BASE = os.environ.get('OLLAMA_HOST', 'http://127.0.0.1:11434').rstrip('/')
DEFAULT_MODEL = os.environ.get('OLLAMA_IMAGE_MODEL', 'x/z-image-turbo:fp8')

ASPECT_TO_SIZE: dict[str, tuple[int, int]] = {
    '9:16': (576, 1024),
    '1:1': (768, 768),
    '16:9': (1024, 576),
    '4:5': (640, 800),
    '4:3': (768, 576),
}


def _tags() -> list[dict]:
    try:
        req = urllib.request.Request(f'{OLLAMA_BASE}/api/tags', method='GET')
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        return data.get('models') or []
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return []


def image_models() -> list[str]:
    names: list[str] = []
    for m in _tags():
        name = (m.get('name') or '').strip()
        if not name:
            continue
        caps = m.get('capabilities') or []
        if 'image' in caps or 'flux' in name.lower() or 'z-image' in name.lower():
            names.append(name)
    return names


def ollama_image_available() -> bool:
    if os.environ.get('OLLAMA_IMAGE', '1').strip() in ('0', 'false', 'no'):
        return False
    return bool(image_models())


def _pick_model() -> str | None:
    models = image_models()
    if not models:
        return None
    preferred = os.environ.get('OLLAMA_IMAGE_MODEL', DEFAULT_MODEL)
    for m in models:
        if m == preferred or m.startswith(preferred.split(':')[0]):
            return m
    return models[0]


def generate_image(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
    seed: int | None = None,
) -> Path:
    model = _pick_model()
    if not model:
        raise RuntimeError(
            'Ollama resim modeli yok. Kurulum:\n'
            '  ollama pull x/z-image-turbo:fp8\n'
            'Not: Ollama resim üretimi şu an çoğunlukla macOS’ta; Linux’ta sd-local kullanın.'
        )

    w, h = ASPECT_TO_SIZE.get(aspect, (576, 1024))
    body: dict = {
        'model': model,
        'prompt': prompt[:500],
        'stream': False,
        'options': {'width': w, 'height': h},
    }
    if seed is not None:
        body['options']['seed'] = seed

    req = urllib.request.Request(
        f'{OLLAMA_BASE}/api/generate',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:400]
        raise RuntimeError(f'Ollama resim hatası {e.code}: {detail}') from e

    b64 = data.get('image')
    if not b64:
        raise RuntimeError('Ollama görsel döndürmedi — Linux’ta henüz desteklenmiyor olabilir')

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(b64))
    return out
