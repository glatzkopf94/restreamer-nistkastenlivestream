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

echo "Release-Pruefung erfolgreich: ${PRODUCT_LABEL} / ${RELEASE_VERSION}"
