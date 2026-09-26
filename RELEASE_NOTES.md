# NKL 1.4 Beta / 0.3.0-dev17

- Player ohne DVR zeigen nur den rechten Live-Schalter mit rotem Punkt. Die doppelte linke Anzeige entfällt.
- Das bisherige Zahnrad des leeren Lizenz-Menüs wird im öffentlichen Player nicht mehr eingebunden.
- Der Installer prüft das wirklich verwendete Datenvolume und startet die systemd-Pfadüberwachung nach einer Neuverdrahtung neu. Der Update-Agent lehnt eine veraltete oder falsche Bindung an Container und Datenvolume mit einer eindeutigen Fehlermeldung ab.
- Vorhandene veröffentlichte NKL-Playerseiten und deren CSS werden beim Containerstart gezielt aktualisiert. Kanalkonfiguration und DVR-Aufzeichnungen bleiben erhalten.

Das GHCR-Image wird für `linux/amd64` und `linux/arm64` nativ gebaut und auf beiden Architekturen vor der Veröffentlichung getestet. Das Installations-ZIP gilt für beide. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev17`
