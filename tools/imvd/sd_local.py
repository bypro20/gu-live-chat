"""Yerel Stable Diffusion — tamamen ücretsiz, internet/API yok."""

from __future__ import annotations

import os
from pathlib import Path

ASPECT_TO_SIZE: dict[str, tuple[int, int]] = {
    '9:16': (512, 896),
    '1:1': (512, 512),
    '16:9': (896, 512),
    '4:5': (512, 640),
    '4:3': (640, 480),
}

ASPECT_TO_SIZE_FAST: dict[str, tuple[int, int]] = {
    '9:16': (384, 672),
    '1:1': (384, 384),
    '16:9': (672, 384),
    '4:5': (384, 480),
    '4:3': (480, 360),
}

_pipeline = None


def _deps_ok() -> bool:
    try:
        import torch  # noqa: F401
        from diffusers import AutoPipelineForText2Image  # noqa: F401
        return True
    except ImportError:
        return False


def sd_local_available() -> bool:
    if os.environ.get('SD_LOCAL', '1').strip() in ('0', 'false', 'no'):
        return False
    return _deps_ok()


def _resolve_speed(speed: str | None) -> str:
    raw = (speed or os.environ.get('SD_LOCAL_DEFAULT_SPEED', 'fast')).strip().lower()
    if raw in ('normal', 'quality', 'high', 'slow'):
        return 'normal'
    return 'fast'


def _model_for_speed(speed: str) -> str:
    if speed == 'fast':
        fast = os.environ.get('SD_LOCAL_FAST_MODEL', '').strip()
        if fast:
            return fast
    return os.environ.get('SD_LOCAL_MODEL', 'stabilityai/sd-turbo')


def _size_and_steps(aspect: str, speed: str) -> tuple[int, int, int, str]:
    model_id = _model_for_speed(speed)
    is_turbo = 'turbo' in model_id.lower()
    size_map = ASPECT_TO_SIZE if speed == 'normal' else ASPECT_TO_SIZE_FAST
    w, h = size_map.get(aspect, size_map['9:16'])
    if speed == 'fast':
        steps = int(os.environ.get('SD_LOCAL_FAST_STEPS', '2' if is_turbo else '12'))
    else:
        steps = int(os.environ.get('SD_LOCAL_STEPS', '4' if is_turbo else '20'))
    return w, h, steps, model_id


def sd_local_info() -> dict:
    model = os.environ.get('SD_LOCAL_MODEL', 'stabilityai/sd-turbo')
    fast_model = os.environ.get('SD_LOCAL_FAST_MODEL', '').strip() or model
    fw, fh, fsteps, _ = _size_and_steps('9:16', 'fast')
    nw, nh, nsteps, _ = _size_and_steps('9:16', 'normal')
    return {
        'available': sd_local_available(),
        'default_speed': _resolve_speed(None),
        'fast': {'model': fast_model, '9:16': [fw, fh], 'steps': fsteps},
        'normal': {'model': model, '9:16': [nw, nh], 'steps': nsteps},
    }


def _get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    import torch
    from diffusers import AutoPipelineForText2Image

    model_id = os.environ.get('SD_LOCAL_MODEL', 'stabilityai/sd-turbo')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    dtype = torch.float16 if device == 'cuda' else torch.float32

    pipe = AutoPipelineForText2Image.from_pretrained(model_id, torch_dtype=dtype)
    if device == 'cpu':
        pipe.enable_attention_slicing()
        threads = int(os.environ.get('SD_LOCAL_THREADS', str(os.cpu_count() or 4)))
        torch.set_num_threads(max(1, threads))
    pipe = pipe.to(device)
    _pipeline = pipe
    return _pipeline


def generate_image(
    prompt: str,
    output_path: str | Path,
    *,
    aspect: str = '9:16',
    seed: int | None = None,
    speed: str | None = None,
) -> Path:
    if not sd_local_available():
        raise RuntimeError(
            'Yerel SD kurulu değil. Kurulum:\n'
            '  cd tools/imvd && bash install-local.sh'
        )

    import torch

    resolved = _resolve_speed(speed)
    w, h, steps, model_id = _size_and_steps(aspect, resolved)
    pipe = _get_pipeline()
    is_turbo = 'turbo' in model_id.lower()
    generator = None
    if seed is not None:
        generator = torch.Generator(device='cpu' if pipe.device.type == 'cpu' else pipe.device).manual_seed(seed)

    result = pipe(
        prompt=prompt[:500],
        width=w,
        height=h,
        num_inference_steps=steps,
        guidance_scale=0.0 if is_turbo else 7.5,
        generator=generator,
    )
    image = result.images[0]
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, 'PNG')
    return out
