#!/usr/bin/env bash
# Mac / sunucuda Canavar AI Ollama modelini oluşturur
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🐉 Canavar AI modeli kuruluyor..."
echo "   Taban: qwen2.5-coder:14b"
echo ""

if ! command -v ollama &>/dev/null; then
  echo "❌ Ollama yok. Kur: https://ollama.com veya brew install ollama"
  exit 1
fi

echo "[1/2] qwen2.5-coder:14b indiriliyor (ilk sefer uzun sürebilir)..."
ollama pull qwen2.5-coder:14b

echo "[2/2] canavar-ai modeli oluşturuluyor..."
ollama create canavar-ai -f Modelfile.canavar

echo ""
echo "✅ Hazır modeller:"
ollama list | grep -E "canavar|qwen2.5-coder" || ollama list
echo ""
echo "Open WebUI'da model ID: canavar-ai:latest"
echo "Canavar AI.command kurulumunda bu modeli seçin."
