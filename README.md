# Coast Forge Importer – v0.1.5

Foundry VTT v13 / dnd5e 5.x (Referenz 5.2.5), D&D 2024. Midi-QOL und DAE können installiert bleiben. Die Automatisierung einzelner importierter Mechaniken ist jeweils in Foundry zu prüfen.

## Neu in v0.1.2 – individuelle Item-Icons

- In der Importvorschau hat jedes gültige Item einen eigenen Button **Bild wählen** mit 48 × 48 px Vorschau.
- Der native Foundry-v13-FilePicker (`foundry.applications.apps.FilePicker.implementation`) öffnet sich für Bilddateien. Die konfigurierte Implementierung wird verwendet, damit Hosting-spezifische Anpassungen möglich bleiben.
- Der gewählte Asset-Pfad wird unverändert in `img` des zugehörigen Items übernommen, aber erst nach Bestätigung der Importvorschau. Reset stellt das ursprünglich aus der JSON bzw. dem Standardbild stammende Icon wieder her.
- Ohne Auswahl bleibt das bisherige Icon erhalten. Abbrechen erstellt keine Items; ein bereits durch den FilePicker hochgeladenes Asset kann unabhängig davon in der Asset Library verbleiben.
- Funktioniert im bestehenden Importpfad für Welt-Items und Actors. Duplikate werden im Standardmodus übersprungen; seit v0.1.4 sind Updates optional.
- Die bisherige JSON-Schema-Version 1 und die Activity-/Active-Effect-Verarbeitung bleiben unverändert. Die Bilder selbst müssen nicht in die JSON eingebettet werden.
- Historischer Funktionsumfang von v0.1.2; neue Funktionen siehe unten.

## Installation und Update (The Forge / GitHub)

Repository: https://github.com/Lemurensohn/coast-forge-importer

Manifest: https://github.com/Lemurensohn/coast-forge-importer/releases/latest/download/module.json

1. Bestehende Welt sichern. Die Version zunächst in einer Testwelt prüfen.
2. Inhalt von `coast-forge-importer-github-source-v0.1.5.zip` in das vorhandene GitHub-Repository übernehmen (Dateien zusammenführen/überschreiben, nicht das Repository löschen). Vorhandene ältere Tests, Beispiele, IMPORT_FORMAT.md und QA-Dokumentation beibehalten. `module.json` gehört ins Repository-Stammverzeichnis.
3. GitHub-Release mit neuem Tag `v0.1.5` erstellen. Die separate `module.json` und `coast-forge-importer-v0.1.5.zip` als Release-Assets anhängen, dann veröffentlichen. Die Release-ZIP nicht erneut komprimieren: das Manifest befindet sich bereits im Archiv-Stammverzeichnis.
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

## Grant Items (v0.1.3)
Import `examples/30-the-golden-ledger-auto.json` into World Items. Each linked item has a unique `ref`. A parent declares `grantLinks: [{"advancementId":"GoldenLedger0001","refs":["golden-ledger-merchant-eye"]}]` referring to an existing empty native ItemGrant in its system.advancement. Import creates all documents, then links their actual UUIDs. Old JSON remains supported. Linked batches are not imported directly onto actors. Existing items from older imports without matching local refs must be renamed or removed before importing a linked batch. The importer does not delete or overwrite unrelated documents. Run `node --test tests/*.test.mjs` for local mock tests.

## v0.1.4 — Compendium References und bestehende Items

### Einmalige Einrichtung

Im ersten Importdialog unter **Compendium-Referenzen** drei optionale Quellen auswählen:

- **Condition Effects (Items)**: dein Item-Compendium mit je einem Feature, das den tatsächlichen eingebetteten Active Effect enthält.
- **Condition Journals**: dein JournalEntry-Compendium oder ein einzelnes World Journal mit gleichnamigen Journal Entries bzw. Pages. Explizite Condition-Referenzen benötigen diese Auswahl; kein Klartext-Fallback.
- **External Grant Items**: mehrere bevorzugte Item-Compendiums für schon existierende Features, Spells usw. (seit v0.1.7 auch Beschreibungslinks).

Auswahl wird pro Welt nach Bestätigung der Vorschau gespeichert. Für Condition Effects und Condition Journals gilt weiterhin die explizit ausgewählte Quelle. Externe Item-Referenzen verwenden seit v0.1.7 bevorzugte Packs und bei keinem Treffer eine Suche in den übrigen Item-Packs. Fehlende oder mehrdeutige Treffer brechen den Import vor den Item-Schreibvorgängen ab. Bei mehreren Active Effects im Feature `effectName` angeben. Die Quellen werden nicht geändert.

### Importformat (weiterhin schemaVersion 1)

Im Item mit einer Activity mit expliziter 16-stelliger `_id`:

```json
"effectRefs": [{"name":"Drenched","activityId":"DrenchingSlam001","onSave":false}]
```

