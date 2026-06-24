"""Modele site yaptır — HTML üret, dosyaya kaydet, önizle."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable


SITE_INTENT = re.compile(
    r"\b("
    r"site\s*yap|web\s*sitesi|landing\s*page|html\s*(sayfa|yap|oluştur)|"
    r"sayfa\s*yap|site\s*oluştur|site\s*tasarla|web\s*yap|"
    r"findgu|imvu\s*.*site"
    r")\b",
    re.I,
)


def extract_site_slug(text: str) -> str:
    m = re.search(r"\b(findgu|imvu|[a-z][a-z0-9-]{2,20})\b", text, re.I)
    if m:
        name = m.group(1).lower()
        if name not in {"site", "html", "web", "yap", "için", "bana", "model"}:
            return re.sub(r"[^a-z0-9-]", "", name) or "site"
    m = re.search(r"([A-Z][a-zA-Z0-9]{2,15})", text)
    if m:
        return m.group(1).lower()
    return "site"


def extract_html_from_model(text: str) -> str | None:
    text = text.strip()
    fence = re.search(r"```(?:html)?\s*\n(.*?)```", text, re.DOTALL | re.I)
    if fence:
        return fence.group(1).strip()
    if "<!DOCTYPE" in text.upper() or "<html" in text.lower():
        start = re.search(r"<!DOCTYPE|<html", text, re.I)
        if start:
            chunk = text[start.start() :]
            end = chunk.lower().rfind("</html>")
            if end != -1:
                return chunk[: end + 7]
            return chunk
    return None


SITE_SYSTEM = """Sen profesyonel web geliştiricisisin. TEK tam HTML5 sayfası yaz.

ZORUNLU:
- Çıktı SADECE HTML (```html veya <!DOCTYPE)
- Türkçe içerik, mobil uyumlu
- Hero: CSS gradient arka plan (example.com URL YASAK)
- Hero metni okunaklı: koyu gradient üzerinde beyaz yazı VEYA açık zemin + koyu yazı — asla beyaz-on-beyaz
- Bootstrap 4: popper.js@1.16.1 (popperjs/core 2.x YASAK)
- Navbar + hero + en az 1 bölüm + footer
- Her tasarım FARKLI renk (mor, lacivert, teal vb.) — aynı generic şablonu kopyaplama

YASAK: example.com, kurulum talimatı, "ben bir AI'yım", boş placeholder
"""


def wants_site_build(user: str) -> bool:
    return bool(SITE_INTENT.search(user))


def build_site(
    user: str,
    workspace: Path,
    chat_fn: Callable[[list[dict[str, str]]], str],
    write_fn: Callable[[Path, str], str],
) -> tuple[str, Path | None]:
    """
    Modelden HTML al, kaydet.
    Dönüş: (kullanıcıya mesaj, dosya yolu)
    """
    slug = extract_site_slug(user)
    out_dir = workspace / "sites" / slug
    out_file = out_dir / "index.html"

    messages = [
        {"role": "system", "content": SITE_SYSTEM},
        {
            "role": "user",
            "content": (
                f"Site isteği:\n{user}\n\n"
                f"Dosya adı: sites/{slug}/index.html\n"
                "Tam çalışan tek sayfa HTML üret."
            ),
        },
    ]

    raw = chat_fn(messages)
    html = extract_html_from_model(raw)
    if not html:
        return (
            "Model HTML üretemedi — ham cevap kod içermiyor. "
            "Daha net yazın: «FindGU için IMVU analiz landing page yap»",
            None,
        )

    # Popper BS4 uyumu — yaygın model hatası
    html = html.replace(
        "@popperjs/core@2.5.4",
        "popper.js@1.16.1/dist/umd/popper.min.js",
    )
    html = html.replace("cdn.jsdelivr.net/npm/@popperjs/core", "cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd")

    write_fn(out_file, html)
    return (
        f"Site kaydedildi: {out_file}\n"
        f"Önizleme (Mac): open '{out_file}'\n"
        f"veya: python3 -m http.server 8765 --directory '{out_dir}'",
        out_file,
    )
