# NKL 1.3 Beta / 0.3.0-dev15

Dieses Release stellt das fertige Image erstmals gemeinsam fuer
`linux/amd64` und `linux/arm64` bereit. FFmpeg 9.0.1, Core und UI werden auf
nativen GitHub-Runnern getrennt gebaut und getestet; erst nach zwei
erfolgreichen Container-Smoke-Tests wird das gemeinsame Manifest publiziert.
Docker waehlt auf einem Raspberry Pi 5 mit 64-Bit-System automatisch ARM64.

Das Installations-ZIP mit `install.sh` gilt fuer beide Architekturen. Der
Installer erkennt `aarch64`, lehnt 32-Bit-ARM ab und schuetzt auch einen
anders benannten offiziellen datarhei-Container wie `restreamer-rpi`.
NKL nutzt unveraendert eigene Volumes und standardmaessig 127.0.0.1:9080/9181.
Bestehende NKL-Konfigurationen aus dev14 und dev13 werden bei einem Update
automatisch gefunden; vorhandene DVR-Daten bleiben erhalten.

Die kryptischen IDs der drei Zeitstempel-Filterbeschriftungen werden im
Produktivbuild durch lesbare deutsche beziehungsweise englische Texte ersetzt.
An der zeitbasierten CFR-Reparatur selbst wird nichts geaendert. Die dev14-
Korrekturen fuer Self-Update und die DVR-Erfolgsmeldung bleiben enthalten.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev15`

Auf dem Raspberry Pi 5 muss die praktische Transcoding-Leistung fuer den
jeweiligen 4K-Kamerastream gesondert geprueft werden.
