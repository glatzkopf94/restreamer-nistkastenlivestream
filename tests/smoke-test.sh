#!/bin/sh

set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$project_dir"
. ./release.env

container="$(docker compose -f compose.yaml ps -q restreamer-nkl)"
if [ -z "$container" ]; then
    echo "Smoke-Test: Container laeuft nicht." >&2
    exit 1
fi

docker exec "$container" ffmpeg -hide_banner -filters 2>/dev/null | grep -Eq '[[:space:]]fps[[:space:]]'
docker exec "$container" ffmpeg -hide_banner -filters 2>/dev/null | grep -Eq '[[:space:]]drawtext[[:space:]]'
docker exec "$container" ffmpeg -hide_banner -filters 2>/dev/null | grep -Eq '[[:space:]]overlay[[:space:]]'
docker exec "$container" ffmpeg -hide_banner -filters 2>/dev/null | grep -Eq '[[:space:]]movie[[:space:]]'
docker exec "$container" python3 --version >/dev/null
docker exec "$container" python3 -c 'import json, urllib.request' >/dev/null
docker exec "$container" test -x /core/bin/livechasing-manager.py
docker exec "$container" test -x /core/bin/migrate-timestamp-repair.py
docker exec "$container" sh -c "ps auxww | grep '[l]ivechasing-manager.py'" >/dev/null
docker exec "$container" sh -c 'grep -Fq "def purge_dvr_content" /core/bin/livechasing-manager.py'
docker exec "$container" test -d /core/data/livechasing-control/requests
docker exec "$container" test -d /core/data/livechasing-control/responses
docker exec "$container" sh -c 'test "$CORE_STORAGE_DISK_CACHE_TYPES_BLOCK" = ".m3u8 .mpd .txt .html .js"'
docker exec "$container" sh -c 'grep -Fq "local-draft-v2" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "overlay-assistant-v2-player" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "overlay-assistant-v2-burnin" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "RTSP stability profile" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "lc-position-top-center" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "lc-position-bottom-center" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "window.setTimeout(refreshOverlayText, 5000)" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "var safeStart = first + dvrSegmentDuration * 2" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "livechasing-active-player-v1" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "playbackLimitMilliseconds" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "playbackActivationPending" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "updatePlayerOverlayLayout" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "vjs-live-no-dvr" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq -- "--lc-player-ratio" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'grep -Fq "Automatically detect 16:9 or 4:3" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "Delete all DVR content" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'grep -Fq "install-latest-nkl-release" /core/ui/static/js/main.*.js'
docker exec "$container" sh -c 'test "$NKL_RELEASE_VERSION" = "'"$RELEASE_VERSION"'"'
docker exec "$container" sh -c "grep -Fq '$PRODUCT_LABEL' /core/ui/static/js/main.*.js"
docker exec "$container" sh -c 'grep -Fq "livechasing-viewer-id-v1" /core/ui/_player/videojs/player.html'
docker exec "$container" sh -c 'ls /core/ui/static/media/background-restreamer.*.png >/dev/null'

dvr_control_id='00000000-0000-4000-8000-000000000009'
dvr_control_request="/core/data/livechasing-control/requests/$dvr_control_id.json"
dvr_control_response="/core/data/livechasing-control/responses/$dvr_control_id.json"
docker exec "$container" rm -f "$dvr_control_request" "$dvr_control_response"
printf '{"version":1,"action":"purge-dvr","requestId":"%s","channelIds":[]}\n' "$dvr_control_id" | \
    docker exec -i "$container" sh -c "cat > '$dvr_control_request'"
dvr_control_ready=false
for _ in 1 2 3 4 5 6 7 8 9 10; do
    if docker exec "$container" test -f "$dvr_control_response"; then
        dvr_control_ready=true
        break
    fi
    sleep 1
done
test "$dvr_control_ready" = true
docker exec "$container" python3 -c "import json; data=json.load(open('$dvr_control_response')); assert data['ok'] is True and data['deletedFiles'] == 0"
docker exec "$container" rm -f "$dvr_control_request" "$dvr_control_response"
for font in \
    /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf; do
    docker exec "$container" test -r "$font"
done

docker exec "$container" ffmpeg -hide_banner -formats 2>/dev/null | \
    grep -Eq '^[[:space:]]*D[E[:space:]][[:space:]]+rtsp[[:space:]]'
