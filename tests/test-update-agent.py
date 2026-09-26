#!/usr/bin/env python3

import pathlib
import subprocess
import tempfile
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
AGENT = ROOT / "scripts" / "nkl-update-agent.sh"


class UpdateAgentReleaseParsingTests(unittest.TestCase):
    def parse_version(self, payload: str) -> str:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8") as release:
            release.write(payload)
            release.flush()
            command = (
                "sed -n 's/.*\"tag_name\"[[:space:]]*:[[:space:]]*\"v\\([^\"]*\\)\".*/\\1/p' "
                '"$1" | head -n 1'
            )
            result = subprocess.run(
                ["sh", "-c", command, "sh", release.name],
                check=True,
                capture_output=True,
                text=True,
            )
            return result.stdout.strip()

    def test_agent_uses_compact_json_safe_tag_parser(self) -> None:
        agent = AGENT.read_text(encoding="utf-8")
        self.assertIn('s/.*"tag_name"[[:space:]]*:', agent)
        self.assertNotIn('s/^[[:space:]]*"tag_name"', agent)

    def test_extracts_tag_from_pretty_github_json(self) -> None:
        self.assertEqual(
            self.parse_version('{\n  "tag_name": "v0.3.0-dev14",\n  "name": "NKL"\n}\n'),
            "0.3.0-dev14",
        )

    def test_extracts_tag_from_compact_github_json(self) -> None:
        self.assertEqual(
            self.parse_version('{"url":"https://api.github.test/release","tag_name":"v0.3.0-dev14","name":"NKL"}'),
            "0.3.0-dev14",
        )

    def test_installer_rearms_path_on_the_active_data_volume(self) -> None:
        installer = (ROOT / "install.sh").read_text(encoding="utf-8")
        service = (ROOT / "systemd/nkl-restreamer-update.service.in").read_text(encoding="utf-8")
        path = (ROOT / "systemd/nkl-restreamer-update.path.in").read_text(encoding="utf-8")
        self.assertIn('docker compose -f compose.yaml ps -q restreamer-nkl', installer)
        self.assertIn('!= "$data_volume"', installer)
        self.assertIn('systemctl stop nkl-restreamer-update.path', installer)
        self.assertIn('systemctl enable --now nkl-restreamer-update.path', installer)
        self.assertIn('systemctl is-active --quiet nkl-restreamer-update.path', installer)
        self.assertIn('"@PROJECT_DIR@" "@DATA_DIR@"', service)
        self.assertIn('@DATA_DIR@/nkl-update/requests/*.json', path)

    def test_agent_rejects_stale_or_mismatched_compose_binding(self) -> None:
        agent = AGENT.read_text(encoding="utf-8")
        self.assertIn('failure_code="instance-mismatch"', agent)
        self.assertIn('"$(docker volume inspect "$data_volume" --format', agent)
        self.assertIn('"$data_dir"', agent)


if __name__ == "__main__":
    unittest.main()
