# NKL 1.4 Beta / 0.3.0-dev18

- DVR-Playlists aller Kanäle werden anhand der tatsächlichen Segmentdauer auf die globale Haltezeit begrenzt. Vorhandene DVR-Kanäle werden beim Start automatisch migriert. Nicht mehr referenzierte abgelaufene Segmente werden regelmäßig gelöscht.
- Ein wegen eines anderen Players gestoppter Stream zeigt sein frisches Poster und das normale Play-Symbol mit einem dezenten Texthinweis darunter, ohne Abdunkelung oder zusätzlichen Aktivierungsbutton.
- Die Meldung mit „Weiter ansehen“ nach 15 Minuten bleibt unverändert.
- Vor der Migration wird die Core-Datenbank gesichert. Playerseiten werden beim Start aktualisiert. Kanal- und DVR-Einstellungen bleiben erhalten.

Das GHCR-Image wird für `linux/amd64` und `linux/arm64` nativ gebaut und auf beiden Architekturen vor der Veröffentlichung getestet. Das Installations-ZIP gilt für beide. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev18`
