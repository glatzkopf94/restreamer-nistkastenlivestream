#!/bin/sh

set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$project_dir"

. ./release.env
release_version="$RELEASE_VERSION"
default_image="${GHCR_IMAGE}:${release_version}"

if [ "$(id -u)" -ne 0 ]; then
    echo "Bitte als root ausfuehren: sudo ./install.sh" >&2
    exit 1
fi

if [ "$(uname -m)" != "x86_64" ]; then
    echo "Dieses Release ist fuer x86_64/AMD64 gebaut; erkannt: $(uname -m)" >&2
    exit 1
fi

for command_name in docker curl tar; do
    command -v "$command_name" >/dev/null 2>&1 || {
        echo "$command_name wurde nicht gefunden." >&2
        exit 1
    }
done
docker info >/dev/null
docker compose version >/dev/null

if [ ! -f .env ]; then
    migrated_env=""
    for candidate in \
        ../restreamer-livechasing-0.3.0-dev10/.env \
        ../restreamer-livechasing-0.3.0-dev9/.env; do
        if [ -f "$candidate" ]; then
            cp "$candidate" .env
            migrated_env="$candidate"
            break
        fi
    done
    if [ -n "$migrated_env" ]; then
        echo "Vorhandene Einstellungen uebernommen: $migrated_env"
    else
        cp .env.example .env
    fi
fi
chmod 0600 .env

# Bekannte lokale Entwicklungsimages automatisch auf das fertige GHCR-Image
# umstellen. Eine bewusst eingetragene andere Registry bleibt unangetastet.
configured_image="$(sed -n 's/^RESTREAMER_IMAGE=//p' .env | tail -n 1)"
case "$configured_image" in
    ""|livechasing/restreamer:*|ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:*)
        env_tmp=".env.tmp.$$"
        awk -v image="$default_image" '
            BEGIN { replaced = 0 }
            /^RESTREAMER_IMAGE=/ {
                if (!replaced) {
                    print "RESTREAMER_IMAGE=" image
                    replaced = 1
                }
                next
            }
            { print }
            END {
                if (!replaced) print "RESTREAMER_IMAGE=" image
            }
        ' .env > "$env_tmp"
        chmod 0600 "$env_tmp"
        mv "$env_tmp" .env
        ;;
    *)
        echo "Benutzerdefiniertes Image bleibt aktiv: $configured_image"
        ;;
esac

if grep -Eq '^RESTREAMER_(PROJECT_NAME|CONTAINER_NAME)=restreamer([[:space:]]*)$' .env || \
   grep -Eq '^RESTREAMER_CONFIG_VOLUME=restreamer-config([[:space:]]*)$' .env || \
   grep -Eq '^RESTREAMER_DATA_VOLUME=restreamer-data([[:space:]]*)$' .env; then
    echo "Abbruch: Name oder Volume der offiziellen Restreamer-Instanz ist reserviert." >&2
    echo "Bitte die RESTREAMER_*-Werte in .env getrennt benennen." >&2
    exit 1
fi

release_image="$(docker compose -f compose.yaml config --images | head -n 1)"
if [ -z "$release_image" ]; then
    echo "Der Imagename konnte nicht aus compose.yaml ermittelt werden." >&2
    exit 1
fi
case "$release_image" in
    datarhei/restreamer|datarhei/restreamer:*)
        echo "Abbruch: Das offizielle datarhei/restreamer-Image darf nicht ueberschrieben werden." >&2
        exit 1
        ;;
esac

config_volume="$(sed -n 's/^RESTREAMER_CONFIG_VOLUME=//p' .env | tail -n 1)"
config_volume="${config_volume:-restreamer-livechasing-config}"
data_volume="$(sed -n 's/^RESTREAMER_DATA_VOLUME=//p' .env | tail -n 1)"
data_volume="${data_volume:-restreamer-livechasing-data}"

docker volume inspect "$config_volume" >/dev/null 2>&1 || \
    docker volume create --name "$config_volume" >/dev/null
docker volume inspect "$data_volume" >/dev/null 2>&1 || \
    docker volume create --name "$data_volume" >/dev/null

echo "[1/4] Fertiges Release-Image laden: $release_image"
if ! docker compose -f compose.yaml pull restreamer-livechasing; then
    echo >&2
    echo "Das Release-Image konnte nicht geladen werden." >&2
    echo "Pruefe, ob das GHCR-Paket veroeffentlicht und auf Public gestellt wurde." >&2
    exit 1
fi

echo "[2/4] Vorhandene Konfiguration sichern"
mkdir -p backups
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
existing_container="$(docker compose -f compose.yaml ps --all -q restreamer-livechasing 2>/dev/null || true)"
if [ -n "$existing_container" ]; then
    config_source="$(docker inspect "$existing_container" --format '{{range .Mounts}}{{if eq .Destination "/core/config"}}{{.Source}}{{end}}{{end}}')"
    if [ -n "$config_source" ] && [ -d "$config_source" ]; then
        tar -C "$config_source" -czf "backups/restreamer-config-${timestamp}.tar.gz" .
        chmod 0600 "backups/restreamer-config-${timestamp}.tar.gz"
        echo "Konfiguration gesichert: backups/restreamer-config-${timestamp}.tar.gz"
    fi
else
    echo "Keine vorhandene Instanz gefunden; keine Sicherung erforderlich."
fi

echo "[3/4] Container aktualisieren und starten"
docker compose -f compose.yaml up --detach --remove-orphans

http_port="$(sed -n 's/^RESTREAMER_HTTP_PORT=//p' .env | tail -n 1)"
http_port="${http_port:-9080}"
case "$http_port" in
    ''|*[!0-9]*)
        echo "Ungueltiger RESTREAMER_HTTP_PORT in .env" >&2
        exit 1
        ;;
esac

attempt=0
until curl --fail --silent "http://127.0.0.1:${http_port}/" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 40 ]; then
        echo "Die Instanz antwortet nicht. Diagnose:" >&2
        docker compose -f compose.yaml ps >&2
        container_id="$(docker compose -f compose.yaml ps -q restreamer-livechasing 2>/dev/null || true)"
        if [ -n "$container_id" ]; then
            docker logs --tail 120 "$container_id" >&2
        fi
        exit 1
    fi
    sleep 2
done

echo "[4/4] Release pruefen"
./tests/smoke-test.sh

container_id="$(docker compose -f compose.yaml ps -q restreamer-livechasing)"
image_id="$(docker inspect "$container_id" --format '{{.Image}}')"

echo
echo "Restreamer Nistkasten Livestream ${release_version} laeuft auf http://127.0.0.1:${http_port}"
echo "Image: $release_image"
echo "Image-ID: $image_id"
echo "Ein vorhandener offizieller Container namens 'restreamer' wurde nicht veraendert."
