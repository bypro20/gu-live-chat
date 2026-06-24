#!/usr/bin/env python3
"""
🐉 Canavar AI — masaüstü ajan
Web gezme, kod/dosya işlemleri, terminal. Open WebUI / Ollama backend.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "canavar.config.json"

SYSTEM_PROMPT = """Sen Canavar AI'sın — akıllı masaüstü asistanısın.
Görevleri adım adım yap: web'de ara, sayfa oku, dosya yaz, kod çalıştır.

Araç kullanırken YALNIZCA tek satır JSON yaz (başka metin ekleme):
{{"tool":"web_search","args":{{"query":"..."}}}}
{{"tool":"web_fetch","args":{{"url":"https://..."}}}}
{{"tool":"read_file","args":{{"path":"..."}}}}
{{"tool":"write_file","args":{{"path":"...","content":"..."}}}}
{{"tool":"list_dir","args":{{"path":"..."}}}}
{{"tool":"run_cmd","args":{{"command":"..."}}}}

İş bitince:
{{"answer":"kullanıcıya Türkçe cevap"}}

Kurallar:
- Çalışma alanı: {workspace}
- Yollar bu klasör içinde olmalı (güvenlik)
- Tehlikeli komutlardan kaçın (rm -rf, format, vb.)
- Önce planla, sonra araç kullan, en son answer ver
"""


def load_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        print("⚠ Ayar dosyası yok. Kurulum başlatılıyor...")
        subprocess.run([sys.executable, str(ROOT / "setup.py")], check=True)
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


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


def http_get(url: str, headers: dict[str, str] | None = None, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "CanavarAI/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read().decode(errors="replace")


def tool_web_search(query: str) -> str:
    q = urllib.parse.quote(query)
    url = f"https://lite.duckduckgo.com/lite/?q={q}"
    try:
        html = http_get(url)
    except Exception as e:
        return f"Arama hatası: {e}"
    links = re.findall(r'class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)', html)
    if not links:
        return "Sonuç bulunamadı."
    lines = []
    for href, title in links[:8]:
        lines.append(f"- {title.strip()}: {href}")
    return "\n".join(lines)


def tool_web_fetch(url: str) -> str:
    try:
        body = http_get(url)
    except Exception as e:
        return f"Sayfa hatası: {e}"
    if "<html" in body.lower():
        return strip_html(body)
    return body[:12000]


def tool_read_file(path: Path, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: dosya çalışma alanı dışında."
    if not path.exists():
        return "Hata: dosya yok."
    if path.stat().st_size > 500_000:
        return "Hata: dosya çok büyük (max 500KB)."
    return path.read_text(encoding="utf-8", errors="replace")


def tool_write_file(path: Path, content: str, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: dosya çalışma alanı dışında."
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"Yazıldı: {path} ({len(content)} karakter)"


def tool_list_dir(path: Path, workspace: Path) -> str:
    if not in_workspace(path, workspace):
        return "Hata: klasör çalışma alanı dışında."
    if not path.exists():
        return "Hata: klasör yok."
    items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))[:80]
    lines = []
    for item in items:
        mark = "/" if item.is_dir() else ""
        lines.append(f"{item.name}{mark}")
    return "\n".join(lines) or "(boş)"


def tool_run_cmd(command: str, workspace: Path, allow: bool) -> str:
    if not allow:
        return "Hata: terminal kapalı (canavar.config.json → allow_shell: true)"
    blocked = ("rm -rf", "mkfs", ":(){", "dd if=", "format ", "> /dev/")
    low = command.lower()
    if any(b in low for b in blocked):
        return "Hata: güvenlik — komut engellendi."
    try:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=str(workspace),
            capture_output=True,
            text=True,
            timeout=120,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        out = out.strip()[:8000]
        return out or f"(çıktı yok, kod {proc.returncode})"
    except subprocess.TimeoutExpired:
        return "Hata: komut zaman aşımı (120s)"
    except Exception as e:
        return f"Komut hatası: {e}"


def run_tool(name: str, args: dict[str, Any], cfg: dict[str, Any], workspace: Path) -> str:
    if name == "web_search":
        if not cfg.get("allow_web", True):
            return "Hata: web arama kapalı."
        return tool_web_search(str(args.get("query", "")))
    if name == "web_fetch":
        if not cfg.get("allow_web", True):
            return "Hata: web kapalı."
        return tool_web_fetch(str(args.get("url", "")))
    if name == "read_file":
        return tool_read_file(expand_path(str(args.get("path", ".")), workspace), workspace)
    if name == "write_file":
        return tool_write_file(
            expand_path(str(args.get("path", "")), workspace),
            str(args.get("content", "")),
            workspace,
        )
    if name == "list_dir":
        return tool_list_dir(expand_path(str(args.get("path", ".")), workspace), workspace)
    if name == "run_cmd":
        return tool_run_cmd(str(args.get("command", "")), workspace, cfg.get("allow_shell", True))
    return f"Bilinmeyen araç: {name}"


def parse_action(text: str) -> dict[str, Any] | None:
    text = text.strip()
    for candidate in re.findall(r"\{[^{}]*\}", text, flags=re.DOTALL):
        try:
            obj = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and ("tool" in obj or "answer" in obj):
            return obj
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    return None


def chat_llm(cfg: dict[str, Any], messages: list[dict[str, str]]) -> str:
    base = cfg["base_url"].rstrip("/")
    api_key = cfg.get("api_key", "")
    model = cfg.get("model") or "llama3.2"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = json.dumps(
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "temperature": 0.4,
        }
    ).encode()

    endpoints = [
        f"{base}/api/chat/completions",
        f"{base}/ollama/v1/chat/completions",
        f"{base}/v1/chat/completions",
        f"{base}/api/chat",
    ]

    last_err = ""
    for url in endpoints:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as res:
                data = json.loads(res.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:300]
            last_err = f"{url} → HTTP {e.code}: {body}"
            continue
        except Exception as e:
            last_err = f"{url} → {e}"
            continue

        if "choices" in data:
            msg = data["choices"][0].get("message", {})
            return (msg.get("content") or "").strip()
        if "message" in data and isinstance(data["message"], dict):
            return (data["message"].get("content") or "").strip()
        if "response" in data:
            return str(data["response"]).strip()

    raise RuntimeError(last_err or "LLM yanıt vermedi — base_url ve api_key kontrol edin.")


def main() -> None:
    cfg = load_config()
    workspace = expand_path(cfg.get("workspace", "~/Desktop"), Path.home())
    workspace.mkdir(parents=True, exist_ok=True)

    model = cfg.get("model") or "(model seçilmedi)"
    print(textwrap.dedent(f"""
    ╔══════════════════════════════════════╗
    ║  🐉 Canavar AI                       ║
    ║  Model: {model[:28]:<28} ║
    ║  Klasör: {str(workspace)[:27]:<27} ║
    ║  Çıkış: quit / exit                  ║
    ╚══════════════════════════════════════╝
    """))

    system = SYSTEM_PROMPT.format(workspace=workspace)
    history: list[dict[str, str]] = [{"role": "system", "content": system}]
    max_rounds = int(cfg.get("max_tool_rounds", 12))

    while True:
        try:
            user = input("\n🧑 Sen: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGörüşürüz!")
            break
        if not user:
            continue
        if user.lower() in {"quit", "exit", "q", "çık", "cik"}:
            print("Görüşürüz!")
            break

        history.append({"role": "user", "content": user})
        rounds = 0

        while rounds < max_rounds:
            rounds += 1
            try:
                reply = chat_llm(cfg, history)
            except RuntimeError as e:
                print(f"\n❌ {e}")
                print("   Ayarları güncelle: python3 setup.py")
                break

            action = parse_action(reply)
            if action and "answer" in action:
                answer = str(action["answer"]).strip()
                print(f"\n🐉 Canavar: {answer}")
                history.append({"role": "assistant", "content": answer})
                break

            if action and "tool" in action:
                tool = str(action["tool"])
                args = action.get("args") or {}
                print(f"\n⚙️  Araç: {tool} {args}")
                result = run_tool(tool, args, cfg, workspace)
                preview = result if len(result) < 600 else result[:600] + "…"
                print(f"   → {preview}")
                history.append({"role": "assistant", "content": reply})
                history.append(
                    {
                        "role": "user",
                        "content": f"Araç sonucu ({tool}):\n{result}\n\nDevam et veya answer ile bitir.",
                    }
                )
                continue

            print(f"\n🐉 Canavar: {reply}")
            history.append({"role": "assistant", "content": reply})
            break


if __name__ == "__main__":
    main()
