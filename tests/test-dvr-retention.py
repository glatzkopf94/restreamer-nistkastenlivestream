#!/usr/bin/env python3
"""Real time DVR bounds across channels, including old stored processes."""

import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


MIGRATE = load("dvr_migration", ROOT / "scripts/migrate-dvr-retention.py")
MANAGER = load("dvr_manager", ROOT / "bundle/livechasing-manager.py")
IDS = ["8672be5b-5a35-4a56-a970-877d7d728983", "2579719c-8d8b-4f59-a936-3048b181710b"]


def fixture():
    db = {
        "version": 4,
        "process": [],
        "metadata": {
            "system": {"restreamer-ui": {"livechasing": {"dvr": {"maxHours": 3, "minFreeGB": 20}}}},
            "process": {},
        },
    }
    for number, channel in enumerate(IDS):
        key = "restreamer-ui:ingest:" + channel
        if number == 0:
            output = {"options": ["-f", "hls", "-hls_list_size", "10800"], "address": f"{{diskfs}}/{channel}_output_0.m3u8"}
        else:
            output = {"options": ["-f", "tee"], "address": f"[bsfs/a=aac_adtstoasc:f=hls:hls_list_size=10800:hls_time=2]{{diskfs}}/{channel}_output_0.m3u8"}
        db["process"].append({"id": key, "output": [output], "input": [{"address": "rtsp://secret.example/camera"}]})
        db["metadata"]["process"][key] = {
            "restreamer-ui": {"control": {"hls": {"segmentDuration": 2, "listSize": 10800,
                                                   "dvr": {"enabled": True, "hours": 6}}}}
        }
    return db


class DVRRetentionTests(unittest.TestCase):
    def test_global_window_updates_each_native_and_tee_process_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            db_path = Path(directory) / "db.json"
            db_path.write_text(json.dumps(fixture()), encoding="utf-8")
            self.assertEqual(MIGRATE.migrate_file(db_path), 2)
            result = json.loads(db_path.read_text(encoding="utf-8"))
            for channel in IDS:
                key = "restreamer-ui:ingest:" + channel
                hls = result["metadata"]["process"][key]["restreamer-ui"]["control"]["hls"]
                self.assertEqual(hls["dvr"]["hours"], 3)
                self.assertEqual(hls["listSize"], 5400)
            self.assertEqual(result["process"][0]["output"][0]["options"][-2:],
                             ["-hls_max_window_duration", "10800"])
            self.assertIn("hls_max_window_duration=10800", result["process"][1]["output"][0]["address"])
            self.assertEqual(MIGRATE.migrate_file(db_path), 0)
            self.assertEqual(len(list(Path(directory).glob("db.pre-dev18-*.json"))), 1)

    def test_expired_unreferenced_segments_are_deleted_for_every_dvr_channel(self):
        wall = 1_800_000_000
        with tempfile.TemporaryDirectory() as directory:
            previous = MANAGER.DATA_DIR
            MANAGER.DATA_DIR = Path(directory)
            try:
                db = fixture()
                for channel in IDS:
                    root = MANAGER.DATA_DIR / channel / "output_0" / "20260926"
                    root.mkdir(parents=True)
                    old = root / "old.ts"
                    kept = root / "referenced.ts"
                    recent = root / "recent.ts"
                    for item in (old, kept, recent):
                        item.write_bytes(b"video")
                    os.utime(old, (wall - 6 * 3600, wall - 6 * 3600))
                    os.utime(kept, (wall - 6 * 3600, wall - 6 * 3600))
                    os.utime(recent, (wall - 10, wall - 10))
                    (MANAGER.DATA_DIR / f"{channel}_output_0.m3u8").write_text(
                        "#EXTM3U\n#EXTINF:2,\n" + f"{channel}/output_0/20260926/referenced.ts\n",
                        encoding="utf-8",
                    )
                self.assertEqual(MANAGER.enforce_dvr_retention(db, 0, 100, wall), 100)
                for channel in IDS:
                    root = MANAGER.DATA_DIR / channel / "output_0" / "20260926"
                    self.assertFalse((root / "old.ts").exists())
                    self.assertTrue((root / "referenced.ts").exists())
                    self.assertTrue((root / "recent.ts").exists())
            finally:
                MANAGER.DATA_DIR = previous

    def test_no_playlist_means_no_expiration_deletion(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = MANAGER.DATA_DIR
            MANAGER.DATA_DIR = Path(directory)
            try:
                root = MANAGER.DATA_DIR / IDS[0]
                root.mkdir()
                old = root / "old.ts"
                old.write_bytes(b"old")
                os.utime(old, (1, 1))
                MANAGER.enforce_dvr_retention(fixture(), 0, 100, 1_800_000_000)
                self.assertTrue(old.exists())
            finally:
                MANAGER.DATA_DIR = previous


if __name__ == "__main__":
    unittest.main()
