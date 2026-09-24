# NKL Restreamer installieren

Dieses Installationspaket laedt das fertig gebaute AMD64-/ARM64-Docker-Image
`ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev15`.
FFmpeg, Core und UI werden auf dem Zielserver nicht mehr kompiliert.

## Installation oder Update

Als `root` ausfuehren:

```bash
unzip -o restreamer-nistkastenlivestream-0.3.0-dev15.zip
cd restreamer-nistkastenlivestream-0.3.0-dev15
chmod 0755 install.sh status.sh uninstall.sh tests/smoke-test.sh
./install.sh
```

Der Installer uebernimmt eine vorhandene `.env`. Liegt im Nachbarverzeichnis
noch dev14, dev13, dev12, dev11, dev10 oder dev9, wird dessen `.env`
automatisch gefunden. Bekannte lokale
dev-Images werden auf das GHCR-Release aktualisiert. Konfiguration und
Docker-Volumes mit Einstellungen und DVR-Daten bleiben erhalten.

Beim ersten Start migriert dev13 ausschliesslich gespeicherte Graphen der Form
`setpts=N/(<fps>*TB)` auf die zeitbasierte CFR-Reparatur. Die Core-Datenbank
wird davor gesichert; Kamera-URLs oder Zugangsdaten werden nicht ausgegeben.
DVR-Dauer, Segmentdateien, `diskfs` und Aufraeumregeln bleiben unveraendert.

Die bisherigen Standardnamen `restreamer-livechasing` werden automatisch auf
`restreamer-nkl` umgestellt. Dabei werden die alten Konfigurations- und
Datenvolumes einmalig in `restreamer-nkl-config` und `restreamer-nkl-data`
uebernommen. Nach der Installation kann ein neues Release direkt unter
`System -> Allgemein` geprueft und installiert werden.

Der erste Download dauert abhaengig von der Verbindung etwas laenger. Bei
spaeteren Updates laedt Docker nur neue oder geaenderte Layer.

Auf Raspberry Pi 5 ist ein 64-Bit-Betriebssystem (`uname -m` = `aarch64`)
erforderlich. Das gleiche Paket waehlt durch Docker automatisch das ARM64-Image.
Der vorhandene Originalcontainer `restreamer-rpi` auf Port 8080 wird nicht
ersetzt; NKL laeuft separat als `restreamer-nkl` auf 127.0.0.1:9080 und
127.0.0.1:9181. Ein Zugriff von anderen Geraeten benoetigt einen eigenen
Reverse-Proxy oder eine bewusst geaenderte Bind-Adresse.

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
