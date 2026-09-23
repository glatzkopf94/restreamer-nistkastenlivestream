# NKL Restreamer installieren

Dieses Installationspaket laedt das fertig gebaute AMD64-Docker-Image
`ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev14`.
FFmpeg, Core und UI werden auf dem Zielserver nicht mehr kompiliert.

## Installation oder Update

Als `root` ausfuehren:

```bash
unzip -o restreamer-nistkastenlivestream-0.3.0-dev14.zip
cd restreamer-nistkastenlivestream-0.3.0-dev14
chmod 0755 install.sh status.sh uninstall.sh tests/smoke-test.sh
./install.sh
```

Der Installer uebernimmt eine vorhandene `.env`. Liegt im Nachbarverzeichnis
noch dev12, dev11, dev10 oder dev9, wird dessen `.env` automatisch gefunden. Bekannte lokale
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