docker exec "$container" ffmpeg -hide_banner -h demuxer=rtsp 2>&1 | grep -q -- '-buffer_size'
docker exec "$container" ffmpeg -hide_banner -h full 2>&1 | grep -q -- '-max_delay'
docker exec "$container" ffmpeg -hide_banner -h full 2>&1 | grep -q -- '-err_detect'
docker exec "$container" ffmpeg -hide_banner -h full 2>&1 | grep -q -- '-xerror'

jsonstats="$(docker exec "$container" ffmpeg \
    -hide_banner -loglevel level+info -stats_period 0.5 -jsonstats \
    -f lavfi -i 'testsrc2=size=320x180:rate=15' \
    -t 2 -codec:v libx264 -preset ultrafast -f null - 2>&1)"

printf '%s\n' "$jsonstats" | grep -q '^ffmpeg.inputs:'
printf '%s\n' "$jsonstats" | grep -q '^ffmpeg.outputs:'
printf '%s\n' "$jsonstats" | grep -q '^ffmpeg.progress:'

smoke_textfile='/core/data/overlays/.restreamer-smoke-test.txt'
smoke_logo='/core/data/overlays/.restreamer-smoke-test.bmp'
cleanup() {
    docker exec "$container" rm -f "$smoke_textfile" "$smoke_logo" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

printf 'Temp: 21.5 °C   F: 48 %%\n' | \
    docker exec -i "$container" sh -c "mkdir -p /core/data/overlays && cat > '$smoke_textfile'"

docker exec "$container" ffmpeg \
    -hide_banner -loglevel error \
    -f lavfi -i 'color=c=0x32AAFF:size=160x80' \
    -frames:v 1 "$smoke_logo"

docker exec "$container" ffmpeg \
    -hide_banner -loglevel error \
    -f lavfi -i 'testsrc2=size=1280x720:rate=15' \
    -t 2 \
    -filter_complex "[0:v]fps=fps=15:start_time=0:round=near[base];movie=filename='$smoke_logo',format=rgba,colorchannelmixer=aa=0.80[logo];[base][logo]overlay=x=W-w-24:y=24[tmp];[tmp]drawtext=textfile='$smoke_textfile':reload=15:expansion=none:fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf':fontcolor=0x32AAFF:fontsize=36:x=24:y=h-th-24[out]" \
    -map '[out]' \
    -codec:v libx264 -preset ultrafast \
    -f null -

cleanup
trap - EXIT HUP INT TERM

av_smoke='/tmp/nkl-cfr-av-smoke.ts'
docker exec "$container" rm -f "$av_smoke"
docker exec "$container" ffmpeg \
    -hide_banner -loglevel error \
    -f lavfi -i 'testsrc2=size=160x90:rate=149654/10000' \
    -f lavfi -i 'sine=frequency=1000:sample_rate=48000' \
    -t 12 \
    -filter:v 'fps=fps=15:start_time=0:round=near' \
    -codec:v libx264 -preset ultrafast -g 30 -keyint_min 30 -sc_threshold 0 \
    -codec:a aac -b:a 64k \
    -f mpegts "$av_smoke"

docker exec -i "$container" python3 - "$av_smoke" <<'PY'
import json
import subprocess
import sys

path = sys.argv[1]

def packet_times(selector):
    output = subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', selector,
        '-show_entries', 'packet=pts_time,duration_time', '-of', 'json', path,
    ], text=True)
    packets = json.loads(output)['packets']
    times = [float(packet['pts_time']) for packet in packets if 'pts_time' in packet]
    assert times and all(right > left for left, right in zip(times, times[1:])), selector
    last = max(float(packet['pts_time']) + float(packet.get('duration_time', 0)) for packet in packets if 'pts_time' in packet)
    return times[0], last, len(times)

video_start, video_end, video_packets = packet_times('v:0')
audio_start, audio_end, _ = packet_times('a:0')
assert abs(video_packets / 12.0 - 15.0) < 0.2
assert min(video_end, audio_end) - max(video_start, audio_start) > 11.8
assert abs(video_end - audio_end) < 0.15
PY
docker exec "$container" rm -f "$av_smoke"

echo "Smoke-Test erfolgreich: adaptive Player-Geometrie, Bandbreitenschutz, RTSP-Profile, schnelle Player-Overlays, DVR-Schutz, zeitbasierte CFR-Reparatur, A/V-Ueberlappung, Drawtext, Logo-Overlay, Manager und libx264 funktionieren."
