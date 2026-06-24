#!/usr/bin/env python3
"""gulivechat.online bağlantı testi — neden cevap vermiyor?"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG_CANDIDATES = [
    ROOT / "canavar.config.json",
    Path.home() / ".canavar-ai" / "canavar.config.json",
]


def load_cfg() -> dict:
    for path in CONFIG_CANDIDATES:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    return {
        "base_url": "https://gulivechat.online",
        "api_key": "",
        "model": "",
    }


def get(url: str, api_key: str = "") -> tuple[int, str]:
    headers = {"User-Agent": "CanavarAI-Test/1.0"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, res.read().decode(errors="replace")[:800]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")[:800]


def post_chat(base: str, api_key: str, model: str) -> tuple[int, str]:
    url = f"{base.rstrip('/')}/api/chat/completions"
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": "Merhaba! Tek cümleyle cevap ver."}],
            "stream": False,
        }
    ).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "CanavarAI-Test/1.0"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return res.status, res.read().decode(errors="replace")[:1200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")[:1200]


def main() -> None:
    cfg = load_cfg()
    base = cfg.get("base_url", "https://gulivechat.online").rstrip("/")
    api_key = (cfg.get("api_key") or "").strip()
    model = (cfg.get("model") or "").strip()

    print("\n🐉 Canavar AI — Bağlantı Testi")
    print(f"   Sunucu: {base}\n")

    code, body = get(f"{base}/api/config")
    print(f"[1] Sunucu ayakta: {'✓' if code == 200 else '✗'} (HTTP {code})")
    if code == 200:
        try:
            name = json.loads(body).get("name", "?")
            ver = json.loads(body).get("version", "?")
            print(f"    → {name} v{ver}")
        except json.JSONDecodeError:
            pass

    if not api_key:
        print("\n[2] API anahtarı: ✗ BOŞ")
        print("    → gulivechat.online → giriş yap → Settings → Account → API Keys")
        print("    → Anahtarı tools/canavar-ai/canavar.config.json içine yazın")
        print("    → veya: python3 setup.py")
        code2, _ = get(f"{base}/ollama/api/tags")
        print(f"\n[3] Model listesi (anahtarsız): HTTP {code2} (401 beklenir — normal)")
        print("\n❌ Sonuç: API anahtarı olmadan sohbet ÇALIŞMAZ.\n")
        sys.exit(1)

    print(f"\n[2] API anahtarı: ✓ ({api_key[:8]}...)")

    code3, body3 = get(f"{base}/ollama/api/tags", api_key)
    print(f"[3] Model listesi: HTTP {code3}")
    models: list[str] = []
    if code3 == 200:
        try:
            data = json.loads(body3)
            models = [m.get("name", "") for m in data.get("models", []) if m.get("name")]
            for m in models[:10]:
                print(f"    · {m}")
            if len(models) > 10:
                print(f"    ... +{len(models) - 10} model")
        except json.JSONDecodeError:
            print(f"    {body3[:200]}")
    elif code3 == 401:
        print("    ✗ Anahtar geçersiz veya süresi dolmuş — yeni API key oluşturun")
        sys.exit(1)
    else:
        print(f"    {body3[:200]}")

    if not model and models:
        model = models[0]
        print(f"\n    (Test modeli: {model})")
    if not model:
        print("\n❌ Model seçilmemiş ve liste alınamadı.")
        sys.exit(1)

    print(f"\n[4] Sohbet testi (model: {model})...")
    code4, body4 = post_chat(base, api_key, model)
    if code4 == 200:
        try:
            data = json.loads(body4)
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"    ✓ CEVAP: {text[:300]}")
            print("\n✅ Bağlantı tamam — Canavar AI çalışmalı.\n")
        except json.JSONDecodeError:
            print(f"    ✓ HTTP 200 ama JSON beklenmedik: {body4[:200]}")
    elif code4 == 401:
        print("    ✗ 401 — API anahtarı reddedildi")
    elif code4 == 404:
        print(f"    ✗ 404 — Model bulunamadı: {model}")
        print("    → canavar.config.json içindeki model adını listeden seçin")
    else:
        print(f"    ✗ HTTP {code4}: {body4[:400]}")
        if "connection" in body4.lower() or code4 >= 502:
            print("\n    Sunucuda Ollama çalışmıyor olabilir.")
            print("    → Sunucuda: ollama serve / docker ps / open-webui logları kontrol edin")
        print("\n❌ Sohbet testi başarısız.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
