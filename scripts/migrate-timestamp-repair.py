#!/usr/bin/env python3
"""Atomically migrate dev12 frame-counter timestamp repair graphs.

The script deliberately works on the serialized JSON without logging any
configuration values. This updates both process options and UI metadata before
Core starts, while leaving unrelated settings and DVR data byte-for-byte
unchanged apart from JSON occurrences of the exact legacy filter expression.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import time


LEGACY_GRAPH = re.compile(r"setpts=N/\((?P<fps>[0-9]+(?:\.[0-9]+)?)\*TB\)")


def migrate_text(raw: str) -> tuple[str, int]:
    def replacement(match: re.Match[str]) -> str:
        fps = match.group("fps")
        value = float(fps)
        if not 0 < value <= 240:
            return match.group(0)
        return f"fps=fps={fps}:start_time=0:round=near"

    return LEGACY_GRAPH.subn(replacement, raw)


def migrate_file(database: Path) -> int:
    if not database.is_file():
        return 0

    raw = database.read_text(encoding="utf-8")
    migrated, count = migrate_text(raw)
    if count == 0 or migrated == raw:
        return 0

    # Refuse to replace the operational database unless the result is valid
    # JSON. No parsed content is printed, because input URLs can be sensitive.
    json.loads(migrated)

    mode = database.stat().st_mode & 0o777
    backup = database.with_name(f"db.pre-dev13-{int(time.time())}.json")
    shutil.copy2(database, backup)
    os.chmod(backup, 0o600)

    fd, temporary_name = tempfile.mkstemp(prefix=".db.dev13.", suffix=".tmp", dir=database.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(migrated)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary_name, mode or 0o600)
        os.replace(temporary_name, database)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)

    return count


def main() -> int:
    database = Path(os.environ.get("CORE_DB_DIR", "/core/config")) / "db.json"
    count = migrate_file(database)
    if count:
        print(f"NKL dev13: {count} gespeicherte Timestamp-Repair-Graphen migriert.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"NKL dev13: Timestamp-Migration fehlgeschlagen: {type(error).__name__}", file=sys.stderr)
        raise SystemExit(1)
