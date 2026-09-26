# NKL 1.4 Beta / 0.3.0-dev19

- Die DVR-Migration liest jetzt die tatsächlich gespeicherten Core-Prozesskonfigurationen. Dadurch gilt die globale Haltezeit auch für bestehende Kanäle. Abgelaufene, nicht mehr referenzierte Segmente werden regelmäßig gelöscht.
- Automatisch gestoppte Player kehren zum normalen Poster mit Play-Symbol zurück. Die Quelle wird ohne Vorladen bereitgestellt und kann über Play oder das Poster wieder gestartet werden.
- Playerseiten, Konfigurationen, JavaScript und CSS werden mit HTTP-Headern gegen Caching ausgeliefert. Versionierte Dateiverweise aktualisieren vorhandene Player-Abhängigkeiten beim nächsten Laden.
- Die Meldung mit „Weiter ansehen“ nach 15 Minuten bleibt unverändert.
- Vor der Migration wird die Core-Datenbank gesichert. Playerseiten werden beim Start aktualisiert. Kanal- und DVR-Einstellungen bleiben erhalten.

Das GHCR-Image wird für `linux/amd64` und `linux/arm64` nativ gebaut und auf beiden Architekturen vor der Veröffentlichung getestet. Das Installations-ZIP gilt für beide. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev19`
