#!/usr/bin/env python3
"""Update only NKL-generated public player code in the persistent data volume.

Channel metadata, settings, playlists, DVR recordings, and any unrelated HTML
are left in place. Re-running the migration is safe.
"""

import os
import json
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


def synchronize_player_configs(data, database_path):
    """Refresh generated playback fields from the persisted channel settings.

    Never evaluate JavaScript or overwrite customized/unknown config formats.
    Presentation settings (poster, overlays, colors, etc.) remain untouched.
    """
    if not database_path.is_file():
        return
    database = json.loads(database_path.read_text(encoding="utf-8"))
    processes = database.get("process", {})
    if isinstance(processes, list):
        processes = {item.get("id"): item for item in processes if isinstance(item, dict)}
    for process_id, wrapped in database.get("metadata", {}).get("process", {}).items():
        prefix = "restreamer-ui:ingest:"
        if not process_id.startswith(prefix):
            continue
        channel = process_id[len(prefix):]
        if not re.fullmatch(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", channel):
            continue
        settings = wrapped.get("restreamer-ui", {})
        control = settings.get("control", {})
        hls = control.get("hls", {})
        enabled = hls.get("dvr", {}).get("enabled") is True
        storage = hls.get("storage", "memfs")
        process = processes.get(process_id, {})
        outputs = process.get("config", process).get("output", [])
        if outputs:
            address = outputs[0].get("address", "")
            if "{diskfs" in address:
                storage = "diskfs"
            elif "{memfs" in address:
                storage = "memfs"
        path = data / "channels" / channel / "config.js"
        if not path.is_file() or path.is_symlink():
            continue
        original = path.read_text(encoding="utf-8")
        match = re.fullmatch(r"\s*var playerConfig\s*=\s*(\{.*\})\s*;?\s*", original, re.S)
        if not match:
            continue
        try:
            config = json.loads(match.group(1))
        except ValueError:
            continue
        before = json.dumps(config, sort_keys=True)
        preview = control.get("preview", {}).get("enable") and not enabled
        config["source"] = ("memfs/" if storage == "memfs" or preview else "") + channel + ("_h264" if preview else "") + ".m3u8"
        config["channelid"] = channel
        config["dvr"] = {
            "enabled": enabled,
            "hours": hls.get("dvr", {}).get("hours", 4) if enabled else 0,
            "segmentDuration": hls.get("segmentDuration", 2) if enabled else 0,
        }
        if before != json.dumps(config, sort_keys=True):
            replace_atomically(path, ("var playerConfig = " + json.dumps(config, ensure_ascii=False) + ";\n").encode("utf-8"))


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
        updated = ASSET_LINK.sub(lambda match: match.group(0).split("=", 1)[0] + '="' + match.group(1) + '?nkl=1.4-beta-dev20"', updated)
        if 'http-equiv="Cache-Control"' not in updated:
            updated = updated.replace("<head>", '<head>\n<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />', 1)
        if updated != page:
            replace_atomically(path, updated.encode("utf-8"))

    source = ui / "_player/videojs/dist/video-js-skin.min.css"
    target = data / "player/videojs/dist/video-js-skin.min.css"
    if target.parent.is_dir():
        replace_atomically(target, source.read_bytes()) if target.exists() else shutil.copyfile(source, target)


if __name__ == "__main__":
    synchronize_player_configs(Path(os.environ.get("CORE_STORAGE_DISK_DIR", "/core/data")), Path(os.environ.get("CORE_DB_DIR", "/core/config")) / "db.json")
    migrate(Path(os.environ.get("CORE_STORAGE_DISK_DIR", "/core/data")), Path(os.environ.get("CORE_ROUTER_UI_PATH", "/core/ui")))
