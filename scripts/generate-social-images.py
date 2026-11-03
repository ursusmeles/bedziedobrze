"""Render the approved OG image. Requires Python Playwright and Chromium.

Run from the repository root: python scripts/generate-social-images.py
Set CHROMIUM_PATH when Chromium is not installed on PATH.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
from threading import Thread

from playwright.sync_api import sync_playwright


root = Path(__file__).resolve().parent.parent


class AssetHandler(SimpleHTTPRequestHandler):
    """Serve source templates and the same public asset URLs used by the website."""

    def translate_path(self, path):
        resolved = Path(super().translate_path(path))
        public_asset = root / "public" / resolved.relative_to(root)
        return str(public_asset if not resolved.exists() and public_asset.is_file() else resolved)


chromium = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium")
with ThreadingHTTPServer(("127.0.0.1", 0), partial(AssetHandler, directory=str(root))) as server, sync_playwright() as playwright:
    Thread(target=server.serve_forever, daemon=True).start()
    options = {"executable_path": chromium} if chromium else {}
    browser = playwright.chromium.launch(**options)
    page = browser.new_page(viewport={"width": 1200, "height": 1800}, device_scale_factor=1)
    page.goto(f"http://127.0.0.1:{server.server_port}/scripts/og-image.html")
    page.evaluate("document.fonts.ready")
    page.wait_for_function("Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)")
    page.locator("#landscape").screenshot(
        path=str(root / "public/og-image.jpg"), type="jpeg", quality=94,
    )
    print("Created public/og-image.jpg")
    browser.close()
    server.shutdown()
