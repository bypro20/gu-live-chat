#!/bin/bash
# 🐉 Canavar AI — Mac sistem özellikleri + hangi model uygun?
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  🐉 Canavar AI — Sistem Kontrolü (Mac)           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Chip / model
if [[ "$(uname -m)" == "arm64" ]]; then
  CHIP="Apple Silicon ($(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo 'M serisi'))"
else
  CHIP="Intel Mac"
fi

MEM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
MEM_GB=$((MEM_BYTES / 1024 / 1024 / 1024))
CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo "?")
OS=$(sw_vers -productVersion 2>/dev/null || echo "?")

echo "  İşlemci : $CHIP"
echo "  Çekirdek: $CORES"
echo "  RAM     : ${MEM_GB} GB"
echo "  macOS   : $OS"
echo ""

# Ollama
if command -v ollama &>/dev/null; then
  echo "  Ollama  : ✓ kurulu"
  echo "  Modeller:"
  ollama list 2>/dev/null | head -15 || echo "    (liste alınamadı — ollama serve çalışıyor mu?)"
else
  echo "  Ollama  : ✗ yüklü değil (brew install ollama)"
fi

echo ""
echo "─── Model önerisi (bu Mac için) ───"

if [[ "$MEM_GB" -le 8 ]]; then
  echo "  ⚠ 8 GB RAM → qwen2.5-coder:7b veya 3b (14B ağır kalır)"
elif [[ "$MEM_GB" -le 16 ]]; then
  echo "  ✓ 16 GB → qwen2.5-coder:7b rahat; 14b denenebilir (yavaş olabilir)"
elif [[ "$MEM_GB" -le 24 ]]; then
  echo "  ✓ 24 GB → qwen2.5-coder:14b uygun"
else
  echo "  ✓ ${MEM_GB} GB → qwen2.5-coder:14b ve hatta 32b denenebilir"
fi

if [[ "$(uname -m)" == "arm64" ]]; then
  echo "  Apple Silicon: Ollama Metal hızlandırma kullanır — iyi seçim."
fi

echo ""
echo "Open WebUI'da model ID boş kalmasın — ollama list'teki TAM adı seçin."
echo ""
read -r -p "Enter ile kapat…" _ 2>/dev/null || true
