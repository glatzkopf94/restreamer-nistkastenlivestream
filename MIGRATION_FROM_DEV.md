# Vorhandene Entwicklungsinstanz auf 0.3.0-dev13 umstellen

Diese Anleitung uebernimmt die Volumes `restreamer-dev-config` und
`restreamer-dev-data`. Der offizielle Container `restreamer` sowie dessen
Volumes werden nicht beruehrt.

## 1. Entwicklungsinstanz sichern

```bash
docker run --rm \
  -v restreamer-dev-config:/source:ro \
  -v /root:/backup \
  alpine:3.24 \
  tar -C /source -czf /backup/restreamer-dev-config-before-0.3.0-dev13.tar.gz .
```

```bash
docker run --rm \
  -v restreamer-dev-data:/source:ro \
  -v /root:/backup \
  alpine:3.24 \
  tar -C /source -czf /backup/restreamer-dev-data-before-0.3.0-dev13.tar.gz .
```

## 2. Alten Entwicklungscontainer stoppen

```bash
cd /root/restreamer-dev-0.1.0
docker compose -f compose.yaml down
```

## 3. Release konfigurieren

Im neuen Verzeichnis `.env.example` nach `.env` kopieren. Folgende Werte
uebernehmen die bestehenden Volumes und verwenden weiterhin Port 9080/9181:

```dotenv
RESTREAMER_PROJECT_NAME=restreamer-nkl
RESTREAMER_CONTAINER_NAME=restreamer-nkl
RESTREAMER_IMAGE=ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev13
RESTREAMER_BIND_ADDRESS=127.0.0.1
RESTREAMER_HTTP_PORT=9080
RESTREAMER_API_PORT=9181
RESTREAMER_CONFIG_VOLUME=restreamer-dev-config
RESTREAMER_DATA_VOLUME=restreamer-dev-data
```

Die Overlay-Variablen aus der bisherigen `.env` ebenfalls in die neue `.env`
kopieren.

## 4. Installieren

```bash
cd /root/restreamer-nistkastenlivestream-0.3.0-dev13
chmod 0755 install.sh status.sh uninstall.sh tests/smoke-test.sh
./install.sh
```

Danach sollte der eingerichtete Kanal unveraendert vorhanden sein. Der neue
Container heisst `restreamer-nkl`; der Reverse-Proxy kann wegen des
gleichbleibenden Ports unveraendert bleiben.

Anschliessend bei jedem bestehenden Kanal
`Veroeffentlichung -> Player -> Wiedergabe` oeffnen, die drei neuen
Player-Schalter kontrollieren und einmal `Speichern` waehlen. Erst dadurch
werden die bereits vorhandenen oeffentlichen Player-Dateien fuer automatische
16:9-/4:3-Geometrie, Ein-Player-Sperre und 15-Minuten-Limit neu erzeugt.

Die neuen Aktionen zum Loeschen des DVR-Inhalts stehen direkt nach der
Installation pro Kanal in der HLS-Konfiguration und global unter
`Systemeinstellungen -> DVR` bereit. Dafuer muessen vorhandene Kanaele nicht
erneut gespeichert werden.

Der neue Hintergrund, die Kennung `NKL 1.3 Beta` und die globale
Zuschaueranzeige sind sofort nach der Installation aktiv. Bestehende
Playerseiten werden bereits ueber die anonymisierte Rueckfallerkennung
kanalübergreifend dedupliziert. Wer auch die genauere lokale Browser-ID nutzen
moechte, speichert die Player-Einstellungen des jeweiligen Kanals einmal neu.