`effectName` und `pack` (vollständige Compendium-Collection-ID) sind optional. `onSave:false` bedeutet bei Save-Activities auf Fehlschlag; bei Attack-Activities prüft Midi-QOL den Treffer (abhängig von dessen Einstellungen). Der Effekt wird kopiert, mit neuer ID auf die Activity verdrahtet und nicht als passiver Transfer-Effekt angelegt. Der eigene Timer/DAE-Flags werden übernommen, aber nicht erfunden oder neu eingerichtet. Falls ein Makro oder andere Referenzen in der Quelle stehen, müssen diese im Ziel verfügbar sein. Ein Effekt mit Standard-SVG erhält das Artwork des Quell-Features; ein individuelles Effect-Icon bleibt erhalten. Spätere Änderungen im Quell-Compendium ändern bereits importierte Kopien nicht automatisch.

In `description` kann `[[condition:Drenched]]` verwendet werden. Der Resolver setzt in der gewählten Journal-Quelle den echten `@UUID[...]{Drenched}`-Verweis ein. Native D&D5e-References und übrige Beschreibung bleiben unverändert. Darstellung und Spielerberechtigungen separat prüfen.

Externe ItemGrant-Referenzen: `compendiumGrants: [{"advancementId":"GoldenLedger0001","items":[{"name":"Drenched","optional":false}]}]`. Die native Advancement-ID muss auf ein vorhandenes, zunächst leeres ItemGrant zeigen. Optional `pack` pro Item. Lokale `grantLinks` und externe `compendiumGrants` dürfen im selben Item unterschiedliche Advancement-IDs verwenden; nicht dieselbe ID. Nur World-Item-Importe.

### Existing Items

- **Skip Existing** (Standard): bisheriges Verhalten. Existierende Items werden nicht für neue Icons überschrieben; lokale Grants können wie bisher auf passende bestehende Items verweisen.
- **Update Icons Only**: vorhandenes Icon als Startbild; nur eine neue, nicht zurückgesetzte Auswahl wird gespeichert. Neue Items werden wie gewohnt erstellt. Bei bereits bestehenden Parents werden Grant-Verknüpfungen nur geprüft, nicht geändert.
- **Update Existing Items**: nur World Items im ausgewählten Zielordner (Standard: Coast Forge Imports). Die komplette JSON ersetzt die nativen Systemdaten und eingebetteten Effects (einschließlich eventuell manuell hinzugefügter); Item-UUID, Ordner, Berechtigungen, andere Flag-Scopes und bestehendes Icon bleiben soweit vorgesehen erhalten. Activities/Effects können neue IDs erhalten. Bei verknüpften Batches müssen vorhandene lokale Refs übereinstimmen. Alte Actor-Kopien und deren Ressourcen bleiben unverändert. Vollupdate ist keine Transaktion; bei Fehler können Teilschritte gespeichert bleiben. Welt sichern und zuerst in Testwelt prüfen.

### Live-Test v0.1.4

1. `examples/33-drenching-slam-compendium-TEST.json` laden. Condition Effects und Condition Journals einstellen; beide Einträge `Drenched` nennen. Feature muss genau einen Active Effect enthalten.
2. Neues Item importieren oder bei bereits existierendem Drenching Slam ausdrücklich **Update Existing Items** wählen (Testwelt). Item-Icon separat auswählbar. Activity, eingebetteten Effect, dessen Bild/Flags und Journal-Link kontrollieren. Bei Treffer und Fehlschlag sowie Ablauf über zwei eigene Zugbeginne testen.
3. `examples/30-the-golden-ledger-v2.json` in bereinigten Testordner importieren, sechs Icons wählen, fünf Grant-Links prüfen. Dann erneut mit Skip bzw. Update Icons Only importieren. Für Full Update eine Testkopie ändern und UUID, Systemdaten, Activities, Effects sowie Grant Links vergleichen.
4. `examples/29-legendary-cantrips-TEST.json` erneut in Testwelt importieren: alter Einzel-/Massenimport und Actor-Import dürfen nicht regressieren.

Lokale Testausführung: `node --test tests/*.test.mjs` — 47/47 Mock-Tests bestanden, darunter die 21 bisherigen. Kein echter Foundry-Server oder Midi-QOL-Workflow in diesen Tests. Die historische 92-Test-Suite ist nicht enthalten.

## v0.1.5 — Journal-Link-Fix

Journal-Quellen werden anhand des Dokumenttyps (inklusive Metadaten-Fallback) angeboten. World Journals können direkt ausgewählt werden. Innerhalb der ausgewählten Quelle sucht der Resolver nach einem exakten Journal-Entry-Namen oder einer exakten Page; der Entry hat vor seiner eigenen gleichnamigen Page Vorrang. Mehrdeutige oder fehlende Treffer blockieren den Import. `[[condition:Name]]` ist eine echte Link-Anforderung und wird nicht mehr still zu Klartext. `effectRefs` bleibt unabhängig davon und kopiert nur die technische Effect-Konfiguration. Ohne `effectRefs` entsteht nur der Journal-Link. Bestehende JSONs ohne Condition-Platzhalter benötigen keine Journal-Auswahl. Die alte Drenching-Slam-Testdatei funktioniert unverändert, sofern beide Quellen ausgewählt sind. Bei existierenden Items Skip beachten. 57/57 lokale Mock-Tests bestanden; echte UI und Link-Darstellung in Foundry offen.

