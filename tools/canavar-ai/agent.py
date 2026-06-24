#!/usr/bin/env python3
"""
🐉 Canavar AI — qwen2.5-coder:14b + Python araçları (Cursor benzeri)
Site yapma, web, kod, dosya, terminal.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from site_builder import build_site  # noqa: E402
from smart_router import plan_auto_actions  # noqa: E402

CONFIG_PATHS = [
    ROOT / "canavar.config.json",
    Path.home() / ".canavar-ai" / "canavar.config.json",
]

DEFAULT_MODEL = "qwen2.5-coder:14b"

SYSTEM_PROMPT_SMART = """Sen Canavar AI'sın (qwen2.5-coder:14b). Türkçe konuş.
Python aracı GERÇEK iş yaptı (web, dosya, site, terminal) — sonuçları kullan.
Kurulum adımı tekrarlama. Kısa, net, iş bitmiş gibi cevap ver.
Site istendiğinde HTML zaten dosyaya kaydedildi — yolu söyle, kodu tekrar yazma."""


def config_path() -> Path:
    for p in CONFIG_PATHS:
        if p.exists():
            return p
    return CONFIG_PATHS[0]


def load_config() -> dict[str, Any]:
    path = config_path()
    if not path.exists():
        print("⚠ Kurulum yok — setup.py başlatılıyor...")
        subprocess.run([sys.executable, str(ROOT / "setup.py")], check=True)
        path = config_path()
    cfg = json.loads(path.read_text(encoding="utf-8"))
    if not cfg.get("model"):
        cfg["model"] = DEFAULT_MODEL
    return cfg


def is_local_ollama(cfg: dict[str, Any]) -> bool:
    base = cfg.get("base_url", "").lower()
    return "127.0.0.1" in base or "localhost" in base


def expand_path(raw: str, workspace: Path) -> Path:
    p = Path(os.path.expanduser(raw.strip()))
    if not p.is_absolute():
        p = workspace / p
    return p.resolve()


def in_workspace(path: Path, workspace: Path) -> bool:
    try:
        path.relative_to(workspace.resolve())
        return True
    except ValueError:
        return False


def strip_html(html: str) -> str:
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = unescape(re.sub(r"\s+", " ", text))
    return text.strip()[:12000]


def http_get(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "CanavarAI/2.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read().decode(errors="replace")


def tool_web_search(query: str) -> str:
    q = __import__("urllib.parse").quote(query)
    try:
        html = http_get(f"https://lite.duckduckgo.com/lite/?q={q}")
    except Exception as e:
        return f"Arama hatası: {e}"
    links = re.findall(r'class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)', html)
    return "\n".join(f"- {t.strip()}: {h}" for h, t in links[:8]) or "Sonuç yok."


def tool_web_fetch(url: str) -> str:
    try:
        body = http_get(url)
    except Exception as e:
        return f"Hata: {e}"
    return strip_html(body) if "<html" in body.lower() else body[:12000]


def tool_read_file(path: Path, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: izin dışı."
    if not path.exists():
        return "Hata: dosya yok."
    if path.stat().st_size > 500_000:
        return "Hata: çok büyük."
    return path.read_text(encoding="utf-8", errors="replace")


def tool_write_file(path: Path, content: str, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: izin dışı."
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"Yazıldı: {path}"


def tool_list_dir(path: Path, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: izin dışı."
    if not path.exists():
        return "Hata: yok."
    items = sorted(path.iterdir(), key=lambda x: x.name.lower())[:80]
    return "\n".join(f"{x.name}/" if x.is_dir() else x.name for x in items) or "(boş)"


def tool_run_cmd(command: str, workspace: Path, allow: bool) -> str:
    if not allow:
        return "Hata: shell kapalı."
    if any(x in command.lower() for x in ("rm -rf", "mkfs", "dd if=")):
        return "Hata: engellendi."
    try:
        p = subprocess.run(command, shell=True, cwd=str(workspace), capture_output=True, text=True, timeout=120)
        return (p.stdout or "") + (p.stderr or "") or f"kod {p.returncode}"
    except Exception as e:
        return str(e)


def run_tool(name: str, args: dict[str, Any], cfg: dict[str, Any], workspace: Path) -> str:
    if name == "web_search":
        return tool_web_search(str(args.get("query", "")))
    if name == "web_fetch":
        return tool_web_fetch(str(args.get("url", "")))
    if name == "read_file":
        return tool_read_file(expand_path(str(args.get("path", ".")), workspace), workspace)
    if name == "write_file":
        return tool_write_file(expand_path(str(args.get("path", "")), workspace), str(args.get("content", "")), workspace)
    if name == "list_dir":
        return tool_list_dir(expand_path(str(args.get("path", ".")), workspace), workspace)
    if name == "run_cmd":
        return tool_run_cmd(str(args.get("command", "")), workspace, cfg.get("allow_shell", True))
    return f"Bilinmeyen: {name}"


def chat_llm(cfg: dict[str, Any], messages: list[dict[str, str]]) -> str:
    api_key = cfg.get("api_key", "")
    model = cfg.get("model") or DEFAULT_MODEL
    base = cfg["base_url"].rstrip("/")

    if is_local_ollama(cfg):
        if "11434" not in base:
            base = "http://127.0.0.1:11434"
        endpoints = [f"{base}/v1/chat/completions"]
    else:
        endpoints = [
            f"{base}/api/chat/completions",
            f"{base}/ollama/v1/chat/completions",
        ]

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = json.dumps({"model": model, "messages": messages, "stream": False, "temperature": 0.35}).encode()
    last_err = ""
    for url in endpoints:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as res:
                data = json.loads(res.read().decode())
            if "choices" in data:
                return (data["choices"][0].get("message", {}).get("content") or "").strip()
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:300]
            if e.code == 401:
                raise RuntimeError("401 — API key gerekli (gulivechat.online → Settings → API Keys)") from e
            last_err = f"HTTP {e.code}: {body}"
        except Exception as e:
            last_err = str(e)
    raise RuntimeError(last_err or "Model yanıt vermedi")


def run_smart_mode(cfg: dict[str, Any], workspace: Path) -> None:
    print("🐉 Canavar AI — qwen2.5-coder:14b + araçlar (benim gibi)\n")
    print("  Örnekler:")
    print("    • FindGU için IMVU analiz sitesi yap")
    print("    • webde ara Python asyncio")
    print("    • !ls -la  |  oku: dosya.py  |  https://...\n")

    history: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT_SMART}]

    def rt(name: str, args: dict[str, Any]) -> str:
        return run_tool(name, args, cfg, workspace)

    def site_fn(text: str) -> tuple[str, Path | None]:
        return build_site(
            text,
            workspace,
            lambda msgs: chat_llm(cfg, msgs),
            lambda p, c: tool_write_file(p, c, workspace),
        )

    while True:
        try:
            user = input("\n🧑 Sen: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGörüşürüz!")
            break
        if not user or user.lower() in {"q", "quit", "exit", "çık", "cik"}:
            if user:
                print("Görüşürüz!")
            break

        logs, ctx, site_path = plan_auto_actions(user, workspace, rt, site_fn)
        for line in logs:
            print(f"  {line}")
        if site_path and sys.platform == "darwin":
            subprocess.run(["open", str(site_path)], check=False)

        if ctx and site_path:
            print(f"\n🐉 Canavar: Site hazır → {site_path}")
            history.append({"role": "assistant", "content": f"Site: {site_path}"})
            continue

        msg = f"{ctx}\n\nKullanıcı: {user}" if ctx else user
        history.append({"role": "user", "content": msg})
        try:
            print("\n🐉 Canavar: ", end="", flush=True)
            reply = chat_llm(cfg, [history[0], *history[-4:]])
            print(reply or "(boş)")
        except RuntimeError as e:
            print(f"\n❌ {e}")
            history.pop()
            continue
        history.append({"role": "assistant", "content": reply})


def main() -> None:
    cfg = load_config()
    workspace = expand_path(cfg.get("workspace", "~/Desktop"), Path.home())
    workspace.mkdir(parents=True, exist_ok=True)

    print(textwrap.dedent(f"""
    ╔══════════════════════════════════════════╗
    ║  🐉 Canavar AI · {cfg.get("model", DEFAULT_MODEL)[:22]:<22} ║
    ║  {cfg.get("base_url", "?")[:40]:<40} ║
    ╚══════════════════════════════════════════╝
    """))

    if not cfg.get("api_key") and not is_local_ollama(cfg):
        print("❌ API key yok → python3 setup.py\n")
        sys.exit(1)

    if not is_local_ollama(cfg):
        r = subprocess.run([sys.executable, str(ROOT / "test-connection.py")], cwd=str(ROOT))
        if r.returncode != 0:
            sys.exit(1)

    mode = (cfg.get("mode") or "smart").lower()
    if mode == "chat":
        cfg["mode"] = "smart"
    run_smart_mode(cfg, workspace)


if __name__ == "__main__":
    main()
