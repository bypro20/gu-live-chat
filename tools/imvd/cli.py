#!/usr/bin/env python3
"""Komut satırından hızlı canlandırma — Gradio gerekmez."""

from __future__ import annotations

import argparse
from pathlib import Path

from motion import PRESET_LABELS, render_gif, render_motion_video


def main() -> None:
    parser = argparse.ArgumentParser(description='imvd — hızlı canlandırma (ücretsiz)')
    parser.add_argument('image', help='Girdi görseli (jpg/png)')
    parser.add_argument('-o', '--output', help='Çıktı dosyası (.mp4 veya .gif)')
    parser.add_argument(
        '-p', '--preset',
        choices=list(PRESET_LABELS.keys()),
        default='cinematic',
        help='Hareket tipi',
    )
    parser.add_argument('-a', '--aspect', default='9:16', choices=['9:16', '1:1', '16:9', '4:5', 'orijinal'])
    parser.add_argument('-d', '--duration', type=float, default=4.0, help='Süre (saniye)')
    parser.add_argument('--fps', type=int, default=30)
    parser.add_argument('-i', '--intensity', type=float, default=1.15, help='Hareket şiddeti 1.05-1.35')
    parser.add_argument('--gif', action='store_true', help='GIF olarak kaydet')
    args = parser.parse_args()

    src = Path(args.image)
    if not src.exists():
        raise SystemExit(f'Dosya bulunamadı: {src}')

    out = Path(args.output) if args.output else src.with_suffix('.gif' if args.gif else '.mp4')

    if args.gif or out.suffix.lower() == '.gif':
        render_gif(
            src, out,
            preset=args.preset,
            duration=args.duration,
            fps=min(args.fps, 20),
            aspect=args.aspect,
            intensity=args.intensity,
        )
    else:
        render_motion_video(
            src, out,
            preset=args.preset,
            duration=args.duration,
            fps=args.fps,
            aspect=args.aspect,
            intensity=args.intensity,
        )

    print(f'✅ Hazır: {out}')


if __name__ == '__main__':
    main()
