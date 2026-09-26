#!/usr/bin/env python3
"""Update only NKL-generated public player code in the persistent data volume.

Channel metadata, settings, playlists, DVR recordings, and any unrelated HTML
are left in place. Re-running the migration is safe.
"""

import os
from pathlib import Path
import re
import shutil
import tempfile


PLAYER_SCRIPT = re.compile(r"<script>\s*function getQueryParam\(key, defaultValue\) \{.*?</script>", re.S)
ASSET_LINK = re.compile(r'(?:src|href)="((?:player/[^"?]+\.(?:js|css)|channels/[^"?]+/config\.js))(?:\?[^" ]*)?"')


def replace_atomically(path, content):
    descriptor, temporary = tempfile.mkstemp(prefix=".nkl-player-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(content)
        os.chmod(temporary, path.stat().st_mode)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def migrate(data, ui):
    template = (ui / "_player/videojs/player.html").read_text(encoding="utf-8")
    template_script = PLAYER_SCRIPT.search(template)
    if not template_script:
        raise ValueError("NKL player template is missing its script")

    for path in data.glob("*.html"):
        # Only overwrite the known generated inline player, never a custom page.
        page = path.read_text(encoding="utf-8")
        script = PLAYER_SCRIPT.search(page)
        if not script or "var player = videojs('player', config)" not in script.group():
            continue
        updated = page[:script.start()] + template_script.group() + page[script.end():]
        updated = ASSET_LINK.sub(lambda match: match.group(0).split("=", 1)[0] + '="' + match.group(1) + '?nkl=1.4-beta-dev19"', updated)
        if 'http-equiv="Cache-Control"' not in updated:
            updated = updated.replace("<head>", '<head>\n<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />', 1)
        if updated != page:
            replace_atomically(path, updated.encode("utf-8"))

    source = ui / "_player/videojs/dist/video-js-skin.min.css"
    target = data / "player/videojs/dist/video-js-skin.min.css"
    if target.parent.is_dir():
        replace_atomically(target, source.read_bytes()) if target.exists() else shutil.copyfile(source, target)


if __name__ == "__main__":
    migrate(Path(os.environ.get("CORE_STORAGE_DISK_DIR", "/core/data")), Path(os.environ.get("CORE_ROUTER_UI_PATH", "/core/ui")))
