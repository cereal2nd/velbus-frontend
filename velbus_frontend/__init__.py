"""Velbus config panel frontend package."""

from __future__ import annotations

import importlib.resources

webcomponent_name = "velbus-panel"
entrypoint_js = "velbus-panel.js"
is_prod_build = True


def locate_dir() -> str:
    """Return the directory containing built frontend assets."""
    return str(importlib.resources.files("velbus_frontend") / "dist")
