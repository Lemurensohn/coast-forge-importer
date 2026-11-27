# Coast Forge Importer – v0.1.13

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
2. Inhalt von `coast-forge-importer-github-source-v0.1.13.zip` in das vorhandene GitHub-Repository übernehmen (Dateien zusammenführen/überschreiben, nicht das Repository löschen). Vorhandene ältere Tests, Beispiele, IMPORT_FORMAT.md und QA-Dokumentation beibehalten. `module.json` gehört ins Repository-Stammverzeichnis.
3. GitHub-Release mit neuem Tag `v0.1.13` erstellen. Die separate `module.json` und `coast-forge-importer-v0.1.13.zip` als Release-Assets anhängen, dann veröffentlichen. Die Release-ZIP nicht erneut komprimieren: das Manifest befindet sich bereits im Archiv-Stammverzeichnis.
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

## v0.1.9 — Active-Effect-Icons

- Normale Effects mit fehlendem oder bekanntem generischem Icon übernehmen das endgültige Item-Icon. Native Status-Effects, Compendium-Kopien und ausdrücklich eigene Bilder behalten ihre Artworks.
- In der Vorschau pro Item **Active Effects – Icons (optional)** aufklappen. Pro Effect: Item-Icon übernehmen, Eigenes Icon (Foundry FilePicker), Original-Icon behalten. Reset stellt die anfängliche Auswahl wieder her. Ohne zusätzliche Auswahl gelten die Standardregeln.
- `Update Icons Only` verwendet die vorhandenen Embedded Effects (nicht die neuen JSON-IDs) und aktualisiert ausschließlich `img` und Icon-Metadaten. Auch alte generische Icons können ohne neue Item-Bildauswahl repariert werden. Individuelle Bilder bleiben geschützt; bei unmarkierten generischen Alt-Icons ist eine individuelle Absicht nicht erkennbar. `Skip Existing` ändert nichts. Vollupdate ordnet alte Bilder über gleiche ID bzw. eindeutigen Namen zu; bei mehrdeutiger Zuordnung manuell prüfen.
- Foundry v13 verwendet nativ `img`; alte `icon`-Eingaben bleiben kompatibel. Ein bewusst gewähltes generisches Bild lässt sich auch in der JSON per `flags: {"coast-forge-importer": {"effectIcon": {"mode": "original"}}}` am Effect schützen.
- Keine Live-Hooks: Änderungen am Item-Icon außerhalb des Importers synchronisieren sich nicht automatisch mit Effects; bereits vorhandene Actor-Kopien werden nicht automatisch aktualisiert. Keine Änderungen an Effektlaufzeiten; QA v2.10 (manuelle Laufzeiten) bleibt verbindlich, erweitert durch QA v2.11. Bestehende Compendium-Timer müssen weiterhin vorab geprüft werden.
- Testdatei: `examples/36-ring-of-sun-v2.json`. Zwei Effects, beide ohne Timer, für Vererbung und eigenes Zenith-Icon geeignet. Node-Tests: `node --test tests/*.test.mjs`; echte Foundry-Darstellung und Midi-QOL-Livetest separat.

## v0.1.10 — Active-Effect-Icon-Hotfix

Die Vorprüfung verwendet eine getrennte Datenkopie. Beim Zuweisen von Effect-Icons werden neue Datenobjekte erzeugt, statt geschützte alte `icon`-Eigenschaften zu löschen. Alle bisherigen Importdateien und QA v2.11 bleiben gültig.

## v0.1.11 — Bulk Spell Scroll Generation

Upload a JSON with `schemaVersion: 1` and a `scrolls` array. `items` remains supported and may be used in the same file. Example:

```json
{
  "schemaVersion": 1,
  "scrolls": [
    {"spell": "Cure Wounds", "scrollLevels": "all"},
    {"spell": "Fireball", "scrollLevels": [3, 5, 9]},
    {"spell": "Goodberry", "scrollLevels": "base"}
  ]
}
```

- `spell`: exact compendium spell name (same resolver as spell grants).
- `scrollLevels`: `"base"` (default), `"all"` (base through level 9; cantrips only level 0), or a list of distinct levels. No automatic interpretation of whether upcasting is meaningful; choose the appropriate levels in the JSON.
- `pack`: optional exact compendium collection ID to resolve an ambiguous name.
- `img`: optional initial scroll artwork. Preview can override it.
- `priceByLevel`: optional object mapping level strings to numeric GP prices, e.g. `{"3": 150, "5": 1500}`. Otherwise use the native template price, which may be unset/zero. No invented market price.
- `followUpActivities`: optional list of exact source activity names that are not initial casts. Such activities do not consume another scroll. To keep them accessible, this scroll has one use but does not auto-destroy. Do not stack such scrolls; delete the spent item manually after the spell. Follow-ups require manual enforcement of the trigger and cast state.

Select official 2024 and/or homebrew spell compendiums in **External Grant Items / Spell Links / Scroll Sources**. Missing/ambiguous spells and invalid requested levels block the preview before item creation. Duplicate expanded names are rejected. The cap is 500 expanded items per scroll import; legacy ordinary `items` limit remains 100. Use normal preview and destination selection. Names contain the exact scroll level to avoid confusing variants. No changes to source spells.

