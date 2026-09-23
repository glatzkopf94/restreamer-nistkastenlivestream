# NKL 1.3 Beta / 0.3.0-dev14

Dieses Wartungsrelease behebt zwei Fehler aus dev13:

- Der Host-Update-Agent erkennt die Versionskennung nun auch in kompakter,
  einzeiliger GitHub-Release-JSON. Damit scheitert die Installation eines in
  der Oberflaeche erkannten Updates nicht mehr mit
  `invalid-release-version`.
- Der UI-API-Client versucht bei erfolgreichen HTTP-`HEAD`-Antworten nicht
  mehr, einen nicht vorhandenen JSON-Body zu parsen. Die manuelle
  DVR-Bereinigung meldet dadurch nach einer erfolgreichen Loeschung auch
  Erfolg statt eines Fehlers.

Die zeitbasierte CFR-Reparatur aus dev13 bleibt unveraendert aktiv. Ebenso
bleiben DVR-Historie und Einstellungen erhalten: `diskfs`, Zwei-Sekunden-
Segmente, frei konfigurierbare 1 bis 168 Stunden, `dvr.hours`, `listSize`,
Aufraeumlogik sowie die bestehenden Konfigurations- und Datenvolumes werden
nicht geaendert.

Das fertige AMD64-Image lautet:

`ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev14`

Das beigefuegte ZIP enthaelt den Pull-Installer; auf dem Zielserver ist kein
lokaler Build erforderlich.
