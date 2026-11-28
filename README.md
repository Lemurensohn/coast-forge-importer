# Coast Forge Importer – v0.2.2

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
2. Inhalt von `coast-forge-importer-github-source-v0.2.2.zip` in das vorhandene GitHub-Repository übernehmen (Dateien zusammenführen/überschreiben, nicht das Repository löschen). Vorhandene ältere Tests, Beispiele, IMPORT_FORMAT.md und QA-Dokumentation beibehalten. `module.json` gehört ins Repository-Stammverzeichnis.
3. GitHub-Release mit neuem Tag `v0.2.2` erstellen. Die separate `module.json` und `coast-forge-importer-v0.2.2.zip` als Release-Assets anhängen, dann veröffentlichen. Die Release-ZIP nicht erneut komprimieren: das Manifest befindet sich bereits im Archiv-Stammverzeichnis.
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

## v0.2.0 — Native NPC Actor imports and summon links

The existing `schemaVersion: 1` is unchanged. Add an optional `actors` array (up to 50). Each entry requires a unique `ref` (lowercase letters/numbers/hyphens, 1–100 chars), `name`, and `type: "npc"`. Optional `description` (plain text biography), `img`, `system` (native D&D5e NPC data), `prototypeToken` (native token data), `effects` (normal effect shorthand), `flags`, and `items` (up to 100 embedded ordinary item specs per NPC) are accepted. Embedded item descriptions support the established compendium aliases. Embedded Grant Items and external effect/grant imports are not yet supported; use native data or standalone world Items instead. Do not supply document IDs or ownership. Actor names and refs must be unique within the batch.

```json
{
  "schemaVersion": 1,
  "actors": [{
    "ref": "example-construct",
    "name": "Example Construct",
    "type": "npc",
    "system": {
      "details": {"type": {"value": "construct"}},
      "attributes": {"ac": {"calc": "flat", "flat": 15}, "hp": {"value": 20, "max": 20}, "movement": {"walk": 30, "units": "ft"}},
      "traits": {"size": "med"}
    },
    "prototypeToken": {"actorLink": false},
    "items": []
  }],
  "items": [{
    "name": "Call Construct", "kind": "feature",
    "activities": [{
      "type": "summon", "name": "Summon Construct",
      "activation": {"type": "bonus", "value": 1, "override": true},
      "consumption": {"spellSlot": false, "targets": []},
      "profiles": [{"name": "Construct", "actorRef": "example-construct", "count": "1"}],
      "creatureSizes": ["sm", "med"], "summon": {"prompt": true}
    }]
  }]
}
```

`actorRef` is import-only metadata, never stored in Foundry. It resolves against an Actor spec in the same file. Native `uuid` can instead refer to an existing Actor; its access and existence are the author's responsibility. Never set both. More than one native `summon` activity or profile per item is supported. Preserve native `match`, `bonuses`, `visibility`, `creatureSizes` and `count` properties. The native system selects one profile per use; a count greater than one summons copies of that profile, not a mixed group. The module does not add its own runtime summoning hooks yet.

Import via the existing Item directory button. Select the World Item destination and a separate Actor destination (default root folder `Coast Forge Actors`). Actor-only import does not create an Item folder. Preview NPCs and their embedded items first, then World Items. All approvals are required before document creation. Choose portraits and each embedded item icon as usual; if token texture is not explicitly provided in JSON, it inherits the final portrait. Separate token images may be set with `prototypeToken.texture.src` or edited afterwards in Foundry. Unlinked tokens are default. Actor IDs are reserved in memory before preflight, then requested with `keepId:true` and verified upon creation. Actors are created before dependent Items. Native document constructors validate detached copies in the real application. Node tests use mocks only.

Matching NPCs (name, ref, and type, within selected folder) are reused unchanged regardless of the Item update mode. Conflicting name/ref and ambiguous matches are errors. No Actor full update, no Actor icon-only update yet. To change an Actor, edit it manually or create a separate template in a test folder and update dependent world Items. Existing linked Items with mismatched summon profiles must be updated, not skipped. No automatic rollback; back up before importing; a failed write may leave earlier NPCs/Items in the world. Permissions remain under GM control. Native 5.2.5 summoning checks token creation permission, allowSummoning, and ownership of the source Actor. Assign only intended players ownership or test as GM. Do not grant all players Owner globally.

