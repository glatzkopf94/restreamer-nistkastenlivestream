# NKL 1.4 Beta / 0.3.0-dev20

- Beim Start werden die gespeicherten Playerquellen und DVR-Angaben mit der Kanal-Konfiguration abgeglichen. Veraltete memfs-/Vorschau-Verweise werden korrigiert, ohne Playerseiten erneut speichern zu müssen. Eigene Poster, Farben und Overlays bleiben erhalten.
- Auch ältere DVR-Prozesse erhalten die HLS-Neustartmarkierung für den Zeitstempelwechsel zwischen vorhandenen und neuen Segmenten.
- Nicht gestartete Player laden keine Playlist vor. Aktivierte Player versuchen nach vorübergehenden Netzwerk-/Playlistfehlern bis zu zwölfmal im Abstand von fünf Sekunden erneut zu verbinden. Das Aktivieren eines anderen Players oder die 15-Minuten-Sperre beendet die Wiederverbindung.
- Die Einstellungen unter „Playerseite“ passen sich dem verfügbaren Platz an. Lange Kanalnamen umbrechen; auf schmalen Bildschirmen stehen die Registerkarten über dem Formular.
- Die Cache-Sperren und die DVR-Haltezeit aus dev19 bleiben enthalten.

Das GHCR-Image wird für `linux/amd64` und `linux/arm64` nativ gebaut und auf beiden Architekturen vor der Veröffentlichung getestet. Das Installations-ZIP gilt für beide. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev20`
