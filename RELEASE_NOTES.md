# NKL 1.4 Beta / 0.3.0-dev22

Behebt lange Wartezeiten und HTTP 504 beim Speichern eines Players nach dem Löschen von DVR-Inhalten. Die Prozessaktualisierung wartete auf wiederholte vollständige Verzeichnisdurchläufe der Bereinigung.

- Ein gemeinsamer Dateiverzeichnisdurchlauf je Bereinigungsrunde.
- Reine Löschregeln lösen keine periodischen Verzeichnisdurchläufe mehr aus.
- Suchmuster werden einmal pro Regel kompiliert.
- Bereinigungsregeln eines Kanals werden gemeinsam registriert.
- DVR-Haltezeiten und gezielte Löschung bleiben aktiv; Playerdateien bleiben geschützt.

Verfügbar für linux/amd64 und linux/arm64. Keine Zeitrafferfunktion in diesem Release.

Validierung: Go-Tests für Bereinigung, Prozessaktualisierung, Stop und Neustart; native Container-Smoke-Tests für beide Architekturen im Release-Workflow.
