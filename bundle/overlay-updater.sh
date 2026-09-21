#!/bin/sh

set -u

common_url="${OVERLAY_JSON_URL:-}"
temperature_url="${OVERLAY_TEMPERATURE_JSON_URL:-$common_url}"
humidity_url="${OVERLAY_HUMIDITY_JSON_URL:-$common_url}"
target="${OVERLAY_TEXT_FILE:-/core/data/overlays/environment.txt}"
interval="${OVERLAY_INTERVAL_SECONDS:-60}"
temperature_query="${OVERLAY_TEMPERATURE_JQ:-.value // .temperature // .current.temperature_2m}"
humidity_query="${OVERLAY_HUMIDITY_JQ:-.value // .humidity // .current.relative_humidity_2m}"
temperature_label="${OVERLAY_TEMPERATURE_LABEL:-Temp}"
humidity_label="${OVERLAY_HUMIDITY_LABEL:-F}"
temperature_decimals="${OVERLAY_TEMPERATURE_DECIMALS:-1}"
humidity_decimals="${OVERLAY_HUMIDITY_DECIMALS:-0}"
common_header="${OVERLAY_HTTP_HEADER:-}"
temperature_header="${OVERLAY_TEMPERATURE_HTTP_HEADER:-$common_header}"
humidity_header="${OVERLAY_HUMIDITY_HTTP_HEADER:-$common_header}"

case "$target" in
    /core/data/overlays/*.txt) ;;
    *)
        echo "Overlay updater: OVERLAY_TEXT_FILE muss /core/data/overlays/*.txt sein" >&2
        exit 1
        ;;
esac

case "$interval" in
    ''|*[!0-9]*) interval=60 ;;
esac
if [ "$interval" -lt 5 ]; then
    interval=5
fi

case "$temperature_decimals" in
    0|1|2|3) ;;
    *) temperature_decimals=1 ;;
esac
case "$humidity_decimals" in
    0|1|2|3) ;;
    *) humidity_decimals=0 ;;
esac

mkdir -p /core/data/overlays

if [ ! -f "$target" ]; then
    printf '%s: -- °C   %s: -- %%\n' "$temperature_label" "$humidity_label" > "$target"
fi

if [ -z "$temperature_url" ] || [ -z "$humidity_url" ]; then
    echo "Overlay updater: Temperatur- und Feuchte-URL muessen konfiguriert sein" >&2
    exit 0
fi

fetch_json() {
    fetch_url="$1"
    fetch_header="$2"

    if [ -n "$fetch_header" ]; then
        curl --fail --silent --show-error --max-time 15 --header "$fetch_header" "$fetch_url" 2>/dev/null || true
    else
        curl --fail --silent --show-error --max-time 15 "$fetch_url" 2>/dev/null || true
    fi
}

format_number() {
    raw_value="$1"
    decimal_places="$2"

    if ! printf '%s\n' "$raw_value" | grep -Eq '^-?[0-9]+([.][0-9]+)?$'; then
        return 1
    fi

    LC_ALL=C awk -v value="$raw_value" -v decimals="$decimal_places" \
        'BEGIN { printf "%.*f", decimals, value }'
}

while true; do
    temperature_payload="$(fetch_json "$temperature_url" "$temperature_header")"

    # Eine gemeinsame Quelle wird nur einmal pro Intervall abgerufen.
    if [ "$humidity_url" = "$temperature_url" ] && [ "$humidity_header" = "$temperature_header" ]; then
        humidity_payload="$temperature_payload"
    else
        humidity_payload="$(fetch_json "$humidity_url" "$humidity_header")"
    fi

    if [ -n "$temperature_payload" ] && [ -n "$humidity_payload" ]; then
        temperature="$(printf '%s' "$temperature_payload" | jq -er "$temperature_query" 2>/dev/null || true)"
        humidity="$(printf '%s' "$humidity_payload" | jq -er "$humidity_query" 2>/dev/null || true)"

        temperature="$(format_number "$temperature" "$temperature_decimals" 2>/dev/null || true)"
        humidity="$(format_number "$humidity" "$humidity_decimals" 2>/dev/null || true)"

        if [ -n "$temperature" ] && [ -n "$humidity" ]; then
            temporary="${target}.tmp.$$"
            printf '%s: %s °C   %s: %s %%\n' \
                "$temperature_label" "$temperature" "$humidity_label" "$humidity" > "$temporary"
            mv "$temporary" "$target"
        else
            echo "Overlay updater: Messwert in mindestens einer JSON-Antwort nicht gefunden; letzter gültiger Text bleibt erhalten" >&2
        fi
    else
        echo "Overlay updater: Mindestens eine Datenquelle ist nicht erreichbar; letzter gültiger Text bleibt erhalten" >&2
    fi

    sleep "$interval"
done
