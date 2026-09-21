#!/bin/sh

set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$project_dir"

docker compose -f compose.yaml ps
container_id="$(docker compose -f compose.yaml ps -q restreamer-nkl)"

if [ -z "$container_id" ]; then
    echo "Die Restreamer-Livechasing-Instanz laeuft nicht." >&2
    exit 1
fi

echo
docker exec "$container_id" ffmpeg -hide_banner -version | head -n 1
echo
docker logs --tail 60 "$container_id"
