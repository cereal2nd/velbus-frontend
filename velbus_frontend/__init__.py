"""Velbus config panel frontend package."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Final

from .constants import IS_PROD_BUILD

_DIST_DIR = Path(__file__).resolve().parent / "dist"

webcomponent_name: Final = "velbus-panel"
entrypoint_js: Final = "velbus-panel.js"
is_prod_build: Final = IS_PROD_BUILD


def locate_dir() -> str:
    """Return the location of the frontend static files."""
    return str(_DIST_DIR)


def get_build_id() -> str:
    """Return the build id used for cache busting."""
    if not IS_PROD_BUILD:
        return "dev"

    entrypoint = _DIST_DIR / entrypoint_js
    if not entrypoint.is_file():
        return "dev"

    digest = hashlib.sha256(entrypoint.read_bytes()).hexdigest()
    return digest[:16]
