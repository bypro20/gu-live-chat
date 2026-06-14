#!/usr/bin/env python3
"""imvd — ChatGPT gibi resim üret + Kling gibi HD canlandır."""

from __future__ import annotations

import uuid
from pathlib import Path

import gradio as gr
from dotenv import load_dotenv

from ai_image import generate_image
from ai_motion import animate_kling_style, replicate_available
from motion import PRESET_LABELS, render_gif, render_motion_video
from replicate_client import token_available

load_dotenv()

OUTPUT_DIR = Path(__file__).parent / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)

PRESET_CHOICES = list(PRESET_LABELS.items())
ASPECT_CHOICES = ['9:16', '1:1', '16:9', '4:5']
DURATION_CHOICES = [('5 saniye', 5), ('8 saniye', 8), ('10 saniye', 10)]


def studio_generate_image(prompt: str, aspect: str, provider: str):
    if not prompt.strip():
        raise gr.Error('Görsel için bir prompt yazın (ör: lüks parfüm şişesi, mermer masa, sinematik ışık)')

    job = uuid.uuid4().hex[:8]
    out = OUTPUT_DIR / f'{job}_image.png'
    path, engine = generate_image(prompt, out, aspect=aspect, provider=provider)
    return str(path), f'✅ Görsel hazır — {engine}'


def studio_animate(
    image,
    motion_prompt: str,
    duration_label: str,
    resolution: str,
    quality: str,
):
    if image is None:
        raise gr.Error('Önce görsel üretin veya yükleyin.')

    duration = next(v for lbl, v in DURATION_CHOICES if lbl == duration_label)
    job = uuid.uuid4().hex[:8]
    out = OUTPUT_DIR / f'{job}_video_{duration}s.mp4'

    if not replicate_available():
        raise gr.Error(
            'HD AI canlandırma için REPLICATE_API_TOKEN gerekli.\n'
            'Ücretsiz kayıt: replicate.com → API Tokens → tools/imvd/.env'
        )

    mode = 'kling_hd' if quality == 'Kling HD (Wan 2.7)' else 'fast'
    animate_kling_style(
        image,
        out,
        motion_prompt=motion_prompt,
        duration=duration,  # type: ignore
        resolution='1080p' if resolution == '1080p (Full HD)' else '720p',
        quality=mode,  # type: ignore
    )
    res = '1080p' if resolution == '1080p (Full HD)' else '720p'
    return str(out), f'✅ {duration} sn {res} video hazır (Wan AI)'


def studio_full_pipeline(
    prompt: str,
    motion_prompt: str,
    aspect: str,
    duration_label: str,
    resolution: str,
    quality: str,
    provider: str,
):
    """Tek tık: prompt → resim → video"""
    img_path, img_status = studio_generate_image(prompt, aspect, provider)
    vid_path, vid_status = studio_animate(
        img_path,
        motion_prompt or f'cinematic advertising motion for: {prompt[:120]}',
        duration_label,
        resolution,
        quality,
    )
    return img_path, vid_path, f'{img_status}\n{vid_status}'


def fast_animate(image, preset_label, aspect, duration, fps, intensity, output_format):
    if image is None:
        raise gr.Error('Görsel yükleyin.')
    preset = next(k for k, v in PRESET_CHOICES if v == preset_label)
    job = uuid.uuid4().hex[:8]
    ext = 'gif' if output_format == 'GIF' else 'mp4'
    out = OUTPUT_DIR / f'{job}.{ext}'
    if output_format == 'GIF':
        render_gif(image, out, preset=preset, duration=duration, fps=min(fps, 20), aspect=aspect, intensity=intensity)
    else:
        render_motion_video(image, out, preset=preset, duration=duration, fps=fps, aspect=aspect, intensity=intensity)
    return str(out), f'Hazır — {duration}s {aspect}'


token_ok = token_available()
status_banner = (
    '✅ **Replicate bağlı** — Flux görsel + Wan 2.7 HD video (ücretsiz ~$5 kredi ile başlar)'
    if token_ok
    else '⚠️ **REPLICATE_API_TOKEN** ekleyin → `tools/imvd/.env` dosyasına `REPLICATE_API_TOKEN=r8_...` yazın. '
         'Kayıt ücretsiz, kredi kartı gerekmez, ~$5 deneme kredisi verir.'
)

