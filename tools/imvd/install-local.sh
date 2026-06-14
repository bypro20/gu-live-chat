#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "→ imvd yerel (ücretsiz) resim AI kurulumu"

PIP=(python3 -m pip install --user --break-system-packages)

"${PIP[@]}" --upgrade pip
"${PIP[@]}" -r requirements.txt
"${PIP[@]}" -r requirements-local.txt

if [ -f .env ]; then
  grep -q '^IMVD_MODE=' .env && sed -i 's/^IMVD_MODE=.*/IMVD_MODE=local/' .env || echo 'IMVD_MODE=local' >> .env
else
  cp .env.example .env 2>/dev/null || echo 'IMVD_MODE=local' > .env
fi

echo ""
echo "✅ Kurulum tamam."
echo "   Sunucu: cd tools/imvd && ./run.sh"
echo "   Arayüz: http://127.0.0.1:7860"
