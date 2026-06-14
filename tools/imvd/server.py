#!/usr/bin/env python3
"""imvd yerel sunucu — admin: sonsuz ücretsiz."""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import sys
import traceback
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
OUTPUT = ROOT / 'output'
OUTPUT.mkdir(exist_ok=True)

sys.path.insert(0, str(ROOT))


def load_env() -> None:
    env = ROOT / '.env'
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = line.split('=', 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


load_env()

PORT = int(os.environ.get('IMVD_PORT', '7860'))
HOST = os.environ.get('IMVD_HOST', '0.0.0.0')


def json_response(handler: BaseHTTPRequestHandler, data: dict, status: int = 200) -> None:
    body = json.dumps(data, ensure_ascii=False).encode()
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.end_headers()
    handler.wfile.write(body)


def file_response(handler: BaseHTTPRequestHandler, path: Path) -> None:
    if not path.exists() or not path.is_file():
        handler.send_error(404)
        return
    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or 'application/octet-stream'
    data = path.read_bytes()
    handler.send_response(200)
    handler.send_header('Content-Type', mime)
    handler.send_header('Content-Length', str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f'[imvd] {self.address_string()} {fmt % args}')

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ('/', '/index.html', '/studio.html'):
            return file_response(self, ROOT / 'studio.html')
        if path == '/health':
            from ai_image import any_image_provider_available, is_local_mode
            from kling_client import kling_available
            from replicate_client import token_available

            local_mode = is_local_mode()
            sd_local = sd_webui = ollama_img = False
            if local_mode:
                try:
                    from sd_local import sd_local_available
                    sd_local = sd_local_available()
                except ImportError:
                    pass
                try:
                    from sd_webui import sd_webui_available
                    sd_webui = sd_webui_available()
                except ImportError:
                    pass
                try:
                    from ollama_image import image_models, ollama_image_available
                    ollama_img = ollama_image_available() and bool(image_models())
                except ImportError:
                    pass

            sd_info = None
            if sd_local:
                try:
                    from sd_local import sd_local_info
                    sd_info = sd_local_info()
                except ImportError:
                    pass

            return json_response(self, {
                'ok': True,
                'name': 'imvd',
                'mode': 'local' if local_mode else 'cloud',
                'local': local_mode,
                'kling': kling_available(),
                'replicate': token_available(),
                'sd_local': sd_local,
                'sd_local_info': sd_info,
                'sd_webui': sd_webui,
                'ollama_image': ollama_img,
                'image_ai': any_image_provider_available(),
                'video_free': True,
                'setup': 'bash install-local.sh' if local_mode else 'https://app.klingai.com/global/dev',
                'url': f'http://127.0.0.1:{PORT}',
            })
        if path.startswith('/output/'):
            rel = path.removeprefix('/output/')
            target = (OUTPUT / rel).resolve()
            if str(target).startswith(str(OUTPUT.resolve())):
                return file_response(self, target)
        self.send_error(404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length) if length else b'{}'
        try:
            payload = json.loads(raw.decode() or '{}')
        except json.JSONDecodeError:
            return json_response(self, {'error': 'Geçersiz JSON'}, 400)

        try:
            if path == '/api/login':
                return self._login(payload)
            if path == '/api/generate-image':
                return self._generate_image(payload)
            if path == '/api/animate':
                return self._animate(payload)
            if path == '/api/full':
                return self._full_pipeline(payload)
            return json_response(self, {'error': 'Bilinmeyen endpoint'}, 404)
        except Exception as e:
            traceback.print_exc()
            return json_response(self, {'error': str(e)}, 500)

    def _is_localhost(self) -> bool:
        host = (self.client_address[0] or '').strip()
        if host in ('127.0.0.1', '::1', 'localhost'):
            return True
        # LAN / local ağ
        return host.startswith('192.168.') or host.startswith('10.') or host.startswith('172.')

    def _is_admin(self, p: dict) -> bool:
        from auth import is_admin
        # Localhost = otomatik admin (sonsuz ücretsiz)
        if self._is_localhost():
            return True
        return is_admin(p.get('admin_key'))

    def _login(self, p: dict) -> None:
        from auth import is_admin
        key = (p.get('admin_key') or '').strip()
        if is_admin(key):
            return json_response(self, {'ok': True, 'admin': True, 'message': 'Admin girişi OK — sonsuz ücretsiz'})
        return json_response(self, {'error': 'Geçersiz admin anahtarı'}, 401)

    def _save_upload(self, data_b64: str, suffix: str = '.png') -> Path:
        if ',' in data_b64:
            data_b64 = data_b64.split(',', 1)[1]
        job = uuid.uuid4().hex[:8]
        path = OUTPUT / f'{job}{suffix}'
        path.write_bytes(base64.b64decode(data_b64))
        return path

    def _aspect_for_motion(self, aspect: str) -> str:
        return aspect if aspect in ('9:16', '1:1', '16:9', '4:5') else '9:16'

    def _admin_video(self, img: Path, out: Path, duration: int, aspect: str, motion_prompt: str) -> str:
        """Admin: sonsuz ücretsiz HD canlandırma (yerel)."""
        from motion import render_motion_video
        preset = 'cinematic'
        if 'zoom' in motion_prompt.lower() or 'yakın' in motion_prompt.lower():
            preset = 'zoom_in'
        render_motion_video(
            img, out,
            preset=preset,
            duration=float(duration),
            fps=30,
            aspect=self._aspect_for_motion(aspect),  # type: ignore
            intensity=1.18,
        )
        return f'HD Canlandırma 1080p (admin ∞ — {duration} sn)'

    def _generate_image(self, p: dict) -> None:
        from ai_image import generate_image

        prompt = (p.get('prompt') or '').strip()
        if not prompt:
            return json_response(self, {'error': 'Prompt gerekli'}, 400)

        admin = self._is_admin(p)
        aspect = p.get('aspect', '9:16')
        speed = p.get('speed') or p.get('image_speed')
        job = uuid.uuid4().hex[:8]
        out = OUTPUT / f'{job}.png'
        path, engine = generate_image(
            prompt, out,
            aspect=aspect,
            provider=p.get('provider', 'auto'),
            admin=admin,
            speed=speed,
        )
        return json_response(self, {
            'ok': True,
            'admin': admin,
            'engine': engine,
            'image_url': f'/output/{path.name}',
        })

    def _animate(self, p: dict) -> None:
        from ai_motion import animate_kling_style

        admin = self._is_admin(p)
        duration = int(p.get('duration', 5))
        if duration not in (5, 8, 10):
            duration = 5

        motion_prompt = (p.get('motion_prompt') or '').strip()
        resolution = p.get('resolution', '1080p')
        quality = p.get('quality', 'kling_hd')
        aspect = p.get('aspect', '9:16')
        mode = 'fast' if quality == 'fast' else 'kling_hd'

        job = uuid.uuid4().hex[:8]
        out = OUTPUT / f'{job}_{duration}s.mp4'

        if p.get('image_b64'):
            img = self._save_upload(p['image_b64'])
        elif p.get('image_path') or p.get('image_url'):
            raw = p.get('image_path') or p.get('image_url')
            name = Path(str(raw).split('?')[0]).name
            img = OUTPUT / name
            if not img.exists():
                return json_response(self, {'error': f'Görsel bulunamadı: {name}'}, 400)
        else:
            return json_response(self, {'error': 'Görsel gerekli'}, 400)

        use_ai = p.get('use_ai', True)

        from ai_image import is_local_mode
        use_local_video = not use_ai or is_local_mode()

        if use_local_video:
            from ai_motion import animate_local
            animate_local(
                img, out,
                motion_prompt=motion_prompt or 'cinematic smooth motion',
                duration=duration,
                aspect=aspect,
            )
            engine = 'Yerel HD canlandırma (ücretsiz)'
        else:
            animate_kling_style(
                img, out,
                motion_prompt=motion_prompt or 'cinematic smooth motion, advertising quality',
                duration=duration,  # type: ignore
                resolution=resolution,  # type: ignore
                quality=mode,  # type: ignore
                aspect=aspect,
            )
            from kling_client import kling_available
            engine = 'Kling AI (HD video)' if kling_available() else 'Wan AI (Replicate)'

        return json_response(self, {
            'ok': True,
            'admin': admin,
            'engine': engine,
            'video_url': f'/output/{out.name}',
            'duration': duration,
        })

    def _full_pipeline(self, p: dict) -> None:
        from ai_image import generate_image
        from ai_motion import animate_kling_style
        from replicate_client import token_available

        admin = self._is_admin(p)
        prompt = (p.get('prompt') or '').strip()
        if not prompt:
            return json_response(self, {'error': 'Prompt gerekli'}, 400)

        aspect = p.get('aspect', '9:16')
        duration = int(p.get('duration', 5))
        motion_prompt = (p.get('motion_prompt') or '').strip() or f'cinematic advertising motion: {prompt[:100]}'
        resolution = p.get('resolution', '1080p')
        quality = p.get('quality', 'kling_hd')
        mode = 'fast' if quality == 'fast' else 'kling_hd'

        job = uuid.uuid4().hex[:8]
        img_out = OUTPUT / f'{job}.png'
        vid_out = OUTPUT / f'{job}_{duration}s.mp4'

        img_speed = p.get('speed') or p.get('image_speed')
        img_path, img_engine = generate_image(
            prompt, img_out,
            aspect=aspect,
            provider=p.get('provider', 'auto'),
            admin=admin,
            speed=img_speed,
        )

        from ai_image import is_local_mode
        dur = duration if duration in (5, 8, 10) else 5

        if is_local_mode() or p.get('use_local_video', True):
            from ai_motion import animate_local
            animate_local(img_path, vid_out, motion_prompt=motion_prompt, duration=dur, aspect=aspect)
            vid_engine = 'Yerel HD canlandırma (ücretsiz)'
        else:
            try:
                animate_kling_style(
                    img_path, vid_out,
                    motion_prompt=motion_prompt,
                    duration=dur,  # type: ignore
                    resolution=resolution,  # type: ignore
                    quality=mode,  # type: ignore
                    aspect=aspect,
                    use_local=False,
                )
                from kling_client import kling_available
                vid_engine = 'Kling AI (HD video)' if kling_available() else 'Wan AI (Replicate)'
            except Exception:
                if admin:
                    vid_engine = self._admin_video(img_path, vid_out, dur, aspect, motion_prompt)
                else:
                    raise

        return json_response(self, {
            'ok': True,
            'admin': admin,
            'image_engine': img_engine,
            'video_engine': vid_engine,
            'image_url': f'/output/{img_path.name}',
            'video_url': f'/output/{vid_out.name}',
        })


def main() -> None:
    load_env()
    from ai_image import any_image_provider_available, is_local_mode
    from kling_client import kling_available

    print('=' * 50)
    print('  imvd — reklam görsel + video')
    print(f'  → http://127.0.0.1:{PORT}')
    if is_local_mode():
        print('  Mod: YEREL (ücretsiz — kendi sisteminiz)')
        print(f'  Resim AI: {"✅ hazır" if any_image_provider_available() else "❌ bash install-local.sh"}')
        print('  Video: ✅ yerel HD canlandırma (sonsuz ücretsiz)')
    else:
        print('  Mod: bulut (Kling/Replicate)')
        print(f'  Kling API: {"✅ bağlı" if kling_available() else "❌ .env anahtarları"}')
    print('=' * 50)

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[imvd] Kapatıldı')
        server.server_close()


if __name__ == '__main__':
    main()
