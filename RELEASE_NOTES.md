# NKL 1.3 Beta / 0.3.0-dev13

Dieses Release behebt die nach langer Laufzeit wachsende A/V-Verschiebung der
dev12-Timestamp-Reparatur. `setpts=N/(fps*TB)` wurde durch die zeitbasierte
CFR-Normalisierung `fps=fps=<Wert>:start_time=0:round=near` ersetzt. Der
gewaehlte FPS-Wert bleibt dynamisch; Frames werden anhand der realen
Eingangszeitstempel verworfen oder dupliziert.

Bereits gespeicherte dev12-Graphen werden vor dem Core-Start atomar migriert.
Die Konfiguration wird gesichert und sensible Kamera-URLs werden nicht
protokolliert. Audio-Copy und AAC-Neucodierung bleiben unveraendert; dev13 setzt
weder einen festen Audio-Offset noch einen erzwungenen Audiofilter.

DVR-Historie und Einstellungen bleiben erhalten: `diskfs`, Zwei-Sekunden-
Segmente, frei konfigurierbare 1 bis 168 Stunden, `dvr.hours`, `listSize` und
die Aufraeumlogik wurden nicht verkuerzt oder abgeschaltet.

Das fertige AMD64-Image lautet:

`ghcr.io/glatzkopf94/restreamer-nistkastenlivestream:0.3.0-dev13`

Das beigefuegte ZIP enthaelt den Pull-Installer; auf dem Zielserver ist kein
lokaler Build erforderlich.
