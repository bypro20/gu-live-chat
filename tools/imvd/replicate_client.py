"""Minimal Replicate API istemcisi — ekstra paket gerekmez."""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

API = 'https://api.replicate.com/v1'


def get_token() -> str | None:
    token = os.environ.get('REPLICATE_API_TOKEN') or os.environ.get('REPLICATE_API_KEY')
    if not token:
        return None
    token = token.strip()
    if token in ('', 'r8_xxxxxxxx', 'your_token_here'):
        return None
    if 'xxxx' in token.lower() or token.endswith('_...'):
        return None
    return token


def token_available() -> bool:
    return bool(get_token())


def video_token_available() -> bool:
    return token_available()


def _request(method: str, path: str, body: dict | None = None, *, wait: bool = False) -> dict:
    token = get_token()
    if not token:
        raise RuntimeError('REPLICATE_API_TOKEN gerekli')

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    if wait:
        headers['Prefer'] = 'wait=300'

    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f'{API}{path}', data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=320) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise RuntimeError(f'Replicate hata {e.code}: {detail[:600]}') from e


def file_to_data_uri(path: str | Path) -> str:
    path = Path(path)
    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or 'application/octet-stream'
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f'data:{mime};base64,{b64}'


def run_model(model: str, inputs: dict[str, Any], *, poll_interval: float = 2.0) -> Any:
    """model örn: black-forest-labs/flux-schnell veya owner/name:version_hash"""
    if ':' in model:
        version = model.split(':', 1)[1]
        pred = _request('POST', '/predictions', {'version': version, 'input': inputs}, wait=False)
    else:
        pred = _request('POST', f'/models/{model}/predictions', {'input': inputs}, wait=False)
    pred_id = pred.get('id')
    if not pred_id:
        raise RuntimeError(f'Tahmin oluşturulamadı: {pred}')

    deadline = time.time() + 600
    while time.time() < deadline:
        status = _request('GET', f'/predictions/{pred_id}')
        state = status.get('status')
        if state == 'succeeded':
            return status.get('output')
        if state in ('failed', 'canceled'):
            raise RuntimeError(status.get('error') or f'İşlem {state}')
        time.sleep(poll_interval)

    raise RuntimeError('Zaman aşımı — video üretimi çok uzun sürdü')


def download_url(url: str, dest: str | Path) -> Path:
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'imvd/1.0'})
    with urllib.request.urlopen(req, timeout=180) as resp:
        dest.write_bytes(resp.read())
    return dest


def output_to_path(output: Any, dest: str | Path) -> Path:
    if isinstance(output, str):
        return download_url(output, dest)
    if isinstance(output, list) and output:
        return download_url(str(output[0]), dest)
    raise RuntimeError(f'Beklenmeyen çıktı: {output}')
