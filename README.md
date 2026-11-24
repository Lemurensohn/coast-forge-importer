# Coast Forge Importer – v0.1.2

Foundry VTT v13 / dnd5e 5.x (Referenz 5.2.5), D&D 2024. Midi-QOL und DAE können installiert bleiben. Die Automatisierung einzelner importierter Mechaniken ist jeweils in Foundry zu prüfen.

## Neu in v0.1.2 – individuelle Item-Icons

- In der Importvorschau hat jedes gültige Item einen eigenen Button **Bild wählen** mit 48 × 48 px Vorschau.
- Der native Foundry-v13-FilePicker (`foundry.applications.apps.FilePicker.implementation`) öffnet sich für Bilddateien. Die konfigurierte Implementierung wird verwendet, damit Hosting-spezifische Anpassungen möglich bleiben.
- Der gewählte Asset-Pfad wird unverändert in `img` des zugehörigen Items übernommen, aber erst nach Bestätigung der Importvorschau. Reset stellt das ursprünglich aus der JSON bzw. dem Standardbild stammende Icon wieder her.
- Ohne Auswahl bleibt das bisherige Icon erhalten. Abbrechen erstellt keine Items; ein bereits durch den FilePicker hochgeladenes Asset kann unabhängig davon in der Asset Library verbleiben.
- Funktioniert im bestehenden Importpfad für Welt-Items und Actors. Duplikate werden weiterhin übersprungen, nicht nachträglich aktualisiert.
- Die bisherige JSON-Schema-Version 1 und die Activity-/Active-Effect-Verarbeitung bleiben unverändert. Die Bilder selbst müssen nicht in die JSON eingebettet werden.
- Keine neuen automatisierten ItemGrant-Verknüpfungen, keine neue Effekt-Automation in diesem Release.

## Installation und Update (The Forge / GitHub)

Repository: https://github.com/Lemurensohn/coast-forge-importer

Manifest: https://github.com/Lemurensohn/coast-forge-importer/releases/latest/download/module.json

1. Bestehende Welt sichern. Die Version zunächst in einer Testwelt prüfen.
2. Inhalt von `coast-forge-importer-github-source-v0.1.2.zip` in das vorhandene GitHub-Repository übernehmen (Dateien zusammenführen/überschreiben, nicht das Repository löschen). Vorhandene ältere Tests, Beispiele, IMPORT_FORMAT.md und QA-Dokumentation beibehalten. `module.json` gehört ins Repository-Stammverzeichnis.
3. GitHub-Release mit neuem Tag `v0.1.2` erstellen. Die separate `module.json` und `coast-forge-importer-v0.1.2.zip` als Release-Assets anhängen, dann veröffentlichen. Die Release-ZIP nicht erneut komprimieren: das Manifest befindet sich bereits im Archiv-Stammverzeichnis.
4. Auf The Forge das Custom-Modul aktualisieren. Wenn der automatische Update-Check die Version noch nicht erkennt, dasselbe Manifest für den Update-/Installationsvorgang verwenden. Welt neu starten bzw. Browser neu laden und Modulversion prüfen.
5. In Foundry als GM im Item-Verzeichnis **Coast Forge Import** öffnen. Alternativ im Script-Makro: `game.modules.get("coast-forge-importer").api.open();`
6. JSON/TXT auswählen oder JSON-Text einfügen, Ziel wählen und auf **Vorschau prüfen** klicken. Pro Item optional **Bild wählen**, Bild auswählen, Vorschau kontrollieren und anschließend **Importieren**.
7. Wenn die gewünschte Datei noch nicht in der Forge Assets Library liegt und der FilePicker keinen Upload zulässt, zuerst über die Assets Library hochladen und dann im FilePicker auswählen.

## Bestehende Fähigkeiten (v0.1.1)

- GM-Rechte, Mehrfachimport (maximal 100 Items), Zielordner bzw. Actor, Duplikat-Vermeidung anhand von Name und Typ.
- Native D&D5e-Items/Activities/Effects. Feats, Features, Maneuvers, Spells, Waffen, Ausrüstung und weitere bisher unterstützte Typen.
- Vorschau mit Datenmodell-Prüfung, Warnungen und Importergebnis.
- Stabile Registrierung des Item-Directory-Buttons über die bestehenden Foundry-v13-Render-Hooks und den Ready-Hook.
- Das Modul führt kein importiertes JavaScript aus. Nur vertrauenswürdige JSON-Dateien importieren: enthaltene Effect-/Makro-Flags können von anderen Modulen verarbeitet werden.
- Unbestätigte Mechaniken, z. B. dynamische ItemGrant-Verknüpfungen, DAE-Timer und zusätzliche Midi-QOL-Automation, sind nicht automatisch implementiert.

## Tests

`node --test tests/*.test.mjs`

Die 11 neuen Tests für Icon-Auswahl und simulierte Importabläufe bestanden lokal. Darunter vier unterschiedliche Icons für die vier Cantrips, Reset, Abbruch, Actor- und Weltimport, Duplikat-Schutz, unveränderte Activities/Effects/Flags und 100 unabhängige Icon-Auswahlen. Diese Tests simulieren Foundry-APIs; der native FilePicker und das tatsächliche Rendering/Hosting-Verhalten müssen live geprüft werden. Die historische 92-Test-QA-Suite wurde nicht erneut ausgeführt. Der verbindliche QA-Standard v2.4 bleibt bestehen.

### Live-Test

In einer Testwelt die mitgelieferte Datei `examples/29-legendary-cantrips-TEST.json` laden. Vier verschiedene Bilder auswählen, eines zurücksetzen und neu auswählen. Importieren und das Icon jedes erstellten Spells kontrollieren. Bestehen die Items im Ziel bereits, diese für den Test in der Testwelt entfernen oder ein anderes Importziel verwenden; bestehende Items werden nicht überschrieben.
