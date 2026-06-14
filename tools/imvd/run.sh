#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "→ imvd .env oluşturuldu (yerel ücretsiz mod)"
fi

if [ -d .venv ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
else
  pip install --user --break-system-packages -q pillow imageio-ffmpeg 2>/dev/null || \
    pip install --user -q pillow imageio-ffmpeg 2>/dev/null || true
fi

echo "imvd başlatılıyor → http://127.0.0.1:7860"
echo "⚠️  studio.html dosyasını çift tıklamayın — yukarıdaki linki kullanın"
python3 server.py
