"""Resim üretimi — yerel (ücretsiz) veya bulut (Kling/Replicate)."""

from __future__ import annotations

import os
from pathlib import Path

from kling_client import generate_image as kling_generate_image, kling_available
from replicate_client import output_to_path, run_model, token_available

FLUX_MODEL = 'black-forest-labs/flux-schnell'


def is_local_mode() -> bool:
    return (os.environ.get('IMVD_MODE') or 'local').strip().lower() in ('local', 'free', 'self')


def _setup_help() -> str:
    return (
        'Ücretsiz yerel resim için kurulum:\n'
        '  cd tools/imvd && bash install-local.sh\n'
        'Sonra sunucuyu yeniden başlatın.\n'
        'Alternatif: SD WebUI çalıştırıp .env → SD_WEBUI_URL=http://127.0.0.1:7861'
    )


def any_image_provider_available() -> bool:
    if is_local_mode():
        from ollama_image import ollama_image_available
        from sd_local import sd_local_available
        from sd_webui import sd_webui_available
        return sd_local_available() or sd_webui_available() or ollama_image_available()
    return kling_available() or token_available()


def _default_image_speed() -> str:
    if is_local_mode():
        return os.environ.get('SD_LOCAL_DEFAULT_SPEED', 'fast').strip().lower() or 'fast'
    return 'normal'


def generate_image(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
    provider: str = 'auto',
    seed: int | None = None,
    admin: bool = False,
    speed: str | None = None,
) -> tuple[Path, str]:
    prompt = prompt.strip()
    if not prompt:
        raise ValueError('Prompt boş olamaz')

    out = Path(output_path)
    mode = 'local' if is_local_mode() or provider in ('local', 'sd', 'ollama') else 'cloud'
    image_speed = speed or _default_image_speed()

    if mode == 'local' or provider in ('local', 'sd', 'ollama', 'webui'):
        # 1) SD WebUI (en hızlı kurulum — ayrı A1111/Forge)
        if provider in ('auto', 'webui', 'local'):
            from sd_webui import generate_image as webui_gen, sd_webui_available
            if sd_webui_available():
                path = webui_gen(prompt, out, aspect=aspect, seed=seed if seed is not None else -1)
                return path, 'Yerel SD WebUI (ücretsiz)'

        # 2) Ollama resim modeli
        if provider in ('auto', 'ollama', 'local'):
            from ollama_image import generate_image as ollama_gen, image_models, ollama_image_available
            if ollama_image_available() and image_models():
                path = ollama_gen(prompt, out, aspect=aspect, seed=seed)
                return path, 'Ollama (yerel AI — ücretsiz)'

        # 3) Yerel Stable Diffusion (diffusers)
        if provider in ('auto', 'sd', 'local'):
            from sd_local import _resolve_speed, generate_image as sd_gen, sd_local_available
            if sd_local_available():
                resolved = _resolve_speed(image_speed)
                path = sd_gen(prompt, out, aspect=aspect, seed=seed, speed=resolved)
                label = 'Hızlı' if resolved == 'fast' else 'Normal'
                return path, f'Yerel SD-Turbo ({label}, ücretsiz)'

        if is_local_mode():
            raise RuntimeError(_setup_help())

    # Bulut: Kling
    if kling_available() and provider in ('auto', 'kling', 'cloud'):
        path = kling_generate_image(prompt, out, aspect=aspect)
        return path, 'Kling AI'

    # Bulut: Replicate Flux
    if token_available() and provider in ('auto', 'flux', 'cloud'):
        inputs = {
            'prompt': prompt,
            'aspect_ratio': aspect,
            'num_outputs': 1,
            'output_format': 'png',
            'output_quality': 95,
            'go_fast': True,
        }
        if seed is not None:
            inputs['seed'] = seed
        output = run_model(FLUX_MODEL, inputs)
        path = output_to_path(output, out)
        return path, 'Flux (Replicate)'

    raise RuntimeError(_setup_help())
