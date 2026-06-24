#!/bin/bash
# 🐉 Canavar AI — yerel Open WebUI sunucusunu başlat (masaüstü çift tık)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/tools/canavar-ai/webui.local.env"
EXAMPLE_ENV="$ROOT/tools/canavar-ai/webui.local.env.example"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
elif [[ -f "$EXAMPLE_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$EXAMPLE_ENV"
fi

WEBUI_HOME="${WEBUI_HOME:-/Users/uguroncan/webui2}"
WEBUI_PORT="${WEBUI_PORT:-8080}"
WEBUI_SECRET_KEY="${WEBUI_SECRET_KEY:-canavar-ai-secret-2024}"
DATA_DIR="${DATA_DIR:-$WEBUI_HOME/data}"

VENV_BIN="$WEBUI_HOME/.venv/bin"
OPENWEBUI="$VENV_BIN/open-webui"

if [[ ! -x "$OPENWEBUI" ]]; then
  osascript -e "display alert \"Canavar AI\" message \"open-webui bulunamadı: $OPENWEBUI\n\nwebui.local.env dosyasında WEBUI_HOME yolunu düzeltin.\" as critical" 2>/dev/null || {
    echo "HATA: open-webui bulunamadı: $OPENWEBUI"
    echo "tools/canavar-ai/webui.local.env.example → webui.local.env kopyalayıp yolları güncelleyin."
  }
  exit 1
fi

if [[ -n "${PYTHON:-}" && -x "$PYTHON" ]]; then
  PY="$PYTHON"
elif [[ -x "$VENV_BIN/python3" ]]; then
  PY="$VENV_BIN/python3"
else
  PY="python3"
fi

# Önceki oturumu kapat
pkill -f "open-webui serve" 2>/dev/null || true
pkill -f "owui_run" 2>/dev/null || true
sleep 1

export WEBUI_SECRET_KEY
export DATA_DIR
export PYTHONPATH="${PYTHONPATH:-$WEBUI_HOME/.venv/lib/python3.11/site-packages}"

# macOS .command bazen venv giriş noktasını doğrudan çalıştıramıyor — /tmp kopyası güvenilir
RUNNER="/tmp/canavar-owui-run.py"
cp "$OPENWEBUI" "$RUNNER" 2>/dev/null || cp "$VENV_BIN/open-webui" "$RUNNER"

cd "$WEBUI_HOME"

echo "🐉 Canavar AI sunucusu başlıyor..."
echo "   Adres: http://127.0.0.1:$WEBUI_PORT"
echo "   Veri:  $DATA_DIR"
echo "   Durdurmak: Ctrl+C veya pkill -f owui_run"

# Tarayıcıyı birkaç saniye sonra aç
(sleep 4 && open "http://127.0.0.1:$WEBUI_PORT") &

exec "$PY" "$RUNNER" serve --host 0.0.0.0 --port "$WEBUI_PORT"
