#!/usr/bin/env python3
"""Komut satırı: prompt → resim → 5/8/10 sn HD video."""

from __future__ import annotations

import argparse
import uuid
from pathlib import Path

from dotenv import load_dotenv

from ai_image import generate_image
from ai_motion import animate_kling_style

load_dotenv()

OUTPUT = Path(__file__).parent / 'output'
OUTPUT.mkdir(exist_ok=True)


def main() -> None:
    p = argparse.ArgumentParser(description='imvd CLI')
    p.add_argument('prompt', help='Resim promptu')
    p.add_argument('-m', '--motion', default='', help='Hareket promptu')
    p.add_argument('-a', '--aspect', default='9:16', choices=['9:16', '1:1', '16:9', '4:5'])
    p.add_argument('-d', '--duration', type=int, default=5, choices=[5, 8, 10])
    p.add_argument('-r', '--resolution', default='1080p', choices=['720p', '1080p'])
    p.add_argument('--image-only', action='store_true', help='Sadece resim üret')
    p.add_argument('--fast-video', action='store_true', help='Wan 2.5 hızlı mod')
    args = p.parse_args()

    job = uuid.uuid4().hex[:8]
    img_path = OUTPUT / f'{job}.png'
    print('🖼️  Resim üretiliyor...')
    path, engine = generate_image(args.prompt, img_path, aspect=args.aspect)
    print(f'   → {path} ({engine})')

    if args.image_only:
        return

    motion = args.motion or f'cinematic advertising motion, smooth camera, {args.prompt[:80]}'
    vid_path = OUTPUT / f'{job}_{args.duration}s.mp4'
    print(f'🎬 {args.duration} sn {args.resolution} video üretiliyor (Kling tarzı)...')
    animate_kling_style(
        path,
        vid_path,
        motion_prompt=motion,
        duration=args.duration,  # type: ignore
        resolution=args.resolution,  # type: ignore
        quality='fast' if args.fast_video else 'kling_hd',  # type: ignore
    )
    print(f'✅ Video: {vid_path}')


if __name__ == '__main__':
    main()