The conversion calls D&D5e 5.2.5 `CONFIG.Item.documentClass.createScrollFromSpell(detachedSpellData, {}, config)` with `dialog:false`, fixed level and values from `CONFIG.DND5E.spellScrollValues`. This deliberately uses the detached conversion path, which copies activities and effects rather than referencing a live source spell. The native level template supplies rarity, weight and default price. Standard scrolls consume one item use and auto-destroy; no caster spell slot is consumed. Native scaling metadata is retained, and explicit `@item.level` references in copied activity data are replaced with the requested level. Known effect timers and macro hooks are stripped from copies; concentration rules and original spell duration text are preserved, while timed activity durations are changed to Special. External modules can still manage concentration and linked effects. Source spells with multiple activities must be reviewed: by default all activities are treated as alternative initial casts. Macro-dependent automation, summon/cast/enchant dependencies, caster-level-specific and non-damage scaling, repeated triggers, class-list eligibility and above-level casting checks need live/manual review. The generator cannot create mechanics absent from the source spell. No promise that all premium/source spells work identically.

Test file: `examples/54-spell-scrolls-TEST.json` (8 variants). Check Cure Wounds healing, Fireball damage and fixed DC, Hold Person condition and target scaling, Ray of Frost attack and cantrip damage, consumption, and no timed Active Effect. Tests run on Node with simulated Foundry APIs, not a live server.

Reference: https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/item.mjs (native scroll API); https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/config.mjs (scroll values).

## v0.1.12 — Level-first scroll names

Generated scroll names now use `1st Spellscroll – Cure Wounds`, `2nd Spellscroll – Cure Wounds`, … `9th Spellscroll – Cure Wounds`; level zero uses `Cantrip Spellscroll – Ray of Frost`. No JSON changes. The duplicate check also recognizes existing generated v0.1.11 scrolls by their legacy name and matching level metadata in the chosen destination. Existing documents are not automatically renamed; the optional GM macro in `examples/rename-legacy-scrolls.js` renames only matching generated World Items without changing IDs or mechanics. Back up before running. Actor copies and compendiums are not changed.


## v0.1.13 — UUID-linked Cast spellscrolls (current default; supersedes v0.1.11 conversion instructions)

- Ordinary `scrolls` requests now create one native Cast Activity referring to the original compendium spell by UUID, with a fixed casting level. No need to change existing JSON. The native level-specific template is still obtained through the detached conversion API, but the copied activities and effects are discarded. Source documents are never modified.
- In **Spellscroll Scaling**, choose **Character Scaling** (default: Cast challenge override off; the spell's native caster ability and actor rolls apply) or **Official Scroll Scaling** (Cast challenge override on; fixed attack and DC by scroll level). Optional per-request `"scalingMode":"character"` or `"official"` overrides the dialog. This changes attack and save values only; native source formulas and explicit spell abilities/classes may still apply, so review custom spells.
- Every ordinary Cast scroll has one item use, no recovery, auto-destroy enabled, a single item-use consumption target, and no spell-slot consumption. Cast level is fixed; no extra level selection. Spellbook display is off; use the item itself. Do not uncheck resource consumption in Foundry. Native source spell activities must enable `consumption.spellSlot` for the initial cast: D&D5e 5.2.5 replaces slot consumption with linked item consumption; when the source activity disables it, native consumption can be skipped. All-disabled sources are blocked. Mixed/multiple activities are warned about; verify which one is initial. No additional runtime hooks are installed.
- Use only accessible source compendiums. Linked spells retain their effects, flags, macros, activity overrides and mechanics. No new timer is installed; timed spell-level duration is overridden to Special while concentration remains required. Source effects and activity-level durations are NOT sanitized by the linked approach. Check and remove source timers manually as needed. Source-dependent effects/recurring activities may need manual management after the scroll is consumed; do not assume the temporary cached spell remains accessible.
- Compatibility exception: an explicit nonempty `followUpActivities` request from v0.1.12 retains its former copied-scroll behavior (fixed values, spent scroll remains for follow-ups). Explicit `"implementation":"copy"` selects the same legacy path; `"implementation":"cast"` rejects nonempty follow-ups. `scalingMode:character` is incompatible with copy. This is not the default and is not exposed as a regular UI option.
- Existing world scrolls: reimport same JSON into the original folder with **Update Existing Items** to replace old activities/effects while retaining UUID and image unless changed. This is a full update; back up first. Actor copies are unaffected; replace them separately. Skip Existing will not convert existing items. No automatic migration or GitHub publication.
- Test `examples/64-linked-scrolls-TEST.json`: Scorching Ray (2,9), Cure Wounds (1,9), Fireball (3,5). On an actor, check Character Scaling, fixed level, healing/damage scaling and consumption, especially multiple rays and a stack of 2. Repeat in Official mode on separate test items. Test cancellation, compare before/after spell slots, and try a character with no high-level slots. Also check custom source spells with effects/recurring actions. Node mocks test payloads and importer flow, not actual casting in Foundry/Midi-QOL.

Source references (5.2.5): https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/data/activity/cast-data.mjs ; https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/activity/cast.mjs ; https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/activity/mixin.mjs ; https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/item.mjs .

## v0.1.14 — Species

Use `kind: "species"` or `type: "race"` for native Species items. Use `system.type.value: "race"` for child feat items, and native `system.movement`, creature type, level-0 Size/Trait/ItemGrant advancements on the Species. Local `grantLinks` resolve after all World Items are created. Import into a World Item folder, then drag the Species onto a character. See `examples/65-veyraki-species.json`. Live advancement flow is not covered by Node tests.
