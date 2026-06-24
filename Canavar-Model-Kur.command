#!/bin/bash
# 🐉 Canavar AI modelini Mac'e kur (M4 24GB için)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
INSTALL="$ROOT/tools/canavar-ai/install-canavar-model.sh"

if [[ ! -f "$INSTALL" ]]; then
  osascript -e 'display alert "Canavar AI" message "install-canavar-model.sh bulunamadı." as critical'
  exit 1
fi

osascript <<EOF
tell application "Terminal"
  activate
  do script "bash '$INSTALL'"
end tell
EOF