### Live test: examples/71-tactician-summons-TEST.json

Three unlinked Construct NPC templates, 15 embedded features, four native summon activities (three individual and one profile chooser). Use a test Artist of level 3–5 whose class identifier is `artist`, preferably level 3, INT 16, PB 2 and AC 15. Baseline NPC HP 40, AC 15. Native bonuses attempt to reproduce `Artist AC` and `10 + 7 × Artist level + 3 × INT modifier` at summoning, relative to template base values. Check native matching of attacks, save DC and proficiency. The sample attack damage and Guardian temp HP intentionally use INT +3/PB +2; other ability scores and CR are fixture placeholders, not invented campaign rules. All other rules stay in descriptions; manually apply damage type, specialized shared uses, commands, conditions, protection, dismissal, initiative, and movement. Limit one unit at this tier. No automatic duration timer. Mixed summons, higher-tier scaling and auras are not yet implemented. Test one summon, then dismiss; confirm one use consumed and no spell slot; change AC/INT and repeat; verify HP/AC, profile selection, Small/Medium, and independent unlinked HP. Try a player account after setting permissions. Test duplicate reimport and cancellation. Do not use this fixture as the complete subclass.

Native source: https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/data/activity/summon-data.mjs and https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/activity/summon.mjs .

## v0.2.1 — Advanced Summoning (opt-in runtime)

Existing summon items without `advancedSummon` remain native and unchanged. v0.2.0 was reported working in the user's live test. The new managed mode is **not** yet live-tested. Back up your test world. Keep old and new fixtures separate: fixture 72 deliberately uses different actor names and refs so the importer never overwrites previously tested NPC templates.

Use `examples/72-tactician-advanced-summons-TEST.json`. Import to the world Item directory, select an Actor folder, confirm both previews, drag the new `Living Strategy — ADVANCED TEST` onto your Artist, select exactly one token of that Artist in a scene, and use `Summon Tactical Unit — Choose Mixed Profiles`. Single-profile activities are also available. The manager should open; choose one or more units up to the displayed remaining capacity. For each, select a profile, size and damage type. Optional blank rows are ignored. Click Place summons, then place each token using the native placement tool. If all succeed the feature's `system.uses.spent` increases by exactly one. No spell slot is spent. The module displays its own chat summary; it does not run the usual native/Midi-QOL activity usage or enforce the Bonus Action. Use the actual actor sheet's Summons button (or another managed activity) to reopen the manager and dismiss selected tokens even when no uses remain. Dismissal does not refund uses. If the sheet button is not visible, select the caster token, open the browser console and use the following diagnostic API with the actual embedded Item and Activity names/IDs:

```js
const actor = canvas.tokens.controlled[0].actor;
const item = actor.items.find(i => i.name === 'Living Strategy — ADVANCED TEST');
const act = item.system.activities.find(a => a.name === 'Summon Tactical Unit — Choose Mixed Profiles');
await game.modules.get('coast-forge-importer').api.manageSummons(act);
```

No new user macro is required. The API is a fallback for testing. Native permission checks still apply: token creation, allowSummoning, source NPC ownership; dismissal/rollback also requires token deletion permission. Do not assign everyone Owner. Test first as GM, then as intended player. Only the current batch is removed on cancellation, never pre-existing summons. A failure during the consumption write or rollback can require manual repair. No server-authoritative multi-client locking; do not activate the same caster from two clients simultaneously. Only tagged managed tokens are counted; remove earlier untracked fixture tokens first. The manager scans the world scene documents accessible to the client and counts living managed tokens for the same actor UUID and group. 0 HP tokens stop counting but remain until explicitly dismissed. A token linked to an unlinked caster uses that caster's synthetic Actor UUID; moving/recreating that caster token can change its identity. Manual token duplication, hidden/unavailable scenes, or actor deletion can require GM cleanup. Source NPCs are never altered; linked NPC templates are rejected by the managed hook.

