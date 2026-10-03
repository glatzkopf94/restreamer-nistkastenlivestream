#!/usr/bin/env python3
"""Restrict legacy ingest cleanup rules before Core loads the database."""
import copy
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import time

SUFFIXES = (".m3u8", ".mp4", "_*.m3u8", "_*.ts", "_*.mp4", "/**.ts", "/**.mp4")
INGEST = re.compile(r"restreamer-ui:ingest:([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})")


def migrate_data(database):
    processes = database.get("process", {})
    entries = processes.items() if isinstance(processes, dict) else ((p.get("id", ""), p) for p in processes if isinstance(p, dict))
    count = 0
    for process_id, process in entries:
        match = INGEST.fullmatch(process_id)
        if not match or not isinstance(process, dict):
            continue
        config = process.get("config", process)
        for output in config.get("output", []):
            rules = output.get("cleanup", [])
            replacement = []
            for rule in rules:
                pattern = rule.get("pattern", "")
                prefix, separator, path = pattern.partition(":")
                if prefix in ("diskfs", "disk", "memfs", "mem") and separator and path == "/" + match[1] + "**":
                    for suffix in SUFFIXES:
                        restricted = copy.deepcopy(rule)
                        restricted["pattern"] = prefix + ":/" + match[1] + suffix
                        replacement.append(restricted)
                    count += 1
                else:
                    replacement.append(rule)
            if replacement != rules:
                output["cleanup"] = replacement
    return count


def migrate_file(path):
    if not path.is_file():
        return 0
    database = json.loads(path.read_text(encoding="utf-8"))
    count = migrate_data(database)
    if not count:
        return 0
    backup = path.with_name(f"db.pre-dev21-cleanup-{time.time_ns()}.json")
    shutil.copy2(path, backup)
    os.chmod(backup, 0o600)
    descriptor, temporary = tempfile.mkstemp(prefix=".db.dev21.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as target:
            json.dump(database, target, ensure_ascii=False)
            target.flush()
            os.fsync(target.fileno())
        os.chmod(temporary, path.stat().st_mode & 0o777)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return count


if __name__ == "__main__":
    count = migrate_file(Path(os.environ.get("CORE_DB_DIR", "/core/config")) / "db.json")
    if count:
        print(f"NKL: {count} breite Player-Loeschregeln auf Mediendateien beschraenkt.")
