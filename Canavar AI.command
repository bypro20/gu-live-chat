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
  osascript -e 'display notification "İlk kurulum başlıyor..." with title "🐉 Canavar AI"'
  python3 setup.py
fi

# Terminal penceresinde aç
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$CANAVAR' && python3 agent.py"
end tell
EOF
