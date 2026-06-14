"""imvd admin — sonsuz ücretsiz erişim."""

from __future__ import annotations

import os
import secrets


def get_admin_key() -> str:
    return (os.environ.get('IMVD_ADMIN_KEY') or 'imvd-admin').strip()


def is_admin(provided: str | None) -> bool:
    if not provided:
        return False
    expected = get_admin_key()
    if not expected:
        return False
    return secrets.compare_digest(provided.strip(), expected)


def admin_unlimited() -> bool:
    """Admin modu her zaman sınırsız."""
    return True
