# NKL 1.4 Beta / 0.3.0-dev21

- Dauerhafter Fix für verschwundene Playerseiten nach einem Container-/Core-Neustart: Herunterfahren entfernt nur die Bereinigungsregeln, ohne Dateien wie bei einer Kanallöschung zu löschen. DVR-Aufzeichnungen bleiben beim Neustart erhalten.
- Neue und gespeicherte Kanalregeln bereinigen ausschließlich HLS-Mediendateien. Die alte breite UUID-Regel, die auch Player-HTML erfasste, wird vor dem Core-Start mit Datenbanksicherung migriert. Die laufende DVR-Bereinigung bleibt aktiv.
- Bereits fehlende generierte Playerseiten werden beim Start aus vorhandener config.js und gespeicherten Kanalmetadaten wiederhergestellt. Bestehende Seiten, eigene Poster und Player-Einstellungen bleiben erhalten. Das deckt auch den Übergang ab, wenn die alte Version beim Update noch HTML löscht.
- Native Image-Tests prüfen auf AMD64 und ARM64 die Reparatur einer alten Installation, zwei echte Container-Neustarts und die weiterhin funktionierende Medienbereinigung beim expliziten Löschen eines Kanals.

Das Installations-ZIP gilt für beide Architekturen. Auf einem Raspberry Pi 5 ist ein 64-Bit-System erforderlich.

Image: `ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev21`
