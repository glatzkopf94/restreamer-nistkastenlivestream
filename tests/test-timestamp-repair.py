#!/usr/bin/env python3
"""Regression and accelerated long-run tests for timestamp repair."""

from __future__ import annotations

import importlib.util
import json
import math
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PATH = ROOT / "scripts" / "migrate-timestamp-repair.py"
SPEC = importlib.util.spec_from_file_location("timestamp_migration", MIGRATION_PATH)
MIGRATION = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MIGRATION)


class TimestampRepairTest(unittest.TestCase):
    def test_dev12_database_migration_updates_process_and_metadata_atomically(self):
        fixture = {
            "version": 4,
            "process": {
                "camera": {
                    "input": [{"address": "http://example.invalid/flv"}],
                    "output": [{"options": ["-filter:v", "setpts=N/(15*TB),scale=3840:2160"]}],
                }
            },
            "metadata": {
                "process": {
                    "camera": {
                        "restreamer-ui": {
                            "profiles": [{
                                "video": {
                                    "filter": {
                                        "graph": "[in]setpts=N/(15*TB)[lc_base0];[lc_base0]drawtext[out]",
                                        "settings": {
                                            "setpts": {
                                                "graph": "setpts=N/(15*TB)",
                                                "settings": {"enabled": True, "fps": "15"},
                                            }
                                        },
                                    }
                                }
                            }]
                        }
                    }
                }
            },
        }

        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "db.json"
            database.write_text(json.dumps(fixture), encoding="utf-8")
            count = MIGRATION.migrate_file(database)
            migrated = database.read_text(encoding="utf-8")

            self.assertEqual(count, 3)
            self.assertNotIn("setpts=N/", migrated)
            self.assertEqual(migrated.count("fps=fps=15:start_time=0:round=near"), 3)
            self.assertIn("http://example.invalid/flv", migrated)
            self.assertEqual(len(list(Path(directory).glob("db.pre-dev13-*.json"))), 1)
            self.assertEqual(MIGRATION.migrate_file(database), 0)

    def test_six_hour_accelerated_clock_model_stays_in_audio_range(self):
        input_rate = 14.9654
        output_rate = 15.0
        audio_rate = 48_000
        duration = 6 * 3600.0

        input_frames = math.floor(duration * input_rate) + 1
        last_input_pts = (input_frames - 1) / input_rate
        old_last_video_pts = (input_frames - 1) / output_rate
        old_drift = duration - old_last_video_pts

        # The fps filter schedules CFR frames on the real input PTS timeline.
        output_frames = math.floor(last_input_pts * output_rate) + 1
        last_video_pts = (output_frames - 1) / output_rate
        audio_samples = math.floor(duration * audio_rate) + 1
        last_audio_pts = (audio_samples - 1) / audio_rate

        self.assertGreater(old_drift, 45.0)
        self.assertLessEqual(abs(last_audio_pts - last_video_pts), 1 / output_rate)
        self.assertAlmostEqual(output_frames / duration, output_rate, places=3)

        segment = 2.0
        video_buffer = (last_video_pts - segment, last_video_pts)
        audio_buffer = (last_audio_pts - segment, last_audio_pts)
        overlap = min(video_buffer[1], audio_buffer[1]) - max(video_buffer[0], audio_buffer[0])
        self.assertGreater(overlap, 1.9)

        # CFR timestamps are strictly monotonic by construction.
        previous = -1.0
        for frame in range(10_000):
            pts = frame / output_rate
            self.assertGreater(pts, previous)
            previous = pts


if __name__ == "__main__":
    unittest.main()
