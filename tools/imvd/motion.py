"""Hızlı, ücretsiz resim canlandırma — sadece Pillow (+ isteğe bağlı ffmpeg)."""

from __future__ import annotations

import math
import subprocess
import tempfile
from pathlib import Path
from typing import Literal

from PIL import Image

MotionPreset = Literal[
    'zoom_in',
    'zoom_out',
    'pan_left',
    'pan_right',
    'pan_up',
    'pan_down',
    'cinematic',
    'pulse',
    'dolly_zoom',
]

AspectRatio = Literal['9:16', '1:1', '16:9', '4:5', 'orijinal']

ASPECT_MAP: dict[AspectRatio, tuple[int, int] | None] = {
    '9:16': (1080, 1920),
    '1:1': (1080, 1080),
    '16:9': (1920, 1080),
    '4:5': (1080, 1350),
    'orijinal': None,
}


def _ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def _ease_in_out(t: float) -> float:
    return t * t * (3 - 2 * t)


def _fit_cover(img: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def _crop_frame(
    src: Image.Image,
    center_x: float,
    center_y: float,
    scale: float,
    out_w: int,
    out_h: int,
) -> Image.Image:
    sw, sh = src.size
    view_w = out_w / scale
    view_h = out_h / scale
    left = center_x - view_w / 2
    top = center_y - view_h / 2
    right = left + view_w
    bottom = top + view_h

    pad_left = max(0, -left)
    pad_top = max(0, -top)
    pad_right = max(0, right - sw)
    pad_bottom = max(0, bottom - sh)

    crop_left = max(0, left)
    crop_top = max(0, top)
    crop_right = min(sw, right)
    crop_bottom = min(sh, bottom)

    cropped = src.crop((int(crop_left), int(crop_top), int(crop_right), int(crop_bottom)))
    if any([pad_left, pad_top, pad_right, pad_bottom]):
        padded = Image.new('RGB', (int(view_w), int(view_h)), (0, 0, 0))
        padded.paste(cropped, (int(pad_left), int(pad_top)))
        cropped = padded

    return cropped.resize((out_w, out_h), Image.Resampling.LANCZOS)


def _motion_params(
    preset: MotionPreset,
    t: float,
    cx: float,
    cy: float,
    max_scale: float,
) -> tuple[float, float, float]:
    e = _ease_in_out(t)

    if preset == 'zoom_in':
        return cx, cy, 1.0 + e * (max_scale - 1.0)
    if preset == 'zoom_out':
        return cx, cy, max_scale - e * (max_scale - 1.0)
    if preset == 'pan_left':
        shift = e * 0.12
        return cx * (1 + shift), cy, 1.08
    if preset == 'pan_right':
        shift = e * 0.12
        return cx * (1 - shift), cy, 1.08
    if preset == 'pan_up':
        shift = e * 0.10
        return cx, cy * (1 + shift), 1.08
    if preset == 'pan_down':
        shift = e * 0.10
        return cx, cy * (1 - shift), 1.08
    if preset == 'cinematic':
        return cx * (1 - e * 0.04), cy * (1 - e * 0.02), 1.0 + e * (max_scale - 1.0)
    if preset == 'pulse':
        pulse = 1.0 + math.sin(t * math.pi * 2) * 0.015
        return cx, cy, 1.05 * pulse
    if preset == 'dolly_zoom':
        z = 1.0 + e * (max_scale - 1.0)
        return cx, cy, z

    return cx, cy, 1.0


def _build_frames(
    image_path: str | Path,
    *,
    preset: MotionPreset = 'cinematic',
    duration: float = 4.0,
    fps: int = 30,
    aspect: AspectRatio = '9:16',
    intensity: float = 1.15,
) -> tuple[list[Image.Image], int]:
    src = Image.open(image_path).convert('RGB')
    target = ASPECT_MAP[aspect]
    if target:
        out_w, out_h = target
        base = _fit_cover(src, out_w, out_h)
    else:
        out_w, out_h = src.size
        base = src

    cx, cy = out_w / 2, out_h / 2
    max_scale = max(1.05, min(intensity, 1.35))
    frame_count = max(2, int(duration * fps))
    frames: list[Image.Image] = []

    for i in range(frame_count):
        t = i / (frame_count - 1)
        mx, my, scale = _motion_params(preset, t, cx, cy, max_scale)
        frames.append(_crop_frame(base, mx, my, scale, out_w, out_h))

    return frames, fps


def _frames_to_mp4(frames: list[Image.Image], output_path: Path, fps: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = _ffmpeg_exe()

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for i, frame in enumerate(frames):
            frame.save(tmp_path / f'frame_{i:05d}.jpg', quality=92)

        cmd = [
            ffmpeg, '-y',
            '-framerate', str(fps),
            '-i', str(tmp_path / 'frame_%05d.jpg'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            str(output_path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            gif_fallback = output_path.with_suffix('.gif')
            _save_gif_frames(frames, gif_fallback, fps)
            raise RuntimeError(
                f'MP4 için ffmpeg gerekli. GIF olarak kaydedildi: {gif_fallback}\n'
                f'Kurulum: pip install imageio-ffmpeg  veya  sudo apt install ffmpeg\n'
                f'{proc.stderr[-300:]}'
            )


def render_motion_video(
    image_path: str | Path,
    output_path: str | Path,
    *,
    preset: MotionPreset = 'cinematic',
    duration: float = 4.0,
    fps: int = 30,
    aspect: AspectRatio = '9:16',
    intensity: float = 1.15,
    quality: int = 90,
) -> Path:
    del quality  # jpeg kalitesi sabit
    frames, out_fps = _build_frames(
        image_path,
        preset=preset,
        duration=duration,
        fps=fps,
        aspect=aspect,
        intensity=intensity,
    )
    out = Path(output_path)
    _frames_to_mp4(frames, out, out_fps)
    return out


def _save_gif_frames(frames: list[Image.Image], output_path: Path, fps: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ms = int(1000 / fps)
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=ms,
        loop=0,
        optimize=True,
    )


def render_gif(
    image_path: str | Path,
    output_path: str | Path,
    *,
    preset: MotionPreset = 'zoom_in',
    duration: float = 3.0,
    fps: int = 15,
    aspect: AspectRatio = '1:1',
    intensity: float = 1.12,
) -> Path:
    frames, out_fps = _build_frames(
        image_path,
        preset=preset,
        duration=duration,
        fps=fps,
        aspect=aspect,
        intensity=intensity,
    )
    out = Path(output_path)
    _save_gif_frames(frames, out, out_fps)
    return out


PRESET_LABELS: dict[MotionPreset, str] = {
    'zoom_in': 'Yakınlaştır (ürün odak)',
    'zoom_out': 'Uzaklaştır (açılış)',
    'pan_left': 'Sola kaydır',
    'pan_right': 'Sağa kaydır',
    'pan_up': 'Yukarı kaydır',
    'pan_down': 'Aşağı kaydır',
    'cinematic': 'Sinematik (reklam)',
    'pulse': 'Nabız / dikkat çek',
    'dolly_zoom': 'Dolly zoom',
}
