"""TTS telaffuz yardımcıları — Gu Live Chat marka adı doğru okunsun."""

from __future__ import annotations

import re

VOICE = 'tr-TR-AhmetNeural'
VOICE_RATE = '-10%'
VOICE_PITCH = '-2Hz'

# Marka İngilizce telaffuz (TTS "gulive kat" demesin diye)
BRAND_EN = '<lang xml:lang="en-US"><prosody rate="-5%" pitch="+0Hz">Gu Live Chat</prosody></lang>'
DOMAIN_EN = '<lang xml:lang="en-US">gulivechat dot com</lang>'


def plain_to_ssml(text: str, voice: str = VOICE, rate: str = VOICE_RATE, pitch: str = VOICE_PITCH) -> str:
    """Düz metni SSML'e çevir; marka adı İngilizce okunur."""
    t = text.strip()
    t = re.sub(r'\bGu Live Chat\b', BRAND_EN, t, flags=re.IGNORECASE)
    t = re.sub(r'\bgulivechat\.com\b', DOMAIN_EN, t, flags=re.IGNORECASE)
    t = re.sub(r'\bgulivechat\b', BRAND_EN, t, flags=re.IGNORECASE)
    # Türkçe cümlelerde noktalama sonrası kısa nefes
    t = t.replace('…', '<break time="400ms"/>')
    t = t.replace('...', '<break time="400ms"/>')
    t = re.sub(r'\.(\s+)', r'.<break time="350ms"/>\1', t)
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="tr-TR">'
        f'<voice name="{voice}"><prosody rate="{rate}" pitch="{pitch}">{t}</prosody></voice>'
        '</speak>'
    )


# Sahne metinleri — "Gu Live Chat" açık yazılır (SSML'e dönüşür)
SCENES_VOICE = [
    'Gu Live Chat. Dijital müşteri deneyiminde… yeni nesil çözüm.',
    'Web sitenize gelen her ziyaretçi… artık yalnız değil.',
    'Canlı sohbet widget\'ı ile… saniyeler içinde yanıt verin.',
    'Yapay zeka destekli otomatik yanıt. WhatsApp ve e-posta… tek gelen kutusunda.',
    'Müşteriler daha hızlı karar verir. Dönüşümünüz artar.',
    'Yedi gün PRO ücretsiz deneyin. Kredi kartı gerekmez. gulivechat.com',
]

SCENES_SUBTITLE = [
    'Gu Live Chat — Yeni Nesil Çözüm',
    'Her ziyaretçi karşılanır',
    'Canlı Sohbet Widget',
    'AI · WhatsApp · Tek Inbox',
    'Dönüşümünüzü Artırın',
    'gulivechat.com — Ücretsiz Başla',
]
