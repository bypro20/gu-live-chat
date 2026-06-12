#!/bin/sh
set -e

PORT="${PORT:-11434}"
export OLLAMA_HOST="0.0.0.0:${PORT}"

echo "Starting Ollama on ${OLLAMA_HOST}..."
ollama serve &
OLLAMA_PID=$!

echo "Waiting for Ollama..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/api/tags" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Pulling chat models (llama3.2, gemma2)..."
ollama pull llama3.2 || true
ollama pull gemma2 || true

echo "Ollama ready."
wait $OLLAMA_PID