## v0.1.6 – Importfenster

Der erste Importdialog hat einen eigenen vertikalen Scrollbereich (65vh), ein kleineres JSON-Textfeld und eine veränderbare Fenstergröße. Die drei Quellenfelder befinden sich unter Compendium-Referenzen. Importlogik unverändert.

## v0.1.7 — Zielordner, mehrere externe Quellen und Beschreibungslinks

- Ziel: bestehende Item-Ordner und Unterordner (nach vollständigem Pfad), Standardordner oder Actor. Die Duplikatprüfung und Updates gelten ausschließlich im gewählten Ziel. Kein automatisches Verschieben bereits vorhandener Dokumente. Verknüpfte Advancements und Vollupdates weiterhin nur World Items.
- External Grant Items / Spell Links: In v0.1.7 Strg+Klick für mehrere bevorzugte Packs; ab v0.1.8 Checkboxen mit Suche. Die Auswahl wird als JSON-Array im bisherigen String-Setting gespeichert; alte einzelne Pack-ID bleibt lesbar. Keine Auswahl erforderlich, wenn die JSON keine externen Referenzen enthält.
- Suche: alle bevorzugten Packs als gemeinsame Prioritätsstufe. Wenn dort kein Treffer gefunden wird, andere Item-Packs durchsuchen. Name exakt (gerades/typografisches Apostroph gleichwertig); bei `type` zusätzlich nativen Item-Typ prüfen. `pack` pro Grant-Referenz beschränkt Suche strikt auf diesen Pack. Bei mehreren passenden UUIDs Fehlermeldung mit Quellen; einzelne bevorzugte Quelle oder expliziten Pack wählen. Keine automatische 2014/2024-Auswahl und kein interaktiver Konflikt-Dialog in dieser Version. Index und geladene Dokumente pro Import cachen.
- `[[spell:Counterspell]]`, `[[feature:Innate Sorcery]]` und `[[item:Item Name]]` in Item-Descriptions bzw. explizit in Effect-Descriptions werden zu `@UUID[...]`-Links für vorhandene Compendium-Dokumente. Optional `[[spell:Counterspell|world.spells]]` für eine feste Quelle. Wenn ein gleichnamiger passender Spell/Item im Batch bereits als externer Grant aufgelöst wurde, denselben UUID-Link verwenden. Mehrere passende Grant-UUIDs ohne explizite Quelle sind Fehler. Keine automatische Verlinkung unmarkierter Wörter. Neue lokale Items innerhalb desselben Batches werden weiterhin per `grantLinks` verknüpft; freie Description-Links auf diese neuen lokalen Items sind nicht Teil dieses Releases.
- Bei Spell Grants `{"name":"Counterspell","type":"spell","optional":false}` nutzen; optional `pack`. Der bisherige `compendiumGrants`-Aufbau bleibt kompatibel.
- Neue Subclass-JSONs: jedes Feature beginnt mit `Level N: Feature Name`, enthält `system.requirements` mit Klasse/Level und `system.prerequisites.level`. Grant-Advancement-Level muss übereinstimmen. Das Required-Level-Feld ist eine generische Voraussetzung, keine eigene Klassenlevel-Automation. Anzeige im Details-Reiter separat prüfen.
- Testfixture `examples/35-creators-sorcery-v2-TEST.json`: 8 Items, 7 lokale Feature Grants, 14 externe Spell Grants, getrennte Level; Beschreibungslinks und Feature-Level ergänzt. Die bisherigen Regeln/Activities/Effects bleiben bis auf Links in Texten unverändert.
- Lokale Node-Mock-Tests: 75/75, 57 bisherige plus 18 zusätzliche. Foundry-Livetests (Mehrfachauswahl, tatsächliche Link-Darstellung und Level-Feld, verknüpfte Updates) offen. Die historische 92er-Suite ist nicht verfügbar.

## v0.1.8 — Compendium-Auswahl

- Breiteres Importfenster und größere, scrollbar begrenzte Liste mit Checkboxen für External Grant Items / Spell Links.
- Suche nach Name oder Collection-ID, Anzahl ausgewählter Quellen und Auswahl leeren. Filter ändern keine gesetzten Häkchen. Kein Strg+Klick mehr erforderlich.
- Speicherung und Resolver unverändert; v0.1.7-Auswahl bleibt erhalten. QA v2.9 und bestehendes Importformat unverändert.
- Live-Test: gespeicherte Häkchen prüfen, per Suche eine weitere Quelle anhaken, Suche löschen, Vorschau bestätigen und erneut öffnen. Bei geringer Fensterhöhe äußeren Dialogscroll nutzen.
