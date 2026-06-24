#!/usr/bin/env python3
"""Canavar AI — ilk kurulum sihirbazı."""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXAMPLE_PATH = ROOT / "canavar.config.example.json"
LOCAL_CONFIG = ROOT / "canavar.config.json"
HOME_CONFIG = Path.home() / ".canavar-ai" / "canavar.config.json"


def prompt(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    val = input(f"{label}{suffix}: ").strip()
    return val or default


def fetch_models(base_url: str, api_key: str) -> list[str]:
    root = base_url.rstrip("/").removesuffix("/v1")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    for path in ("/ollama/api/tags", "/api/tags", "/ollama/v1/models", "/v1/models"):
        req = urllib.request.Request(f"{root}{path}", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode())
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
            continue
        if "models" in data:
            names = [m.get("name", "") for m in data["models"] if m.get("name")]
            if names:
                return names
        if "data" in data:
            ids = [m.get("id", "") for m in data["data"] if m.get("id")]
            if ids:
                return ids
    return []


def save_config(cfg: dict) -> None:
    text = json.dumps(cfg, ensure_ascii=False, indent=2) + "\n"
    LOCAL_CONFIG.write_text(text, encoding="utf-8")
    HOME_CONFIG.parent.mkdir(parents=True, exist_ok=True)
    HOME_CONFIG.write_text(text, encoding="utf-8")
    print(f"\n✓ Ayarlar kaydedildi:")
    print(f"    {HOME_CONFIG}")
    print(f"    {LOCAL_CONFIG}")


def main() -> None:
    print("\n🐉 Canavar AI — Kurulum\n")
    example = {}
    if EXAMPLE_PATH.exists():
        example = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))

    base_url = prompt(
        "Sunucu adresi (Canavar / Open WebUI)",
        example.get("base_url", "https://gulivechat.online"),
    )
    api_key = prompt("API anahtarı (Open WebUI → Settings → Account → API Keys)", example.get("api_key", ""))
    workspace = prompt("Çalışma klasörü", example.get("workspace", str(Path.home() / "Desktop")))

    models: list[str] = []
    if api_key:
        print("\nModeller alınıyor...")
        models = fetch_models(base_url, api_key)
        if models:
            print(f"  ✓ {len(models)} model bulundu:")
            for i, m in enumerate(models[:15], 1):
                print(f"    {i}. {m}")
            if len(models) > 15:
                print(f"    ... ve {len(models) - 15} tane daha")
        else:
            print("  ⚠ Model listesi alınamadı — API anahtarını kontrol edin.")

    default_model = models[0] if models else example.get("model", "")
    model = prompt("Kullanılacak model (Ollama tam adı, örn. qwen2.5:14b)", default_model)

    cfg = {
        "name": "Canavar AI",
        "backend": "openwebui",
        "base_url": base_url.rstrip("/"),
        "api_key": api_key,
        "model": model,
        "workspace": workspace,
        "mode": "chat",
        "allow_web": True,
        "allow_shell": True,
        "max_tool_rounds": 12,
        "language": "tr",
    }

    save_config(cfg)

    if api_key and model:
        print("\nBağlantı test ediliyor...")
        test = subprocess.run([sys.executable, str(ROOT / "test-connection.py")], cwd=str(ROOT))
        if test.returncode != 0:
            print("\n⚠ Test başarısız — test-connection.py çıktısına bakın.")
        sys.exit(test.returncode)

    print("  Çift tık: «Canavar AI.command» veya: python3 agent.py\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nİptal.")
        sys.exit(1)
