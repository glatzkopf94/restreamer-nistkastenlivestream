#!/usr/bin/env python3
"""Static regression tests for the public DVR player controls."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PLAYER = ROOT / "ui/public/_player/videojs/player.html"
SKIN = ROOT / "ui/public/_player/videojs/dist/video-js-skin.css"
MINIFIED_SKIN = ROOT / "ui/public/_player/videojs/dist/video-js-skin.min.css"


class PlayerUITest(unittest.TestCase):
    def test_duplicate_dvr_panel_is_removed(self):
        html = PLAYER.read_text(encoding="utf-8")
        self.assertNotIn('id="dvr-panel"', html)
        self.assertNotIn('id="dvr-live"', html)
        self.assertNotIn('id="dvr-time"', html)
        self.assertNotIn("ZUM LIVEBILD", html)
        self.assertIn("liveui: true", html)

    def test_native_live_control_has_compact_emphasis(self):
        css = SKIN.read_text(encoding="utf-8")
        self.assertIn(".vjs-public .vjs-seek-to-live-control::after", css)
        self.assertIn("top: 10px", css)
        self.assertIn("bottom: 10px", css)
        self.assertIn(".vjs-at-live-edge::after", css)

        minified = MINIFIED_SKIN.read_text(encoding="utf-8")
        self.assertIn("vjs-seek-to-live-control", minified)
        self.assertIn("vjs-at-live-edge", minified)

    def test_non_dvr_live_marker_is_reddish(self):
        html = PLAYER.read_text(encoding="utf-8")
        css = SKIN.read_text(encoding="utf-8")

        self.assertIn("player.addClass('vjs-live-no-dvr')", html)
        self.assertIn(".vjs-public.vjs-live-no-dvr .vjs-live-control", css)
        self.assertIn("color: #ffadad", css)

    def test_passthrough_overlay_uses_safe_player_elements(self):
        html = PLAYER.read_text(encoding="utf-8")
        self.assertIn('id="lc-player-overlay-root"', html)
        self.assertIn('id="lc-player-overlay-text"', html)
        self.assertIn("playerConfig.overlay", html)
        self.assertIn("response.text()", html)
        self.assertIn("overlayText.textContent", html)
        self.assertIn("playerOverlay.logo1", html)
        self.assertIn("playerOverlay.logo2", html)
        self.assertIn("player.el().appendChild(overlayRoot)", html)
        self.assertIn("pointer-events: none", html)
        self.assertIn("cache: 'no-store'", html)
        self.assertIn("lc-position-top-center", html)
        self.assertIn("lc-position-bottom-center", html)
        self.assertIn("'top-center'", html)
        self.assertIn("'bottom-center'", html)
        self.assertIn("window.setTimeout(refreshOverlayText, 5000)", html)
        self.assertIn("--lc-overlay-font-size", html)
        self.assertIn("updatePlayerOverlayLayout", html)
        self.assertIn("new ResizeObserver", html)
        self.assertIn("logo.image.naturalWidth", html)
        self.assertIn("logo.image.style.height = 'auto'", html)

        compose = (ROOT / "compose.yaml").read_text(encoding="utf-8")
        self.assertIn('CORE_STORAGE_DISK_CACHE_TYPES_BLOCK: ".m3u8 .mpd .txt .html .js"', compose)

    def test_dvr_seek_has_two_segment_safety_margin(self):
        html = PLAYER.read_text(encoding="utf-8")
        self.assertIn("playerConfig.dvr && playerConfig.dvr.enabled", html)
        self.assertIn("var safeStart = first + dvrSegmentDuration * 2", html)
        self.assertIn("player.currentTime(safeStart)", html)

    def test_burnin_and_player_share_overlay_assistant(self):
        player_overlay = (ROOT / "ui/src/views/Publication/PlayerOverlay.js").read_text(encoding="utf-8")
        burnin_overlay = (ROOT / "ui/src/misc/filters/video/TextOverlay.js").read_text(encoding="utf-8")
        self.assertIn("overlay-assistant-v2-burnin", player_overlay)
        self.assertIn("overlay-assistant-v2-player", player_overlay)
        self.assertIn("<PlayerOverlay", burnin_overlay)
        self.assertIn('assistantType="burnin"', burnin_overlay)
        self.assertIn("showAppearance={false}", burnin_overlay)

    def test_adaptive_player_and_bandwidth_guards_are_optional(self):
        html = PLAYER.read_text(encoding="utf-8")
        player_settings = (ROOT / "ui/src/views/Publication/Player.js").read_text(encoding="utf-8")
        restreamer = (ROOT / "ui/src/utils/restreamer.js").read_text(encoding="utf-8")

        self.assertIn("--lc-player-ratio", html)
        self.assertIn("playerPlayback.aspectRatio === '4:3'", html)
        self.assertIn("player.on('loadedmetadata'", html)
        self.assertIn("BroadcastChannel", html)
        self.assertIn("livechasing-active-player-v1", html)
        self.assertIn("player.reset()", html)
        self.assertIn("sessionLimitMinutes", html)
        self.assertIn("playbackGateButton.addEventListener('click'", html)
        self.assertIn("Automatically detect 16:9 or 4:3", player_settings)
        self.assertIn("Allow only one active stream per viewer", player_settings)
        self.assertIn("Require Play again after 15 minutes", player_settings)
        self.assertIn("autoAspectRatio: true", restreamer)
        self.assertIn("singleActiveStream: true", restreamer)
        self.assertIn("sessionLimitEnabled: true", restreamer)
        self.assertIn("aspect-ratio:${cssRatio}", restreamer)

    def test_forced_player_reactivation_has_no_duplicate_load(self):
        html = PLAYER.read_text(encoding="utf-8")

        self.assertIn("var playbackActivationPending = false", html)
        self.assertIn("clearPlaybackActivation", html)
        self.assertIn("restorePlaybackGate", html)
        self.assertIn("12000", html)
        self.assertNotIn("player.load();", html)

    def test_legacy_logo_tab_and_renderer_are_removed(self):
        html = PLAYER.read_text(encoding="utf-8")
        player_settings = (ROOT / "ui/src/views/Publication/Player.js").read_text(encoding="utf-8")
        player_component = (ROOT / "ui/src/misc/Player/index.js").read_text(encoding="utf-8")

        self.assertNotIn('value="logo"', player_settings)
        self.assertNotIn('index="logo"', player_settings)
        self.assertNotIn("handleLogoUpload", player_settings)
        self.assertNotIn("playerConfig.logo.image", html)
        self.assertNotIn("logo.image.length", player_component)

    def test_unique_viewer_identity_is_propagated(self):
        html = PLAYER.read_text(encoding="utf-8")
        middleware = (ROOT / "core/http/middleware/session/HLS.go").read_text(encoding="utf-8")
        footer = (ROOT / "ui/src/Footer.js").read_text(encoding="utf-8")
        restreamer = (ROOT / "ui/src/utils/restreamer.js").read_text(encoding="utf-8")

        self.assertIn("livechasing-viewer-id-v1", html)
        self.assertIn("publicSourceURL.searchParams.set('viewer', viewerToken)", html)
        self.assertIn('extra = "[viewer:" + viewerID + "] " + extra', middleware)
        self.assertIn("q.Set(\"viewer\", viewerID)", middleware)
        self.assertIn("countUniqueHLSViewers", restreamer)
        self.assertIn("core.viewer_used", footer)

    def test_nkl_branding_and_background_are_active(self):
        package = (ROOT / "ui/package.json").read_text(encoding="utf-8")
        version = (ROOT / "ui/src/version.js").read_text(encoding="utf-8")
        global_theme = (ROOT / "ui/src/theme/global.js").read_text(encoding="utf-8")
        background = ROOT / "ui/src/assets/images/background-restreamer.png"

        self.assertIn('"nklVersion": "1.2 Beta"', package)
        self.assertIn("`NKL ${pkg.nklVersion || Version}`", version)
        self.assertIn("background-restreamer.png", global_theme)
        self.assertTrue(background.is_file())
        self.assertGreater(background.stat().st_size, 100000)

    def test_nkl_update_flow_uses_only_the_fork_repository(self):
        version = (ROOT / "ui/src/version.js").read_text(encoding="utf-8")
        restreamer = (ROOT / "ui/src/utils/restreamer.js").read_text(encoding="utf-8")
        settings = (ROOT / "ui/src/views/Settings.js").read_text(encoding="utf-8")
        core_update = (ROOT / "core/update/update.go").read_text(encoding="utf-8")
        installer = (ROOT / "install.sh").read_text(encoding="utf-8")
        agent = (ROOT / "scripts/nkl-update-agent.sh").read_text(encoding="utf-8")

        repository = "glatzkopf94/restreamer-nistkastenlivestream"
        self.assertIn(repository, version)
        self.assertIn("InstallLatestUpdate", restreamer)
        self.assertIn("install-latest-nkl-release", restreamer)
        self.assertIn("Install update", settings)
        self.assertIn(repository, core_update)
        self.assertNotIn("service.datarhei.com/api/v1/app_version", core_update)
        self.assertIn("install_update_agent", installer)
        self.assertIn("foreign-image-blocked", agent)
        self.assertIn("sha256sum --check", agent)

        compose = (ROOT / "compose.yaml").read_text(encoding="utf-8")
        env_example = (ROOT / ".env.example").read_text(encoding="utf-8")
        self.assertIn("restreamer-nkl:", compose)
        self.assertIn("RESTREAMER_CONTAINER_NAME=restreamer-nkl", env_example)
        self.assertIn("RESTREAMER_CONFIG_VOLUME=restreamer-nkl-config", env_example)
        self.assertIn("RESTREAMER_DATA_VOLUME=restreamer-nkl-data", env_example)


if __name__ == "__main__":
    unittest.main()