with gr.Blocks(title='imvd', theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        f"""
# imvd
**ChatGPT gibi** prompt ile resim üret · **Kling AI gibi** 5 / 8 / 10 saniye HD canlandır

{status_banner}
        """
    )

    with gr.Tab('✨ Tam Stüdyo (Resim + Video)'):
        with gr.Row():
            with gr.Column(scale=1):
                studio_prompt = gr.Textbox(
                    label='Resim promptu (Türkçe veya İngilizce)',
                    placeholder='Örn: lüks kadın parfümü, altın şişe, mermer arka plan, reklam fotoğrafı, sinematik ışık',
                    lines=3,
                )
                studio_motion = gr.Textbox(
                    label='Hareket promptu (opsiyonel)',
                    placeholder='Örn: yavaş kamera zoom, ışık parıltısı, duman efekti, pürüzsüz sinematik hareket',
                    lines=2,
                )
                studio_aspect = gr.Dropdown(ASPECT_CHOICES, value='9:16', label='Görsel / video formatı')
                studio_provider = gr.Radio(
                    ['auto', 'flux', 'pollinations'],
                    value='auto',
                    label='Resim motoru',
                    info='auto = Flux (token varsa) veya ücretsiz Pollinations',
                )
                studio_duration = gr.Radio(
                    [lbl for lbl, _ in DURATION_CHOICES],
                    value='5 saniye',
                    label='Video süresi',
                )
                studio_resolution = gr.Radio(
                    ['1080p (Full HD)', '720p (Hızlı)'],
                    value='1080p (Full HD)',
                    label='Video kalitesi',
                )
                studio_quality = gr.Radio(
                    ['Kling HD (Wan 2.7)', 'Hızlı (Wan 2.5)'],
                    value='Kling HD (Wan 2.7)',
                    label='AI video motoru',
                )

                with gr.Row():
                    img_btn = gr.Button('🖼️ Sadece Resim Üret', variant='secondary')
                    full_btn = gr.Button('🚀 Resim Üret + Canlandır', variant='primary')

                studio_status = gr.Textbox(label='Durum', interactive=False, lines=3)

            with gr.Column(scale=1):
                studio_image = gr.Image(label='Üretilen görsel', type='filepath')
                studio_video = gr.Video(label='HD AI video')

        img_btn.click(
            studio_generate_image,
            [studio_prompt, studio_aspect, studio_provider],
            [studio_image, studio_status],
        )
        full_btn.click(
            studio_full_pipeline,
            [studio_prompt, studio_motion, studio_aspect, studio_duration, studio_resolution, studio_quality, studio_provider],
            [studio_image, studio_video, studio_status],
        )

        gr.Markdown(
            """
### İş akışı
1. Ürün/konsept promptu yaz → **9:16** Reels/TikTok, **1:1** feed
2. Süre seç: **5 sn** hızlı reklam · **8 sn** orta · **10 sn** hikâye
3. **1080p + Wan 2.7** = Kling'e en yakın kalite
4. Tek tıkla resim + video veya önce resmi kontrol edip sonra canlandır

**Maliyet (Replicate):** Flux resim ~$0.003 · 5 sn 1080p video ~$0.30–0.80 · $5 ücretsiz kredi ile onlarca reklam
            """
        )

    with gr.Tab('🎬 Mevcut Görseli Canlandır'):
        with gr.Row():
            with gr.Column():
                exist_image = gr.Image(type='filepath', label='Görsel yükle')
                exist_motion = gr.Textbox(label='Hareket promptu', lines=2)
                exist_duration = gr.Radio([lbl for lbl, _ in DURATION_CHOICES], value='8 saniye')
                exist_res = gr.Radio(['1080p (Full HD)', '720p (Hızlı)'], value='1080p (Full HD)')
                exist_quality = gr.Radio(['Kling HD (Wan 2.7)', 'Hızlı (Wan 2.5)'], value='Kling HD (Wan 2.7)')
                exist_btn = gr.Button('HD Canlandır', variant='primary')
            with gr.Column():
                exist_video = gr.Video()
                exist_status = gr.Textbox(interactive=False)

        exist_btn.click(
            studio_animate,
            [exist_image, exist_motion, exist_duration, exist_res, exist_quality],
            [exist_video, exist_status],
        )

    with gr.Tab('⚡ Hızlı Canlandırma (Ücretsiz, AI değil)'):
        with gr.Row():
            with gr.Column():
                fast_image = gr.Image(type='filepath', label='Görsel')
                fast_preset = gr.Dropdown([v for _, v in PRESET_CHOICES], value='Sinematik (reklam)')
                fast_aspect = gr.Dropdown(ASPECT_CHOICES + ['orijinal'], value='9:16')
                fast_duration = gr.Slider(2, 10, value=4, step=0.5)
                fast_fps = gr.Slider(24, 60, value=30, step=1)
                fast_intensity = gr.Slider(1.05, 1.35, value=1.15, step=0.01)
                fast_format = gr.Radio(['MP4', 'GIF'], value='MP4')
                fast_btn = gr.Button('Canlandır')
            with gr.Column():
                fast_video = gr.Video()
                fast_status = gr.Textbox(interactive=False)

        fast_btn.click(
            fast_animate,
            [fast_image, fast_preset, fast_aspect, fast_duration, fast_fps, fast_intensity, fast_format],
            [fast_video, fast_status],
        )


if __name__ == '__main__':
    demo.launch(server_name='0.0.0.0', server_port=7860, share=False)
