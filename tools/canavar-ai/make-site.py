#!/usr/bin/env python3
"""Tek komutla site yaptır: python3 make-site.py "FindGU IMVU sitesi" """
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from agent import DEFAULT_MODEL, chat_llm, expand_path, load_config, tool_write_file  # noqa: E402
from site_builder import build_site  # noqa: E402


def main() -> None:
    if len(sys.argv) < 2:
        print('Kullanım: python3 make-site.py "FindGU için IMVU analiz sitesi yap"')
        sys.exit(1)
    prompt = " ".join(sys.argv[1:])
    cfg = load_config()
    cfg["model"] = cfg.get("model") or DEFAULT_MODEL
    ws = expand_path(cfg.get("workspace", "~/Desktop"), Path.home())
    ws.mkdir(parents=True, exist_ok=True)
    print(f"Model: {cfg['model']}\nİstek: {prompt}\n")

    msg, path = build_site(
        prompt,
        ws,
        lambda msgs: chat_llm(cfg, msgs),
        lambda p, c: tool_write_file(p, c, ws),
    )
    print(msg)
    if path and sys.platform == "darwin":
        import subprocess
        subprocess.run(["open", str(path)], check=False)
    sys.exit(0 if path else 1)


if __name__ == "__main__":
    main()
