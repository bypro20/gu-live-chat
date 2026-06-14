"""Automatic1111 / Forge WebUI API — yerel SD arayüzü."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ASPECT_TO_SIZE: dict[str, tuple[int, int]] = {
    '9:16': (512, 896),
    '1:1': (512, 512),
    '16:9': (896, 512),
    '4:5': (512, 640),
    '4:3': (640, 480),
}


def _base() -> str:
    return os.environ.get('SD_WEBUI_URL', 'http://127.0.0.1:7861').rstrip('/')


def sd_webui_available() -> bool:
    if not os.environ.get('SD_WEBUI_URL', '').strip() and os.environ.get('SD_WEBUI', '0') not in ('1', 'true', 'yes'):
        return False
    try:
        req = urllib.request.Request(f'{_base()}/sdapi/v1/sd-models', method='GET')
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except (urllib.error.URLError, TimeoutError):
        return False


def generate_image(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
    seed: int = -1,
) -> Path:
    w, h = ASPECT_TO_SIZE.get(aspect, (512, 896))
    body = {
        'prompt': prompt[:500],
        'negative_prompt': 'blur, low quality, watermark, text',
        'width': w,
        'height': h,
        'steps': int(os.environ.get('SD_WEBUI_STEPS', '20')),
        'cfg_scale': 7,
        'seed': seed,
    }
    req = urllib.request.Request(
        f'{_base()}/sdapi/v1/txt2img',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'SD WebUI hata {e.code}: {e.read().decode()[:300]}') from e

    images = data.get('images') or []
    if not images:
        raise RuntimeError('SD WebUI görsel döndürmedi')

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(images[0]))
    return out
