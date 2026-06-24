#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [[ ! -f canavar.config.json ]]; then
  echo "🐉 İlk kurulum..."
  python3 setup.py
fi

exec python3 agent.py
