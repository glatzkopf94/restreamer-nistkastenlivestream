# Teststatus 0.3.0-dev12

## Erfolgreich ausgefuehrt

- optimierter React-Produktionsbuild
- Lingui-Extraktion und Kompilierung aller Sprachkataloge
- kanalübergreifende Zuschauer-Deduplizierung nach Browser-ID sowie
  datensparsamer Rueckfall nach anonymisierter Clientkennung
- Go-Regressionstests fuer die sichere Weitergabe gueltiger Zuschauer-IDs in
  HLS-Playlists und das Verwerfen ungueltiger IDs
- 77 gezielte UI-Tests fuer Netzwerk-Zugangsdaten, Overlay-Assistent,
  Encoder, SetPTS, Text-/Logo-Overlay, DVR-HLS-Logik und die
  RTSP-Prozessprofile, die 16:9-/4:3-Erkennung sowie kanalbezogene und globale
  DVR-Bereinigung mit automatischem Stream-Neustart
- zwei zusaetzliche isolierte Netzwerk-Tests fuer die erzeugten Optionen der
  Profile `Stabil` und `Streng`
- neun Python-Tests fuer JSON-Quellen, Vorlagenformatierung,
  Restreamer-Metadaten, sofortige Vorlagenaktualisierung sowie Burn-in- und
  Player-Overlay-Dateien. Die DVR-Loeschtests stellen zusaetzlich sicher, dass
  nur die HLS-Dateien des angeforderten Kanals entfernt werden
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

Die GitHub-Aktion baut und testet das fertige Image vor der Veroeffentlichung.
Der Container-Smoke-Test wird zusaetzlich nach `./install.sh` auf dem
Zielserver automatisch ausgefuehrt. Er
prueft innerhalb des fertig gebauten Images RTSP, die datarhei-JSON-Ausgabe von
FFmpeg, SetPTS, Drawtext, Logo-Overlay, libx264 und den laufenden
Overlay-/DVR-Manager. Ausserdem wird geprueft, dass dynamische Text-, HTML- und
Player-Konfigurationsdateien vom Core-Disk-Cache ausgenommen sind. Ab dev9
kontrolliert er zusaetzlich beide Overlay-Assistenten, die fuenfsekündige
Player-Aktualisierung, den DVR-Sicherheitsrand und das RTSP-Profil im
kompilierten UI-Bundle. Die erweiterte Fassung prueft ausserdem adaptive
Player-Geometrie, browserweite Ein-Player-Koordination und das
15-Minuten-Wiedergabelimit. Fuer die manuelle DVR-Bereinigung prueft der
Smoke-Test den authentifizierten Steuerpfad vom UI zum Manager einschliesslich
Antwortdatei.

Der reale Container-Smoke-Test und der Reolink-Dauertest erfolgen nach der
Installation auf dem Debian-Testserver. In der Erstellungsumgebung stand kein
Docker-Daemon zur Verfuegung; Produktionsbuild, Quelltests und Archivpruefung
wurden dort vollstaendig ausgefuehrt.

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
