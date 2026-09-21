# NKL Restreamer installieren

Dieses Installationspaket laedt das fertig gebaute AMD64-Docker-Image
`ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev11`.
FFmpeg, Core und UI werden auf dem Zielserver nicht mehr kompiliert.

## Installation oder Update

Als `root` ausfuehren:

```bash
unzip -o restreamer-nistkastenlivestream-0.3.0-dev11.zip
cd restreamer-nistkastenlivestream-0.3.0-dev11
chmod 0755 install.sh status.sh uninstall.sh tests/smoke-test.sh
./install.sh
```

Der Installer uebernimmt eine vorhandene `.env`. Liegt im Nachbarverzeichnis
noch dev10 oder dev9, wird dessen `.env` automatisch gefunden. Bekannte lokale
dev-Images werden auf das GHCR-Release aktualisiert. Konfiguration und
Docker-Volumes mit Einstellungen und DVR-Daten bleiben erhalten.

Der erste Download dauert abhaengig von der Verbindung etwas laenger. Bei
spaeteren Updates laedt Docker nur neue oder geaenderte Layer.

## Status

```bash
./status.sh
```

## Deinstallation ohne Datenverlust

```bash
./uninstall.sh
```

`./uninstall.sh --purge-data` loescht dagegen auch die konfigurierten Volumes
und darf nur bewusst verwendet werden.
