#!/usr/bin/env python3
"""Check that the release gate rejects incomplete manifest lists."""

import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts/verify-multiarch-manifest.py"
spec = importlib.util.spec_from_file_location("verify_multiarch_manifest", SCRIPT)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def manifest(*platforms):
    return {
        "schemaVersion": 2,
        "manifests": [
            {"digest": f"sha256:{index}", "platform": {"os": os, "architecture": arch}}
            for index, (os, arch) in enumerate(platforms)
        ],
    }


class MultiarchManifestTests(unittest.TestCase):
    def test_both_native_platforms_are_required(self):
        result = validator.verify(manifest(("linux", "amd64"), ("linux", "arm64")))
        self.assertEqual(result, {("linux", "amd64"), ("linux", "arm64")})

    def test_amd64_only_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "arm64"):
            validator.verify(manifest(("linux", "amd64")))

    def test_arm64_only_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "amd64"):
            validator.verify(manifest(("linux", "arm64")))

    def test_non_linux_platform_does_not_substitute_arm64(self):
        with self.assertRaisesRegex(ValueError, "arm64"):
            validator.verify(manifest(("linux", "amd64"), ("windows", "arm64")))

    def test_single_architecture_manifest_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "multi-platform"):
            validator.verify({"schemaVersion": 2, "config": {"digest": "sha256:abc"}})


if __name__ == "__main__":
    unittest.main()
