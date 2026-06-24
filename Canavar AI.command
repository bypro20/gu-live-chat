#!/bin/bash
# 🐉 Canavar AI — masaüstünden çift tıkla başlat (macOS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
CANAVAR="$ROOT/tools/canavar-ai"

if [[ ! -d "$CANAVAR" ]]; then
  osascript -e 'display alert "Canavar AI" message "tools/canavar-ai klasörü bulunamadı." as critical'
  exit 1
fi

cd "$CANAVAR"

if [[ ! -f canavar.config.json ]]; then
  osascript -e 'display notification "İlk kurulum — sunucu: gulivechat.online" with title "🐉 Canavar AI"'
  python3 setup.py
fi

# Yerel sunucu çalışmıyorsa uyar
LOCAL_URL="$(python3 -c "import json; print(json.load(open('canavar.config.json')).get('base_url',''))" 2>/dev/null || true)"
if [[ "$LOCAL_URL" =~ ^http://(127\.0\.0\.1|localhost)(:[0-9]+)?/?$ ]]; then
  if ! curl -sf --max-time 2 "${LOCAL_URL%/}/api/config" >/dev/null 2>&1; then
    osascript -e 'display notification "Önce Canavar-AI-Baslat.command ile sunucuyu başlatın." with title "🐉 Canavar AI"' 2>/dev/null || true
  fi
fi

# Terminal penceresinde aç
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$CANAVAR' && python3 agent.py"
end tell
EOF
