"""Velbus config panel frontend package."""

from __future__ import annotations

import importlib.resources
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

webcomponent_name = "velbus-panel"
entrypoint_js = "velbus-panel.js"

try:
    from .constants import IS_PROD_BUILD as is_prod_build
except ImportError:
    is_prod_build = False

try:
    __version__ = version("velbus-frontend")
except PackageNotFoundError:
    __version__ = "dev"


def locate_dir() -> str:
    """Return the directory containing built frontend assets."""
    return str(importlib.resources.files("velbus_frontend") / "dist")


def get_build_id() -> str:
    """Return a cache-busting id for the frontend assets."""
    if is_prod_build:
        return __version__
    dist = Path(locate_dir())
    newest = max(
        (path.stat().st_mtime_ns for path in dist.rglob("*.js")),
        default=0,
    )
    return f"{__version__}-{newest}"
