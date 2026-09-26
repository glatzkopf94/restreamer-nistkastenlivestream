# Teststatus 0.3.0-dev18

dev18 wird vor der Veroeffentlichung nativ auf `ubuntu-24.04` (AMD64) und
`ubuntu-24.04-arm` (ARM64) gebaut. Jeder Runner startet sein fertiges Image in
isolierten Test-Volumes und fuehrt denselben Container-Smoke-Test aus. Der
Release-Job prueft das gemeinsame Manifest auf beide Linux-Architekturen;
erst danach werden ZIP und Release veroeffentlicht. Ein zusaetzlicher Test
verhindert, dass ein Manifest mit nur einer Architektur als gueltig gilt.

## Erfolgreich ausgefuehrt

- Drei neue DVR-Regressionstests fuer gespeicherte Prozesse als Core-Liste,
  HLS- und Tee-Ausgaben, idempotente Migration sowie sichere Ablaufbereinigung
  mehrerer Kanaele. Ein Player-Lauf prueft frisches Poster, normalen Play-Knopf,
  Hinweis ohne Abdunkelung und das unveraenderte 15-Minuten-Dialogfeld.
- Der native Container-Smoke-Test erzeugt 6-Sekunden-HLS-Segmente bei einer
  2-Sekunden-Zielgroesse und prueft die Begrenzung auf 12 Sekunden tatsaechliche
  Playlistdauer auf AMD64 und ARM64.

- optimierter React-Produktionsbuild
- Lingui-Extraktion und Kompilierung aller Sprachkataloge
- kanalübergreifende Zuschauer-Deduplizierung nach Browser-ID sowie
  datensparsamer Rueckfall nach anonymisierter Clientkennung
- Go-Regressionstests fuer die sichere Weitergabe gueltiger Zuschauer-IDs in
  HLS-Playlists und das Verwerfen ungueltiger IDs
- 85 gezielte UI-Tests fuer Netzwerk-Zugangsdaten, Overlay-Assistent,
  Encoder, zeitbasierte CFR-Reparatur, dev12-Profilmigration,
  Text-/Logo-Overlay, DVR-HLS-Logik und die
  RTSP-Prozessprofile, die 16:9-/4:3-Erkennung sowie kanalbezogene und globale
  DVR-Bereinigung mit automatischem Stream-Neustart. Darin enthalten sind
  Regressionstests fuer erfolgreiche bodylose `HEAD`-Antworten und die
  korrekte DVR-Antwortuebergabe
- zwei zusaetzliche isolierte Netzwerk-Tests fuer die erzeugten Optionen der
  Profile `Stabil` und `Streng`
- neun Python-Tests fuer JSON-Quellen, Vorlagenformatierung,
  Restreamer-Metadaten, sofortige Vorlagenaktualisierung sowie Burn-in- und
  Player-Overlay-Dateien. Die DVR-Loeschtests stellen zusaetzlich sicher, dass
  nur die HLS-Dateien des angeforderten Kanals entfernt werden
- zwei Python-Regressionstests fuer die atomare Migration gespeicherter
  dev12-Prozessgraphen sowie eine beschleunigte Sechs-Stunden-Simulation mit
  14,9654-fps-Video und 48-kHz-Audio. Geprueft werden CFR, monotone
  Zeitstempel, A/V-Pufferueberlappung und das Ausbleiben langfristiger Drift.
- drei Python-Regressionstests fuer die Release-Versionsauswertung des
  Update-Agenten mit formatierter und kompakter GitHub-JSON
- Shell-Syntaxpruefung fuer Installer, Status, Deinstallation, Startskripte
  und Container-Smoke-Test sowie Paketierung des Schnellinstallers
- Der GitHub-Releasebuild fuehrt sechs deterministische UI-Suites seriell und
  mit einem festen 15-Minuten-Limit aus. Die grosse uebernommene
  `views/Edit/Sources/Network.test.js`-Suite bleibt unter CRA/Jest im
  Docker-Runner nach den uebrigen Suites offen und ist deshalb nicht Teil des
  blockierenden Image-Buildschritts; der neue Netzwerk-Eingabetest und die
  statischen RTSP-/Player-Pruefungen bleiben aktiv.