### Declarative schema

`advancedSummon` is an optional field on an Item spec (not a raw D&D5e system field). The builder stores the validated object in `flags.coast-forge-importer.advancedSummon`. It can support other classes and summons by configuring a different `group`, `classIdentifier`, `ability`, `tiers`, `damageTypes` and `profiles` array. The class identifier must be the actual native identifier, not the displayed class name. Native Summon activities use exact profile names matching the scaling configuration, count `"1"`, at least one `creatureSizes` value, no CR query, one `itemUses` consumption target with value `"1"`, `spellSlot:false`, and no native `bonuses` formulas (avoids double scaling). `match` still handles native attack, save DC, proficiency and disposition. Use a single managed parent feature for a resource pool. Group is the stable capacity key shared by its activities.

Example (shortened; see complete fixture):

```json
{
  "group": "example-constructs", "classIdentifier": "artist", "ability": "int",
  "tiers": [{"minLevel":3,"maxActive":1,
    "hp":{"base":10,"level":7,"ability":3},"ac":{"ac":1},
    "walk":{"base":30},"save":{"ability":1}}],
  "damageTypes":["force","fire"],
  "profiles":[{"name":"Vanguard","rules":[{"item":"Vanguard Strike","activity":"Vanguard Strike",
    "kind":"damage","part":0,"die":10,"dice":[1],"bonus":[{"ability":1}],"replaceType":true}]}]
}
```

Tier selection uses actual class level; PB and AC are the character's prepared values. Tiers have ascending minLevel and a cap (1–12), and `hp`, `ac`, `walk` plus optional `save` coefficients. A coefficient object represents `base + level*classLevel + ability*abilityModifier + prof*proficiencyBonus + ac*casterAC`; omitted coefficients are zero. No arbitrary formulas/scripts. Each named profile's rules target exactly one named embedded Item and Activity; names must remain unchanged. `kind:damage` targets a damage part index (0-based), a die denomination, one dice count and bonus coefficient object per tier, and optional damage replacement as `replaceType:true` (explicit false to retain existing types). `kind:healing` targets a Heal activity and replaces its amount using one bonus object per tier while keeping the healing type. `kind:flavor` appends a computed amount with `text` to chat flavor, without mechanically applying it. For each rule the arrays must match the tier count. No automatic effect expiration or turn hooks. Missing or ambiguous activities fail closed before creating the affected token. Use NPC templates without conflicting HP/AC/save bonuses. Managed tokens use a natural AC base so later AC modifiers can apply; their base attributes and dice are snapshotted at manifestation, not rescaled in place. Native matching uses the source Summon Activity's selected spellcasting ability and actual prepared caster values; configure that explicitly (INT for Artist).

### Live-test checklist

| Artist level | INT mod | PB | caster AC | unit HP | unit AC | walk | cap | Vanguard | Guardian / Artillery | Bombardment | Guardian temp HP | Guardian DR (manual) |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---:|---:|
| 3 | 3 | 2 | 15 | 40 | 15 | 30 | 1 | 1d10+3 | 1d8+3 | 2d8+3 | 5 | 5 |
| 6 | 5 | 3 | 18 | 89 | 21 | 40 | 1 | 2d10+8 | 2d8+8 | 3d8+5 | 8 | 11 |
| 10 | 5 | 4 | 18 | 155 | 23 | 40 | 2 | 2d10+9 | 2d8+9 | 4d8+5 | 9 | 17 |
| 14 | 5 | 5 | 18 | 237 | 25 | 40 | 3 | 3d10+10 | 3d8+10 | 5d8+5 | 10 | 25 |
| 20 | 5 | 6 | 18 | 315 | 26 | 40 | 3 | 3d10+11 | 3d8+11 | 5d8+5 | 11 | 29 |

