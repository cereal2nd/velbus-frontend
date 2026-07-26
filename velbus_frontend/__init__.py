"""Velbus config panel frontend package."""

from __future__ import annotations

import importlib.resources
from importlib.metadata import PackageNotFoundError, version

webcomponent_name = "velbus-panel"
entrypoint_js = "velbus-panel.js"
is_prod_build = False

try:
    __version__ = version("velbus-frontend")
except PackageNotFoundError:
    __version__ = "dev"


def locate_dir() -> str:
    """Return the directory containing built frontend assets."""
    return str(importlib.resources.files("velbus_frontend") / "dist")
