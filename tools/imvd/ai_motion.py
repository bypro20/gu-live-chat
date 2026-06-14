"""Video canlandırma — yerel (ücretsiz) veya bulut (Kling/Wan)."""

from __future__ import annotations

import os
from pathlib import Path

from ai_image import is_local_mode
from kling_client import image_to_video as kling_image_to_video, kling_available
from replicate_client import file_to_data_uri, output_to_path, run_model, token_available

WAN_27 = 'wan-video/wan-2.7-i2v'
WAN_25_FAST = 'wan-video/wan-2.5-i2v-fast'


def replicate_available() -> bool:
    return token_available()


def animate_local(
    image_path: str | Path,
    output_path: str | Path,
    *,
    motion_prompt: str = '',
    duration: int = 5,
    aspect: str = '9:16',
) -> Path:
    """Ücretsiz HD canlandırma — zoom/pan (kendi sisteminiz)."""
    from motion import render_motion_video

    preset = 'cinematic'
    mp = (motion_prompt or '').lower()
    if 'zoom' in mp or 'yakın' in mp:
        preset = 'zoom_in'
    elif 'pan' in mp or 'kay' in mp:
        preset = 'pan_right'

    aspect_val = aspect if aspect in ('9:16', '1:1', '16:9', '4:5') else '9:16'
    return render_motion_video(
        image_path,
        output_path,
        preset=preset,  # type: ignore
        duration=float(duration),
        fps=30,
        aspect=aspect_val,  # type: ignore
        intensity=1.18,
    )


def animate_kling_style(
    image_path: str | Path,
    output_path: str | Path,
    *,
    motion_prompt: str,
    duration: int = 5,
    resolution: str = '1080p',
    quality: str = 'kling_hd',
    aspect: str = '9:16',
    use_local: bool | None = None,
) -> Path:
    """Resmi videoya çevir — yerel modda varsayılan ücretsiz canlandırma."""
    if use_local is None:
        use_local = is_local_mode()

    if use_local:
        return animate_local(
            image_path, output_path,
            motion_prompt=motion_prompt,
            duration=duration,
            aspect=aspect,
        )

    if kling_available():
        mode = 'pro' if quality == 'kling_hd' else 'std'
        return kling_image_to_video(
            image_path,
            output_path,
            prompt=motion_prompt,
            duration=duration,
            mode=mode,
        )

    if not token_available():
        return animate_local(
            image_path, output_path,
            motion_prompt=motion_prompt,
            duration=duration,
            aspect=aspect,
        )

    image_uri = file_to_data_uri(image_path)
    dur = 10 if duration >= 8 else 5
    prompt = motion_prompt.strip() or 'cinematic smooth motion'

    if quality == 'kling_hd':
        model = WAN_27
        inputs = {
            'first_frame': image_uri,
            'prompt': prompt,
            'resolution': resolution,
            'duration': dur,
            'enable_prompt_expansion': True,
        }
    else:
        model = WAN_25_FAST
        inputs = {'image': image_uri, 'prompt': prompt, 'duration': dur, 'resolution': resolution}

    output = run_model(model, inputs, poll_interval=3.0)
    return output_to_path(output, output_path)


def animate_with_replicate(*args, **kwargs):
    return animate_kling_style(*args, **kwargs)