At level 14 choose Fire Vanguard, Cold Guardian and Lightning Artillery, each separately sized. Verify one feature use, no slot, correct attack/DC, all six base saves +5, damage types and native damage rolls including save half damage. Confirm source NPCs remain unchanged. Try a fourth summon (blocked), dismiss one (no refund), resummon one (one use). Repeat with second caster and different INT, then abort placement of the second token in a two-unit batch (no net tokens or cost if rollback succeeds). Test native old fixture 71 and normal linked spellscroll regression. Test player permissions and Midi-QOL attack/save/damage workflows. Native bonus action, range and movement are still manually enforced. Shared specialized resources, Grand Simulation and protective auras, actual damage reduction, fragment integration, initiative order and armament manager are future steps. The rule duration is 1 hour; manual dismissal only. This is a summons test, not the complete Tactician subclass.

Source review: D&D5e 5.2.5 `module/documents/activity/summon.mjs` (native `placeSummons`, `preSummon`, `preSummonToken`, `getTokenData`), `module/documents/activity/mixin.mjs` (`preUseActivity`), `module/data/activity/summon-data.mjs`, `module/data/actor/templates/common.mjs`, `attributes.mjs`, and `module/data/shared/uses-field.mjs` at https://github.com/foundryvtt/dnd5e/tree/release-5.2.5 . Local Node tests are not a real Foundry server; native delta merge, GUI, player permissions and Midi-QOL integration must be verified live.

## v0.2.2 — Stability & Aura Integration

**Foundry v13, D&D5e 5.2.5, Aura Effects 1.5.2.** Aura Effects is optional and is not bundled or installed by Coast Forge. Install via Foundry's module manager or the version-specific manifest https://github.com/roth-michael/Aura-Effects/releases/download/1.5.2/module.json . Enable it in the test world alongside Midi-QOL/DAE. Do not install the 2.x version intended for Foundry v14. At least one active GM is required for Aura Effects' recipient application. Do not confuse it with Active Auras.

### Stability boundary

The importer core and the declarative builders do not register movement or attack hooks for auras. Aura Effects owns all aura behavior and drawing. World setting **Advanced Summoning** (enabled by default, reload required) independently enables the existing summon manager. The manager is dynamically loaded after core initialization; startup errors are reported and its partial hook registration is cleaned up where possible. Normal Item, Actor, Cast and native Summon imports do not require Aura Effects or the Advanced Summoning runtime. Managed items require the runtime for their custom mechanics. If disabled, their native Activities remain present, but native fallback **does not enforce custom scaling, mixed-profile selection, capacity or batch management**. Use ordinary native summon items only in that mode, or re-enable the runtime. No automatic migration or repair of prior documents. With Aura Effects disabled, do not use imported custom aura documents; deactivate them and clean up recipient copies before disabling that external module. No automatic deletion of stored effects or third-party documents. Back up the world before any module update.

### Aura JSON format (schemaVersion 1)

Add `aura` to any normal `effects[]` entry (Item, embedded NPC Item, or direct NPC effect). Use ordinary `changes`, `statuses`, `transfer`, `disabled`, `img` and `_id`. No additional root section or scripts. The builder translates the shorthand to the external module's real `type: "auraeffects.aura"`, `system` and `flags.auraeffects.originalType: "base"`. The dependency and data-model registration are checked **before previews/writes**, including resolved compendium effects. Only version 1.5.2 is currently supported. The importer checks native serialization before writes and verifies the returned aura type and key configuration after creation/update. A post-write verification failure is reported; existing import rollback limitations still apply. The adapter does not replace unsupported aura effects with global buffs.

```json
{
  "name": "Golden Guard",
  "transfer": true,
  "disabled": true,
  "changes": [{"key":"system.bonuses.abilities.save","mode":2,"value":"max(1, @abilities.cha.mod)","priority":20}],
  "aura": {
    "radius":"5 * @prof", "targets":"allies", "includeSelf":true,
    "color":"#D4AF37", "opacity":0.25, "showRadius":true,
    "evaluateSource":true, "stack":false,
    "bestFormula":"max(1, @abilities.cha.mod)", "collisionTypes":["move"]
  },
  "flags":{"dae":{"showIcon":true}}
}
```

