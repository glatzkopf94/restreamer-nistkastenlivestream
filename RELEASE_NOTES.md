# NKL 1.4 Beta / 0.3.0-dev16

- Bei mehreren eingebetteten Playern erscheint „Ein anderer Stream wurde aktiviert“ nur in zuvor gestarteten Playern. Noch nicht gestartete Player behalten Poster und Play-Schaltfläche.
- Der rote LIVE-Hinweis in Playern ohne DVR ist zentriert.
- DVR-Player erhalten kleine weiße Zeitmarker im Abstand von 30 Minuten mit lokaler Uhrzeit. Beim Verschieben der Zeitleiste erscheint die Uhrzeit des ausgewählten Streamsegments statt einer negativen Zeitdifferenz. Grundlage ist `EXT-X-PROGRAM-DATE-TIME` aus der HLS-Wiedergabeliste.
- Beim Start werden vorhandene veröffentlichte NKL-Playerseiten und deren CSS gezielt aktualisiert. Kanalkonfiguration, Volumes und DVR-Aufzeichnungen bleiben erhalten.

Das GHCR-Image wird für `linux/amd64` und `linux/arm64` nativ gebaut und auf beiden Architekturen vor der Veröffentlichung getestet. Das Installations-ZIP gilt für beide. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev16`
