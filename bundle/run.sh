#!/bin/sh

set -u

if [ -x /core/bin/import ]; then
    /core/bin/import || exit 1
fi

if [ -x /core/bin/ffmigrate ]; then
    /core/bin/ffmigrate || exit 1
fi

if [ ! -f "${CORE_STORAGE_DISK_DIR}/index.html" ]; then
    cp /core/ui-root/index.html /core/ui-root/index_icon.svg "${CORE_STORAGE_DISK_DIR}"
fi

/core/bin/overlay-updater.sh &
/core/bin/livechasing-manager.py &

exec /core/bin/core