- `radius`: positive numeric distance in scene units or deterministic roll formula. Use existing source roll-data fields and test at actual character levels. No dice or executable scripts; syntax/available paths still need real Foundry validation.
- `targets`: `allies` (matching friendly/hostile disposition), `enemies` (opposite), `any` (all dispositions). `includeSelf` defaults true for allies, false otherwise; cannot set true for enemies. Neutral/Secret do not count as allies/enemies. Disposition is relative to the source token, not player ownership.
- `color`: hex RGB; default blue allies, red enemies, gold any. `opacity`: 0–1, default 0.25. `showRadius`: true by default. `collisionTypes`: default movement-blocking walls (`["move"]`); `[]` for no wall collision; optional `sight`, `light`, `sound`.
- `evaluateSource`: true by default, replaces source roll-data references before application. Aura Effects 1.5.2 does source replacement with DAE enabled regardless of this toggle. Already applied recipient effects may not rescale until removed/reapplied; disable/re-enable the aura when source stats change. `stack`: false by default; `bestFormula` optional, determines the strongest same-name aura. Different names may stack. `disableOnHidden`: true by default. Aura Effects controls distance and visualization details.
- Manual duration only. For manual toggle use transfer true and initially disabled; for self-activation use transfer false, disabled false and a self Utility Activity linked to its ID with native uses/recovery. Rule duration remains in the description and chat guidance; no duration or repeat flags. Raw imported aura scripts, combat-only auto-activation, timer and macro changes are rejected. No automatic behavior selection, movement, reactions, or target choice. Selected-creature filters, owner-only summons, stationary areas (Color Mural), DR and full Grand Simulation/Protective Formation are deliberately deferred. This update adds no combat hooks or custom drawing.

### Live test: examples/73-aura-effects-TEST.json

Four independent test features (not final campaign abilities). Import into a test folder and put them on a single source actor with **CHA 18, PB +3**. Place its token, another friendly token with CHA 10, a hostile token, and a neutral token within 5 ft of the source; keep a further token beyond 60 ft. Use distinct Actors or unlinked tokens, and have an active GM. Open the source actor's Effects tab. Enable only one of the first three effects at a time:

| Feature | Expected radius | Expected effect | Self |
|---|---:|---|---|
| Golden Guard (gold) | 15 ft | Allies +4 to all saves, regardless of their own CHA | +4 |
| Crimson Dread (red) | 30 ft | Enemies −2 to all saves | No |
| Violet Field (violet) | 10 ft | All other tokens +1 AC, including neutral | No |
| Blue Ward (blue, via activity) | 60 ft | Allies +2 AC, one item use | +2 |

Move recipient out and back, then move the source; check the visible radius and actual rolled save or AC. Toggle aura off while recipients are still in range; all recipient copies should disappear. Flip the source disposition to Hostile while aura off, reactivate and check reversed ally/enemy behavior. Test walls, two distinct auras active, and two same-name Golden Guard sources with different CHA to verify non-stacking. Change source PB/CHA and toggle off/on to test new radius and strength. With Blue Ward, activate the self-targeted Activity with Midi-QOL effect application enabled; verify 1 use consumed, source effect active, no slot and ally AC. Delete/disable the *actor's applied source aura*, not the item template, manually after 1 minute. If the activity fails to apply the custom effect, report it and use manual native aura application without spending another use. Long Rest restores the use, not the aura automatically. Test ordinary items and fixture 71/72 again. Separately test missing dependency and disabled advanced runtime in a fresh test world or after removing custom aura effects; do not disable Aura Effects with live aura copies present.

Source verification: https://raw.githubusercontent.com/roth-michael/Aura-Effects/1.5.2/scripts/AuraActiveEffectData.mjs ; https://raw.githubusercontent.com/roth-michael/Aura-Effects/1.5.2/scripts/auras.mjs ; https://raw.githubusercontent.com/roth-michael/Aura-Effects/1.5.2/scripts/queries.mjs . Actual aura propagation, visuals, Midi-QOL activity application and player permissions are not simulated by the importer tests and need a real Foundry live test.