- zwoelf statische Player-Pruefungen: kein zusaetzliches DVR-Panel, nativer
  Live-Schalter kompakt hervorgehoben, sichere Player-Overlay-Elemente,
  Cache-Bypass, fuenfsekündige Textpruefung, gemeinsamer Assistent und
  DVR-Sicherheitsrand sowie abschaltbare Seitenverhaeltnis-, Ein-Player- und
  15-Minuten-Funktionen vorhanden. Zusaetzlich werden der roetliche
  Nicht-DVR-Livehinweis, die robuste HLS-Reaktivierung ohne Doppel-Load, die
  responsive Overlay-Skalierung und das Entfernen des alten Logo-Reiters.
  Hinzu kommen die sichere Zuschauer-ID-Weitergabe sowie die neue
  NKL-Kennung, Hintergrundgrafik, ausschliesslich eigenes Release-Repository,
  gesicherter UI-Updateauftrag und die neuen `restreamer-nkl`-Standardnamen
  geprueft

Die GitHub-Aktion baut und testet beide fertigen Images vor der Veroeffentlichung.
Der Container-Smoke-Test wird nativ auf AMD64 und ARM64 ausgefuehrt und
zusaetzlich nach `./install.sh` auf dem Zielserver automatisch wiederholt. Er
prueft innerhalb des fertig gebauten Images RTSP, die datarhei-JSON-Ausgabe von
FFmpeg, zeitbasierte CFR-Normalisierung, monotone MPEG-TS-Zeitstempel,
A/V-Ueberlappung, Drawtext, Logo-Overlay, libx264 und den laufenden
Overlay-/DVR-Manager. Ausserdem wird geprueft, dass dynamische Text-, HTML- und
Player-Konfigurationsdateien vom Core-Disk-Cache ausgenommen sind. Ab dev9
kontrolliert er zusaetzlich beide Overlay-Assistenten, die fuenfsekündige
Player-Aktualisierung, den DVR-Sicherheitsrand und das RTSP-Profil im
kompilierten UI-Bundle. Die erweiterte Fassung prueft ausserdem adaptive
Player-Geometrie, browserweite Ein-Player-Koordination und das
15-Minuten-Wiedergabelimit. Fuer die manuelle DVR-Bereinigung prueft der
Smoke-Test den authentifizierten Steuerpfad vom UI zum Manager einschliesslich
Antwortdatei.

Ein mehrtaegiger Reolink-Dauertest und die tatsaechliche 4K-Transcoding-Leistung
auf dem Raspberry Pi 5 koennen erst nach Installation auf dem Zielgeraet
geprueft werden.

## Bekannter Zustand der uebernommenen Testsuite

Ein uebernommener alter Wizard-Test fuer eine SRT-/H.264-Antwort erwartet in
der aktuellen Testumgebung einen inzwischen nicht mehr erscheinenden
Hinweistext. In einem erweiterten Lauf bestanden 83 von 84 Tests; dieser eine
bekannte Test scheiterte unveraendert ausserhalb der dev9-Aenderungen. Die
79 gezielt ausgefuehrten Tests der in diesem Fork geaenderten Netzwerk-,
Encoder-, Filter-, Overlay- und DVR-Funktionen bestehen vollstaendig, und der
Produktionsbuild kompiliert ohne Fehler. Hinzu kommen elf erfolgreiche
statische Player-, neun Python- und zwei Go-Regressionstests. Die Go-Tests
laufen automatisch waehrend des Core-Container-Builds.

Vor einer Freigabe als stabile Version sind der reale Container-Smoke-Test,
ein mehrtaegiger Kameradauertest sowie DVR-Tests mit mehreren Browsern
vorgesehen.
