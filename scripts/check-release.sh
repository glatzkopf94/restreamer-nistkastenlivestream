#!/bin/sh

set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$project_dir"

. ./release.env

fail() {
    echo "Release-Pruefung fehlgeschlagen: $1" >&2
    exit 1
}

case "$RELEASE_VERSION" in
    *[!A-Za-z0-9._-]*|"") fail "ungueltige RELEASE_VERSION" ;;
esac
case "$PRODUCT_VERSION" in
    *[!a-z0-9._-]*|"") fail "ungueltige PRODUCT_VERSION" ;;
esac
case "$GHCR_IMAGE" in
    ghcr.io/glatzkopf94/restreamer-nistkastenlivestream) ;;
    *) fail "unerwartetes GHCR_IMAGE" ;;
esac

grep -Fq "RESTREAMER_IMAGE=${GHCR_IMAGE}:${RELEASE_VERSION}" .env.example || \
    fail ".env.example verwendet nicht das Release-Image"
grep -Fq "${GHCR_IMAGE}:${RELEASE_VERSION}" compose.yaml || \
    fail "compose.yaml verwendet nicht das Release-Image"
grep -Fq "\"version\": \"${RELEASE_VERSION}\"" ui/package.json || \
    fail "UI-Version stimmt nicht"
grep -Fq "\"nklVersion\": \"${PRODUCT_LABEL#NKL }\"" ui/package.json || \
    fail "NKL-Produktkennung stimmt nicht"
grep -Fq -- "--extra-version=nkl-restreamer-${RELEASE_VERSION}" ffmpeg/Dockerfile || \
    fail "FFmpeg-Kennung stimmt nicht"
grep -Fq "NKL_RELEASE_VERSION=${RELEASE_VERSION}" bundle/Dockerfile || \
    fail "NKL-Updatekennung im Image stimmt nicht"
grep -Fq 'api.github.com/repos/glatzkopf94/restreamer-nistkastenlivestream/releases/latest' ui/src/version.js || \
    fail "UI prueft nicht das NKL-GitHub-Repository"
test -x scripts/nkl-update-agent.sh || fail "Host-Update-Agent ist nicht ausfuehrbar"
grep -Fq 'RESTREAMER_CONTAINER_NAME=restreamer-nkl' .env.example || \
    fail "Standard-Containername ist nicht restreamer-nkl"
grep -Fq 'RESTREAMER_CONFIG_VOLUME=restreamer-nkl-config' .env.example || \
    fail "Standard-Konfigurationsvolume ist nicht restreamer-nkl-config"
grep -Fq 'RESTREAMER_DATA_VOLUME=restreamer-nkl-data' .env.example || \
    fail "Standard-Datenvolume ist nicht restreamer-nkl-data"
grep -Fq 'restreamer-livechasing-config restreamer-nkl-config' install.sh || \
    fail "Migration des bisherigen Konfigurationsvolumes fehlt"
grep -Fq 'restreamer-livechasing-data restreamer-nkl-data' install.sh || \
    fail "Migration des bisherigen Datenvolumes fehlt"

echo "Release-Pruefung erfolgreich: ${PRODUCT_LABEL} / ${RELEASE_VERSION}"
