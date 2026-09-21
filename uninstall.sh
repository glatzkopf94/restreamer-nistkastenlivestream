#!/bin/sh

set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$project_dir"

if [ "${1:-}" = "--purge-data" ]; then
    config_volume="$(sed -n 's/^RESTREAMER_CONFIG_VOLUME=//p' .env | tail -n 1)"
    config_volume="${config_volume:-restreamer-livechasing-config}"
    data_volume="$(sed -n 's/^RESTREAMER_DATA_VOLUME=//p' .env | tail -n 1)"
    data_volume="${data_volume:-restreamer-livechasing-data}"

    case "$config_volume:$data_volume" in
        restreamer-config:*|*:restreamer-data)
            echo "Abbruch: Ein Volume der offiziellen Restreamer-Instanz ist eingetragen." >&2
            exit 1
            ;;
    esac

    docker compose -f compose.yaml down
    for volume in "$config_volume" "$data_volume"; do
        if docker volume inspect "$volume" >/dev/null 2>&1; then
            docker volume rm "$volume"
        fi
    done
    echo "Container, Netzwerk und die konfigurierten Datenvolumes wurden geloescht."
else
    docker compose -f compose.yaml down
    echo "Container und Netzwerk entfernt; Konfigurations- und Datenvolume bleiben erhalten."
    echo "Zum ausdruecklichen Loeschen aller Daten: ./uninstall.sh --purge-data"
fi

echo "Andere Docker-Compose-Projekte und ein Container namens 'restreamer' bleiben unberuehrt."
