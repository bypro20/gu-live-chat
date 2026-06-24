"""Kullanıcı mesajından niyet çıkar, araçları Python çalıştırır — model JSON bilmesin."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable

from site_builder import wants_site_build


def _extract_search_query(text: str) -> str:
    text = re.sub(
        r"^(web.?de |internet.?te |google.?da )?(ara|arat|bul|search)[:\s]+",
        "",
        text.strip(),
        flags=re.I,
    )
    text = re.sub(r"^(web.?de|internet.?te)\s+", "", text, flags=re.I)
    return text.strip() or text


def plan_auto_actions(
    user: str,
    workspace: Path,
    run_tool: Callable[[str, dict[str, Any]], str],
    build_site_fn: Callable[[str], tuple[str, Path | None]] | None = None,
) -> tuple[list[str], str | None, Path | None]:
    """
    Mesaja göre otomatik araç çalıştır.
    Dönüş: (yapılan işlemler logu, LLM'e eklenecek bağlam)
    """
    logs: list[str] = []
    blocks: list[str] = []
    saved_site: Path | None = None

    # Site yap — model HTML üretir, dosyaya yazılır
    if wants_site_build(user) and build_site_fn:
        msg, path = build_site_fn(user)
        logs.append("🌐 Site oluşturuldu")
        if path:
            saved_site = path
            blocks.append(f"### Site\n{msg}")
        else:
            blocks.append(f"### Site hatası\n{msg}")
        ctx = (
            "Site dosyası oluşturuldu. Kullanıcıya kısa Türkce özet ver — "
            "dosya yolu, nasıl açacağını söyle. HTML'i tekrar yapıştırma.\n\n"
            + "\n\n".join(blocks)
        )
        return logs, ctx, saved_site

    # URL varsa sayfayı oku
    for url in re.findall(r"https?://[^\s\)\]\"\'<>]+", user)[:2]:
        out = run_tool("web_fetch", {"url": url.rstrip(".,;")})
        logs.append(f"🌐 Sayfa okundu: {url[:60]}")
        blocks.append(f"### Web: {url}\n{out[:4000]}")

    # Web arama
    if re.search(r"\b(ara|arat|bul|search|google|web.?de|internette)\b", user, re.I) and not blocks:
        q = _extract_search_query(user)
        if len(q) > 3:
            out = run_tool("web_search", {"query": q})
            logs.append(f"🔍 Arama: {q[:50]}")
            blocks.append(f"### Arama: {q}\n{out}")

    # Klasör listele
    if re.search(r"\b(listele|klasör|dosyalar|desktop|masaüstü|içeriği)\b", user, re.I):
        sub = "."
        if re.search(r"masaüst|desktop", user, re.I):
            sub = str(Path.home() / "Desktop")
        out = run_tool("list_dir", {"path": sub})
        logs.append("📁 Klasör listelendi")
        blocks.append(f"### Klasör ({sub})\n{out}")

    # Terminal: !komut veya "çalıştır: ..."
    cmd_match = re.match(r"^!\s*(.+)$", user.strip())
    if not cmd_match:
        cmd_match = re.search(r"(?:çalıştır|run|terminal)[:\s]+(.+)$", user, re.I)
    if cmd_match:
        cmd = cmd_match.group(1).strip()
        out = run_tool("run_cmd", {"command": cmd})
        logs.append(f"⌨️  Komut: {cmd[:40]}")
        blocks.append(f"### Terminal\n```\n{out}\n```")

    # Dosya oku: "oku: path" veya "dosyayı oku ..."
    read_match = re.search(r"(?:oku|read|aç)[:\s]+([^\s]+(?:\.\w+)?)", user, re.I)
    if read_match:
        path = read_match.group(1).strip("'\"")
        out = run_tool("read_file", {"path": path})
        logs.append(f"📄 Okundu: {path}")
        blocks.append(f"### Dosya: {path}\n{out[:6000]}")

    # Kod/dosya içinde ara
    if re.search(r"\b(kodda ara|projede ara|grep|search_files)\b", user, re.I):
        pat = re.search(r"['\"]([^'\"]+)['\"]", user)
        pattern = pat.group(1) if pat else r"function|def |class "
        out = run_tool("search_files", {"pattern": pattern, "glob": "**/*.{py,js,ts,tsx,html,css,json}"})
        logs.append(f"🔎 Kod araması: {pattern}")
        blocks.append(f"### Kod araması ({pattern})\n{out}")

    if not blocks:
        return logs, None, None

    ctx = (
        "Sistem otomatik olarak şunları yaptı (GERÇEK sonuçlar — uydurma):\n\n"
        + "\n\n".join(blocks)
        + "\n\nBu sonuçlara dayanarak kullanıcıya Türkçe, net cevap ver. "
        "Aynı kurulum adımlarını tekrarlama; somut sonuçları özetle."
    )
    return logs, ctx, saved_site
