#!/usr/bin/env python3
"""Fail a release if its published manifest omits either supported CPU type."""

import json
import sys
from pathlib import Path


REQUIRED = {("linux", "amd64"), ("linux", "arm64")}


def verify(document: dict) -> set[tuple[str, str]]:
    manifests = document.get("manifests")
    if not isinstance(manifests, list):
        raise ValueError("The registry response is not a multi-platform manifest")
    platforms = {
        (entry.get("platform", {}).get("os"), entry.get("platform", {}).get("architecture"))
        for entry in manifests
    }
    missing = REQUIRED - platforms
    if missing:
        raise ValueError(f"Missing release platforms: {sorted(missing)}")
    return platforms


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("Usage: verify-multiarch-manifest.py manifest.json")
        with Path(sys.argv[1]).open(encoding="utf-8") as source:
            found = verify(json.load(source))
        print("Validated release platforms:", sorted(found))
    except (OSError, ValueError, TypeError) as exc:
        print(f"Multiarch validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
