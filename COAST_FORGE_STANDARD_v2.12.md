# QA v2.12 — Bulk Spell Scroll Generation (Coast Forge v0.1.11)

This supplement takes precedence for generated scrolls; all prior QA rules, especially manual effect expiration, remain in force.

- Use `schemaVersion:1` with `scrolls` requests (`spell`, `scrollLevels`, optional `pack`, `img`, `priceByLevel`, `followUpActivities`). For meaningful upcasts choose explicit levels from the actual rules; `all` does not infer meaningful scaling. Never upcast cantrips.
- Source compendiums must contain the requested spell with the correct edition and existing mechanics. Resolve names unambiguously. Never change source documents. Use level-specific native templates and fixed scroll DC/attack values, retain native scaling metadata, and name every scroll by level.
- Keep original spell rule text, source link and original duration in the scroll description; remove known automatic effect timers and macro hooks from copied data. No new automatic duration bindings. Concentration and linked documents may still be handled by external modules; verify live. Do not claim macro-based source mechanics were preserved after stripping macro hooks.
- Standard scrolls consume one use without a spell slot and auto-destroy. For recurring activities explicitly specify `followUpActivities`; the spent scroll remains for the follow-up activities, which are free, and must be removed manually afterward. Do not stack such scrolls. Follow-up timing and eligibility are manual.
- Price defaults to native template; set explicit GP price overrides only when intended. Do not invent values for unspecified prices. Verify all scaling types, fixed DC/attack, healing, condition effects, spell consumption and concentration in Foundry/Midi-QOL. Native API calls and simulations are not proof of live correctness. Complex linked activities, missing source automation, scroll eligibility checks, and non-damage scaling may require manual work.

---

# Coast Forge — Verbindlicher Import- und Qualitätsstandard v2.11

**Zielsystem:** Foundry VTT **v13**, D&D5e **2024-Regeln**, installiertes **dnd5e 5.x** (exakte Minor-Version im Live-Test feststellen), Midi-QOL und ggf. DAE; Hosting: The Forge.

**Importer:** Coast Forge Importer **v0.1.9** (frühere Abschnitte dokumentieren historische Versionen), JSON-`schemaVersion: 1`. Die Code-Datei `scripts/schema.mjs` ist die verbindliche Quelle für gültige Importdaten; dieses Dokument ergänzt, aber ersetzt sie nicht.

## QA v2.11 — Active-Effect-Artwork (Importer v0.1.9)

- **Regel für neue JSONs:** Native Active-Effect-Bilder über `img` (Foundry v13). Historisches `icon` wird aus Gründen der Kompatibilität beim Builder nach `img` normalisiert. Bei einem normalen Buff/Debuff kann das Bild ganz entfallen; bei der Importvorschau erbt er automatisch das endgültige Item-Icon. Nicht absichtlich ein generisches SVG setzen, wenn das Item-Artwork gemeint ist.
- Bekannte generische Platzhalter (aura, book, shield, item-bag, upgrade, mystery-man unter `icons/svg/`) werden als Vererbung behandelt. Native Conditions mit `statuses`, über `effectRefs` kopierte Effects und ausdrücklich eigenständige nicht-generische Bilder behalten ihre Originalbilder. Bei kopierten Effects mit fehlendem oder generischem Bild ohne Status wird wie bisher das Quell-Feature-Bild verwendet, sofern verfügbar. Soll ein generisches Bild bewusst erhalten bleiben, `flags.coast-forge-importer.effectIcon.mode` als `original` setzen (verschachteltes JSON-Objekt, kein wörtlicher Punkt-Key).
- Die Importvorschau enthält pro Item einen optionalen, standardmäßig eingeklappten Bereich mit `Item-Icon übernehmen`, `Eigenes Icon` (nativer FilePicker) und `Original-Icon behalten`; Reset stellt den initialen Vorschau-Modus wieder her. Die Auswahl wird erst nach Bestätigung gespeichert.
- Pro Effect werden Modus, ursprünglicher Bildpfad und zuletzt vom Importer gesetztes Bild unter `flags.coast-forge-importer.effectIcon` gespeichert. Manuell geänderte Bildpfade werden bei späteren Importer-Updates erkannt und respektiert. Alte unmarkierte generische Bilder sind nicht eindeutig als absichtlich individuell identifizierbar und werden als Standard interpretiert; bei Bedarf `Original-Icon behalten` auswählen. Bei Vollupdates wird das alte Bild anhand gleicher ID oder eines eindeutig übereinstimmenden Namens zugeordnet; bei mehrdeutiger Zuordnung Bild manuell prüfen.
- `Update Icons Only` bearbeitet die tatsächlich vorhandenen Embedded Effects und schreibt nur Bild und Icon-Metadaten; kann alte generische Effect-Icons auch ohne neue Item-Bildauswahl reparieren. `Skip Existing` verändert keine bestehenden Bilder. Ein Vollupdate ersetzt wie bisher Rules, Activities und Effects; Sicherung empfohlen. Keine automatische Synchronisierung mit Actor-Kopien oder bei einer außerhalb des Importers erfolgenden Änderung des Item-Icons.
- Keine Timer, Hooks zur Effektlaufzeit, Änderungen an Bonus-Keys, Uses, Activities, Status oder Regeltext durch die Icon-Logik. QA v2.10 bleibt voll verbindlich. Import aus Compendium kopiert vorhandene Timer weiterhin unverändert (Quelle vorher prüfen); v0.1.9 ist keine automatische Bereinigung alter Effects.
- Pflichtprüfung: native `img`-Normalisierung, Vererbung mit endgültigem Bild, Erhalt von Conditions und expliziten Icons, unabhängige Auswahl/Reset/Abbruch, Icon-only-Update ohne Mechanikänderung. Die Node-Tests nutzen simulierte Foundry-Schnittstellen; Live-Test in Foundry v13 / D&D5e / Midi-QOL bleibt erforderlich.

## QA v2.10 — Effektlaufzeiten ausschließlich manuell (verbindlich, 24.11.2026)

**Diese Regel hat Vorrang vor allen früheren Zeit-/Timer-Vorgaben.** Der Nutzer möchte keine automatisch ablaufenden Active Effects mehr, da das Hinzufügen neuer Gegner zum Combat die Ablaufautomatik unzuverlässig macht. Auch der frühere Standard „1 Minute = 10 eigene Zugbeginne per Makro“ ist aufgehoben.

- In neu erstellten Active Effects keine technischen Laufzeitfelder (`duration.seconds`, `rounds`, `turns`, Startzeit-/Combat-Daten); `duration` nach Möglichkeit ganz weglassen. Keine automatische Deaktivierung, Entfernung oder Beendigung anhand von Zeit, Zug, Runde oder sonstigen Ablauftriggern.
- Keine DAE-/Times-Up-`specialDuration`-Trigger, keine Ablaufmakros (`macro.execute` für Timer), keine Combat-Hooks für Ablauf oder Zugzähler und keine versteckte Ersatzautomatik. Wiederkehrende zugbasierte Wirkungen standardmäßig manuell; keine eigens dafür eingeführten Turn-Makros. Keine neuen automatischen Ablaufbindungen, auch nicht über Activity-/Concentration-Links. Bei nativen Spell-Dauerfeldern weiterhin die Originalregel im Text erhalten; keine zusätzlichen Effekt-Timer daraus bauen. Native Systemfunktionen und Einstellungen anderer Module sind separat zu prüfen.
- Der Nutzer aktiviert, deaktiviert oder entfernt temporäre/bedingte Effects selbst. Statische Boni, `flags.dae.showIcon: true`, normale Activity-Anwendung, Schadenswürfe, Saves, Item Uses und Long-Rest-Recovery bleiben wie bisher möglich. Beim Activity-applizierten Effect den Actor-Effect nach Ablauf manuell deaktivieren oder entfernen. Keine zusätzlichen Makros für diese Bedienung.
- **Spielregeln bleiben unverändert:** Die vollständige englische Dauer und alle Auslöser bleiben in Item-/Effect-Descriptions erhalten; manuelle Bedienung nur im Chat Flavor und im Importbericht erläutern. Eine Minute im Regeltext ist kein technisches Timer-Feld.
- Bei `effectRefs` aus Compendiums die tatsächliche Quelle auf Dauerfelder, Ablauf-Flags, Makro-Changes und sonstige Ablaufmechanismen prüfen. v0.1.8 kopiert Quellkonfigurationen; der Importer entfernt bestehende Timer nicht automatisch. Wenn die Quelle nicht geprüft oder timerfrei konfiguriert werden kann, ausdrücklich darauf hinweisen und keine timerfreie Laufzeit versprechen. Quell-Effect gegebenenfalls manuell timerfrei vorbereiten oder eine geprüfte timerfreie Alternative verwenden; nicht eigenmächtig das Compendium verändern.
- Bereits importierte World Items und Actor-Kopien werden nicht automatisch bereinigt; aktive alte Effects und Timer-Makros separat deaktivieren/entfernen. Kein Modulupdate allein für diese QA-Regel notwendig. Abweichungen nur auf ausdrücklichen Nutzerwunsch.
- **Pflichtprüfung pro neuem JSON:** keine Ablaufdauer oder Ablauf-Trigger im technischen Effect-/Activity-Setup; keine Timer-Makros oder Turn-Hooks; vollständige Regeldauer in den Descriptions; korrekte manuelle Bedienhinweise; native Ressourcen-Verbräuche unverändert. Statischer Test und Live-Test weiterhin getrennt ausweisen.
- Ring of Sun v2: Zenith ohne `macro.execute`, `macroRepeat`, `specialDuration` oder technische Dauer; Bonus Action und 1/Long Rest bleiben, statische Speed-/Light-Changes bleiben, Temporary HP und Ablauf manuell. `36-ring-of-sun-v2.json` ersetzt die frühere Ring-JSON; `ZenithCounter.js` ist nicht mehr erforderlich.

## Arbeitsprozess: bei JEDEM Item

1. **Regeltexte strikt trennen:** `items[].description` ist der vollständige englische, lesbare D&D-2024-Regeltext des Items. `items[].effects[].description` enthält den **vollständigen Regeltext der benannten Fähigkeit**, zu der der Effekt gehört – auch Wirkungen, die separat gewürfelt oder manuell durchgeführt werden; ebenfalls in Spieler-Regelsprache. Keine technische Key-Liste und keine Bedienungs-/Testanweisungen in einer der beiden Descriptions. Keine unbeabsichtigten Änderungen an Mechanik oder Balancing. Coast Forge v0.1.1 wandelt **Item**-Descriptions von Plain Text in HTML um, lässt **Active-Effect**-Descriptions aber unverändert. Deshalb bei Active Effects für Absätze und Aufzählungen explizit `<p>`, `<ul>` und `<li>` in die JSON-Description schreiben. Foundry-Links sind separat auf Kompatibilität zu testen.
2. **Mechanikmatrix bilden:** Alle Boni, Conditions, Saves, Damage, Dauer, Attunement, Uses, Recovery, Activation, Targets, Item-Properties und manuelle Schritte notieren. Keine Regel übersehen.
3. **Schema/Parser bestimmen die Form:** `schemaVersion: 1`, `items: []`, `kind`, `system`, `activities`, `effects`. Keine erfundenen Felder oder ältere 2014-Angriffsfelder. Der native D&D5e-`system`-Block wird durchgereicht, muss also in der installierten D&D5e-Version gültig sein.
4. **Getestete Schablonen bevorzugen:** Bei bekanntem Mechanismus die im Foundry-Livetest bestätigte Struktur verwenden; nicht bei jedem Item neu raten. Neue/unsichere Attribute Keys nicht als bestätigt ausgeben.
5. **Automatisch statisch prüfen:** Wenn verfügbar, `node tools/validate-import.mjs pfad/zu/item.json` ohne ERROR ausführen. Ist der Validator nicht im Source-Archiv enthalten, den tatsächlichen Parser `parseImport` und Builder `buildItemData` aus `scripts/schema.mjs` mit der neuen Datei ausführen, zusätzlich die fachlichen Prüfungen (insbesondere v2.10) durchführen. WARNs einzeln beurteilen und offen benennen. Zusätzlich `node --test tests/*.test.mjs` ausführen.
6. **Drei verschiedene Wahrheitsstufen ausweisen:** (A) gültige JSON- und Importer-Struktur, (B) D&D5e-Datenmodell akzeptiert in Foundry, (C) reale Mechanik funktioniert mit Midi-QOL. A ist **kein Beweis** für B oder C.
7. **Abweichungen protokollieren:** Nach jedem echten Foundry-Test den Effekt und das Ergebnis im Referenzkatalog ergänzen. Fehler sowohl im JSON als auch im QA-Test korrigieren, damit sie nicht wieder auftreten.

## Verbindliche Texttrennung: Item Description vs. Active Effect Description

### Item Description (`items[].description`)

- Der **vollständige** englische D&D-2024-Regeltext des Items, inklusive Aktivierungsbedingungen, Reichweiten, Triggern, Uses, Dauer, Schaden, Rettungswürfen und Beendigung, soweit zutreffend.
- Formuliert wie eine offizielle Spielregel, **nicht** als Anleitung für Foundry oder den Spielleiter zur technischen Konfiguration.
- Die Item Description enthält Mechaniken, die nur durch Activities oder manuell abgebildet werden, selbstverständlich weiterhin vollständig.

### Effect Description (`items[].effects[].description`)

- **Die vollständige Spielregelbeschreibung der benannten Fähigkeit**, die dieser Effect im Charakterblatt repräsentiert, einschließlich aller zugehörigen Vorteile, Schadenswürfe, Zeit- und Aktivierungsbedingungen, Dauer und Ressourcen. Das gilt **auch für Teile, die nur durch Activities oder manuell** abgewickelt werden. Nicht bloß die automatisch über `changes` realisierten Werte auflisten. Keine anderen, unzugehörigen Fähigkeiten des Items hineinmischen.
- Kurz und präzise in normalem **englischem D&D-2024-Regelstil**, grundsätzlich in der zweiten Person ("Your Speed increases by 20 feet.") oder einer ebenso eindeutigen Regelperspektive.
- Ein DC, eine Bedingung, Dauer oder Aktivierungsregel wird genannt, wenn sie Bestandteil dieser Fähigkeit ist; niemals als bloßes Techniketikett.
- **Verboten sind technische oder operative Hinweise**, insbesondere "Activate/deactivate this effect manually", "Use/Roll through the Utility Activity", "in Foundry", "Midi-QOL", "Active Effect key", "not automated", "handled manually", "transfer effect", "activity-applied", "campaign tracking convention" oder Test-Kommentare.
- Manuelle Bedienung, bekannte Einschränkungen und QA-Hinweise gehören **ausschließlich** in Entwicklungsdokumentation, Prüfbericht oder klar gekennzeichnete Import-Metadaten, nicht in spielerseitige Beschreibungen.

**Beispiel — Ring of Sun:**

| Feld | Richtige Aussage |
|---|---|
| Item Description / Zenith | Vollständige Zenith-Regeln: Bonus Action, 1/Long Rest, 1 Minute, +20 ft. Speed, Licht, 3d8 statt 1d8, Temporary Hit Points, Opportunity Attacks. |
| Effect: Sunlit Resolve (drei Changes) | Die **gesamte** Sunlit-Resolve-Fähigkeit mit Daytime, +10 ft. Speed, +1 AC/Saves **und** +1d8 Radiant auf den ersten Treffer jedes eigenen Zuges. |
| Effect: Zenith (ein Speed-Change) | Die **gesamte** Zenith-Fähigkeit mit Bonus Action, 1/Long Rest, 1 Minute, +20 ft. Speed, Licht, 3d8 Radiant statt 1d8, Temporary HP und Opportunity Attacks. |
| Separate Damage-/Utility-Activities | Diese implementieren nach Möglichkeit die passenden Würfe; **sie begrenzen nicht**, welche Regeln in der Effect Description beschrieben werden. |

**Prüfpflicht:** Vor Auslieferung jede benannte Effect-Fähigkeit **inhaltlich vollständig** gegen ihren Abschnitt in der Item Description und gegen die vorhandenen `changes`, `statuses` und Activities prüfen. Die Effect Description darf mehr Regeln umfassen als die `changes` automatisieren. Die automatisierte Prüfung kann verbotene Technikformulierungen erkennen; ob ein Text die **gesamte benannte Fähigkeit** vollständig und ausschließlich beschreibt, bleibt zusätzlich ein manueller semantischer Check.

### Originalgetreue Regeltexte des Ring of Sun für Active Effects

**Sunlit Resolve:**

During daytime, you gain the following benefits:
• Your Speed increases by 10 feet.
• You gain a +1 bonus to AC and saving throws.
• The first time you hit a creature with an attack on each of your turns, the attack deals an additional 1d8 Radiant damage.

**Zenith:**

Once per Long Rest, while it is daytime, you can take a Bonus Action to invoke the ring's full power for 1 minute. For the duration, you gain the following benefits:
• Your Speed increases by an additional 20 feet.
• You emit Bright Light in a 30-foot radius and Dim Light for an additional 30 feet.
• The additional damage from Sunlit Resolve increases from 1d8 to 3d8 Radiant damage.
• At the start of each of your turns, you gain Temporary Hit Points equal to twice your Proficiency Bonus.
• When you hit a creature with an attack, that creature can't make Opportunity Attacks against you for the rest of the turn.

Once Zenith ends, you can't use it again until you finish a Long Rest.

## Verbindliche Formatierung von Active-Effect-Beschreibungen (v1.3)

**Problem:** Ein Feld wie `"During daytime...\n• Your Speed...\n• ..."` wird von Foundry v13 im Active-Effect-Dialog als ein Fließtext angezeigt. Plain-Text-Zeilenumbrüche und Bullet-Glyphen sind **kein** HTML-Listenmarkup.

**Lösung:** `items[].effects[].description` mit echten HTML-Absätzen und Listen füllen:

```json
"description": "<p>For the duration, you gain the following benefits:</p><ul><li>Your Speed increases by an additional 20 feet.</li><li>You emit Bright Light in a 30-foot radius.</li></ul><p>Once Zenith ends, you can't use it again until you finish a Long Rest.</p>"
```

- Aufeinanderfolgende inhaltliche Absätze mit `<p>...</p>` abgrenzen.
- Aufzählungen als `<ul><li>...</li><li>...</li></ul>` ausgeben; **keine** rohen `•`-Aufzählungszeichen und keine Markdown-`-`-Listen im Effect-Text.
- Alle Regelwirkungen müssen vollständig bleiben; niemals technische Kommentare einfügen.
- Spezialzeichen innerhalb von HTML-Text sicher escapen (`&amp;`, `&lt;`, `&gt;` usw.). Keine Skripte, Events oder externen HTML-Elemente einbetten.
- **Unterschied:** `items[].description` bleibt bei v0.1.1 **Plain Text**, weil `scripts/schema.mjs` dort HTML escapt; rohes HTML dort würde sichtbar als Text erscheinen. Diese Einschränkung gilt **nicht** für `effects[].description`.
- Vor Auslieferung prüfen, dass HTML-Listen echt und geschlossen sind. Die QA-Prüfung lehnt rohe Bullets und unsichere HTML-Tags ab; ein Foundry-Livetest bestätigt das Rendering.


## v1.5 – Temporäre und bedingte Effects: „Always Show Effect Icon“ (Foundry v13 + DAE)

**Verbindliche UI-Zielvorgabe:** Im Effect-Editor soll die Checkbox **„Always Show Effect Icon“** aktiviert sein, wenn der Effekt als zeitlich begrenzter oder bedingter Buff/Debuff vorgesehen ist – beispielsweise **Sunlit Resolve (tagsüber)** und **Zenith (1 Minute)**.

**Import-JSON:**

```json
{
  "name": "Zenith",
  "icon": "icons/svg/aura.svg",
  "flags": { "dae": { "showIcon": true } },
  "transfer": false,
  "disabled": false,
  "changes": []
}
```

- `flags.dae.showIcon: true` steuert **DAEs Checkbox** „Always Show Effect Icon“. DAE Changelog 11.0.6 bestätigt den programmatischen Flag-Pfad für die Anzeige von Effekticons. Die genaue Wirkung ist weiterhin in unserer konkreten Modulversion durch Foundry-Livetest zu bestätigen.
- **Historische, widerlegte Feldregel (nicht mehr anwenden):** Frühere QA-Versionen nahmen `icon` statt `img` an. Foundry hat ActiveEffect.icon bereits in v12.317 zu ActiveEffect.img migriert. In v13 ist `img` nativ; v0.1.9 akzeptiert zusätzlich Legacy-`icon`. Siehe QA v2.11.
- Diese Einstellung bedeutet **nicht**, dass der Effekt automatisch aktiviert, jeden Tag umgeschaltet, beim Ablauf entfernt oder mit einer Activity verknüpft wird. Sie regelt nur die Sichtbarkeit des Symbols auf dem Token/Kampftracker, **wenn der Effekt angewendet wird**.
- Sunlit Resolve bleibt der bedingte Ausrüstungsbonus (`transfer:true`), dessen Tageszeit-Gültigkeit manuell kontrolliert wird. Zenith bleibt der Activity-gebundene Effekt (`transfer:false`); seine Aktivierung und Beendigung sind separat zu prüfen.
- Verwende kein v14-Top-Level-Feld `showIcon` für die v13-Daten. **Keine technischen Hinweise in der Effect Description**; dort stehen weiterhin vollständige D&D-2024-Regeln mit HTML-Listen.
- QA (aktualisiert v2.11): Fehlendes DAE-Flag bei temporären/bedingten Effects prüfen. Fehlendes `img` ist für normale Effects erlaubt (Vererbung); ein natives `img` ist ausdrücklich korrekt. Ein erfolgreicher QA-Test ist kein Live-Test in Foundry.

## Bestätigte Referenzen aus der gemeinsamen Ring-of-Sun-Fehlersuche

| Mechanik | Feld / Vorgehen | Stand |
|---|---|---|
| Requires Attunement | `system.attunement: "required"` | Im korrigierten Ring vom Nutzer bestätigt |
| +1 AC | `system.attributes.ac.bonus`, `mode: 2`, `value: "1"` | Funktion bestätigt; ursprünglicher Charakterfehler behoben |
| +1 globale Saving Throws | `system.bonuses.abilities.save`, `mode: 2`, `value: "1"` | Nutzer bestätigt |
| Alter falscher Save-Key | `system.rolls.ability.save.bonus` | **Nicht verwenden** für diese getestete Konfiguration |
| +Speed | `system.attributes.movement.bonus`, `mode: 2` | Beim Ring verwendet; auf Wirkung prüfen, falls D&D5e-System aktualisiert wird |
| Begrenzte Nutzung | `system.uses` plus Activity-`consumption` | Verbrauch und Long-Rest-Recovery in Foundry gesondert testen |
| Utility-Wurf | Activity `type:"utility"` mit `roll.formula` | Formeln in der Activity müssen vorhanden sein; Auswertung im Live-Test prüfen |
| Temporärer Buff | Effect `transfer:false`, Activity-`effects`-Link mit existierender `_id` | Strukturprüfung möglich, tatsächliche Anwendung mit Midi-QOL separat testen |
| Passive Boni | Effect `transfer:true` auf ausgerüstetem/attuned Item | Aktivierungsbedingungen in Foundry testen |

## Nicht automatisch gleichbedeutend mit „funktioniert“

- `automation:"full"` ist eine Absichtserklärung und kein Beweis.
- Ein Effekt in `effects` ist nicht automatisch auf ein Save-Result oder eine Activity verdrahtet.
- Eine Damage-Activity erkennt nicht ohne besondere Logik, ob es der **erste Treffer pro eigenem Zug** war.
- Tageszeit-, Concentration-, Zugbeginn- und Ende-bei-Save-Trigger werden nicht einfach vom Importer „verstanden“.
- Die im Importer verwendete `buildItemData`-Funktion validiert viele native D&D5e-Felder **nicht** vorab. Dazu braucht es einen Foundry-Datenmodell- und Praxistest.

## Vorlage für jeden Importbericht

**Objekt:** Name + Version. **Mechanikmatrix:** (Tabelle aus Regeln und Umsetzung). **Automatisiert:** explizite Liste. **Manuell:** explizite Liste. **QA:** Static PASS / Foundry Import offen / Midi-QOL offen. **Offene Warnungen:** klare Angaben. **Beschreibung:** vollständige englische D&D-2024-Regeln.

## Versionierung

Bei einem neuen dnd5e-Systemupdate zuerst die Bestätigungen für Attribute Keys, Activities und Attunement in einer Testwelt neu prüfen. Bei Änderungen am Importformat `schemaVersion` bewusst erhöhen und eine Migration implementieren. QA-Skripte können ohne Modul-Update im GitHub-Repository liegen; der Foundry-Release muss dafür nicht neu gebaut werden.


## v1.6 – Angriffsschaden, Critical Allowed und Quelltreue (verbindlich)

**Grundsatz:** Entscheidend ist die **Schadensursache**, nicht der Auslöser allein.

| Wortlaut/Mechanik | Foundry-v13/D&D5e-2024-Umsetzung |
|---|---|
| „The attack deals an additional XdY damage“ | Zusätzliche Damage-Parts **derselben Attack-Activity**. `damage.critical.allow: true`. |
| „The next time you hit, the attack deals ...“ | Bedingte Attack-Variante mit allen passenden Bonuswürfeln. Critical Allowed. |
| „On a hit, ...“ mit nicht-schädlicher Condition | Effect bzw. Status am Treffer; kein eigener Schaden, sofern keiner beschrieben ist. |
| „Immediately after you hit, ... expend a Charge ... save“ | Nach dem Treffer aktivierte Save-Activity, die die Ressource verbraucht. |
| „At the start of each of its turns, it takes XdY damage“ | Separate Damage-Activity: **kein** Schaden des vorherigen Angriffs; keine Crit-Verdopplung. |

**Regeln:**
1. Jede Attack-Activity mit Schadenswürfeln hat `damage.critical.allow: true`, einschließlich Reaction Attacks. Bedingte Angriffswürfel gehören in normale `damage.parts`, **nicht** in das Feld „Extra Critical Damage“ und **nicht** als unabhängige Damage-Activity.
2. Bei mehreren Bedingungen werden die **sämtlichen tatsächlich geltenden Boni** in benannten auswählbaren Attack-Activities abgebildet. Ein Bonus darf nicht doppelt enthalten sein. Nach Möglichkeit normale Grundattacke beibehalten.
3. Zusatzschaden, der erst bei einem späteren Zeitpunkt ohne Angriffswurf entsteht (etwa Gaol Chains am Zugbeginn), bekommt eine eigene Damage-Activity und darf nicht kritisch verdoppelt werden.
4. **Quelltreue:** Originalregeln nie nachträglich umschreiben, nur damit JSON-Aktivitäten konsistent wirken. Erst die *gesamten* Schadenswürfel einschließlich dauerhaftem Waffenbonus berechnen; dann die Activities bauen.
5. Wenn der Nutzer später **andere Werte** nennt als im ursprünglichen Regeltext, diese Differenz kennzeichnen und die intendierte neue Regel klären, bevor die alte Beschreibung durch eine neue ersetzt wird. Zur automatischen Prüfung kann ein separat versionierter **Referenzvertrag** verwendet werden.
6. „Critical Allowed“ ist eine verifizierbare JSON-Einstellung, aber die tatsächliche Würfelverdopplung ist weiterhin in Foundry/Midi-QOL zu testen.

**Gravemark: Widerspruch, nicht stillschweigend lösen.** Originaler Text: Weight +2d8 oder +3d8; Prison Remembers +2d8; dauerhafter Waffenbonus +1d8. Spätere Attack-Anweisung: Weight +1d8/+2d8 und kombinierte +3d8/+4d8. Beide Zahlenreihen sind nicht gleichwertig. Der Referenzvertrag `contracts/gravemark-original.qa.json` hält bewusst die **ursprünglichen** Werte fest und meldet Abweichungen der späteren Importdatei. Erst eine ausdrücklich bestätigte Regeländerung darf eine neue Vertragsversion begründen.

**Automatische QA v1.6:**
- Für attack-basierte Würfel: Fehler, wenn `damage.critical.allow` nicht `true` ist.
- Für benannte Regelabschnitte mit „the attack deals additional damage“: Fehler, wenn der Bonus unter derselben Fähigkeit als eigenständige Damage-Activity abgelegt ist.
- Für verzögerten Schaden (z. B. Gaol Chains Zugbeginn): separate Damage-Activity zulässig.
- Optionaler `--contract`-Check: vollständiger Quelltext-Abgleich auf vorgeschriebene Formulierungen, Typen, Krit-Einstellung und Summen der Bonuswürfel. **Nur Prüfmetadaten**, kein zusätzliches Foundry-Importfeld.
- Freie natürliche Sprache wird nicht in jedem Sonderfall semantisch korrekt erkannt; komplexe Features benötigen weiterhin einen manuellen Regelabgleich. 


## v1.7 – Native Level-Scaling für Features (Hunter's Angle)

- Ein Feature mit EINER Aktivierung wird **niemals** in mehrere auswählbare Stufen-Actions zerlegt, wenn D&D5e dafür `ScaleValue` oder native Formelskalierung bietet.
- Für Level-Schwellen 1/5/11/17: eine Bonus-Action-Activity, ein Active Effect und eine `system.advancement` vom Typ `ScaleValue` mit `configuration.type: "dice"` und den Levelwerten in `configuration.scale`.
- Der Effekt verwendet die native Referenz `@scale.<feature-identifier>.<scale-identifier>` statt hartkodierter Tier-Würfel. Bei Hunter's Angle lautet sie `@scale.hunters-angle.extra-damage`.
- Die Charakterlevel 1–4 = 1d4, 5–10 = 2d4, 11–16 = 3d4, 17–20 = 4d4. In der Quelle nicht enthaltene Skalierungsstufen dürfen nicht erfunden werden.
- Der Effekt ist **kein neuer Waffenangriff**: Er wird per Bonus Action aktiviert und modifiziert den nächsten passenden Ranged Weapon Attack. Half Cover, exakte Zielbindung und Entfernung vor Turn-Ende/bei verfehltem Angriff bleiben manuell, solange nicht live automatisiert.
- Der QA-Prüfer erkennt 4 Bonus-Actions, 4 Effekte, fehlende ScaleValue-Advancement, falsche Level-Tabelle, falsche Roll-Referenz und fehlende Verknüpfung. Nach Syntax/Parser/QA ist ein **Foundry v13 + installierte D&D5e 5.x + Midi-QOL Livetest** notwendig, bevor die Wirkung als bestätigt gilt.
- **Nicht verwechseln**: Die Scaling-Option in der Activity-Consumption steuert den Ressourcenverbrauch bzw. die skalierbare Nutzung einer Activity; die hier benötigte Level-Progression folgt dem Scale-Value-Advancement. Die konkreten Feldnamen müssen mit der installierten D&D5e-Systemversion abgeglichen werden.
- Achtung: In Foundry können ScaleValues auf Feature-Items versionsabhängig sein. Sollte `@scale.hunters-angle.extra-damage` nach Import nicht im Actor verfügbar sein, muss das über die Source-Item-/Class-Advancement-Verknüpfung untersucht werden, statt sofort wieder vier Buttons zu bauen.


## v1.8 – Verbindliche Klassifizierung sämtlicher Import-Items

**Kernregel:** Jedes Feature erhält vor dem Import eine **explizite** inhaltliche Kategorie (`classification`) und die passende native D&D5e-Item-Kategorisierung in `system.type`. `kind: "feature"` alleine ist nicht ausreichend. Auch bei Spells, Weapons und Ausrüstung werden die jeweiligen nativen Detailfelder geprüft. Fehlende Angaben sind **ERROR** statt stillschweigend Standardwerte zu akzeptieren. Der Importer selbst bleibt v0.1.1 und muss nicht aktualisiert werden.

| Gewünschte Kategorie | `classification` | Erwartete native Felder (Foundry/D&D5e – Live-Bestätigung siehe Hinweis) |
|---|---|---|
| Monster Feature | `monster-feature` | `system.type.value: "monster"` |
| Class/Subclass Feature | `class-feature` | `system.type.value: "class"` |
| Allgemeines Feature | `general-feature` | `system.type.value: "other"` (vorläufig!) |
| Feat (generisch) | `feat` | `system.type.value: "feat"` |
| General Feat | `general-feat` | `system.type.value: "feat"`, `subtype: "general"` (vorläufig!) |
| Origin Feat | `origin-feat` | `system.type.value: "feat"`, `subtype: "origin"` (vorläufig!) |
| Fighting Style Feat | `fighting-style-feat` | `system.type.value: "feat"`, `subtype: "fighting"` (vorläufig!) |
| **Maneuver** | **`fighting-style-feat`** | **Feat mit Fighting-Style-Subtype; nie eine neue Item-Klasse** |

**Wichtig:** Die Foundry-native `system.type`-Struktur ist dokumentiert, aber mehrere exakte Enumwerte der dnd5e-5.x-Unterkategorien sind **nicht in deinem Live-System verifiziert**. Unser Prüfer warnt bei den als „vorläufig“ gekennzeichneten Mappings. Erst wenn ein manuell in Foundry erstellter Feature-Eintrag exportiert wurde, übernehmen wir seine exakten `system.type.value/subtype`-Werte als *bestätigt*. Das QA-Kit behauptet nicht, seine eigenen vermuteten Enumwerte seien ein D&D5e-Livetest.

### Andere Itemtypen

- **Spell/Cantrip:** `kind: "spell"` bzw. `cantrip`, natives `system.level` (0–9) und `system.school` setzen. Ein Zauber ist kein Feat; er bekommt keine Feat-`classification`.
- **Weapon, Equipment, Consumable, Tool, Loot:** korrekter `kind` plus native Unterkategorie `system.type.value` (beispielsweise Ring/Trinket, Longsword-Typ oder Potion-Typ), nicht nur den Namen/Beschreibungstext.
- **Class, Subclass, Container:** die native Itemklasse korrekt anlegen; keinesfalls ungeprüft eine Feat-`system.type.value` erzwingen, wo dieses Feld nicht zum Datenmodell gehört.

### Zwei-Schritt-Qualitätssicherung

1. Ich ordne jedes Item anhand der Benutzerbeschreibung einem eindeutigen Typ zu. Bei Zweifeln nehme ich **keine** heimliche Standardkategorie an.
2. Bei Feats erst `classification` festlegen, dann `system.type.value/subtype` entsprechend setzen. Mit `node tools/apply-classifications.mjs INPUT.json OUTPUT.json` können die nativen Felder aus einer bereits expliziten Kategorie gesetzt werden, niemals gegen widersprüchliche vorhandene Werte.
3. Danach `node tools/validate-import.mjs OUTPUT.json` ausführen. Nur **0 ERROR** ist statisch zulässig.
4. In Foundry v13 mit genau deiner installierten D&D5e-Systemversion einen Live-Import prüfen (Details-Feld), bevor der Wert „bestätigt“ markiert wird.

### Regressionsfälle

Das QA-Kit lehnt fehlende Feature-Kategorie, fehlende native Unterkategorie, falsche Feat-/Maneuver-Zuordnung, widersprüchliche Systemfelder und Spells ohne Level/School ab. Die sieben Kategorien sind als Test-Items unter `examples/23-feature-classification-input.json` und `examples/24-feature-classification-ready.json` enthalten.


## v1.9 – Kritische Fehlklassifizierung Fighting Style

**In Foundry v13 live beobachtet:** Der zuvor angenommene native Wert `system.type.subtype: "fighting"` hat **Feat Type leer** gelassen. Er ist für diese Installation nachweislich falsch. Die v1.8-QA-Prüfung hat irrtümlich eine nur vermutete Enumeration als korrekt akzeptiert.

**Verbindliche Regel:** Für `kind: "maneuver"` / `classification: "fighting-style-feat"` müssen zwei unabhängige Bedingungen erfüllt sein: `system.type.value: "feat"` und ein **aus der laufenden Foundry-Installation ausgelesener** gültiger `system.type.subtype` für *Fighting Style*. Keine Fantasiewerte. Die Kandidatenliste kann per GM-Script-Makro aus `CONFIG.DND5E.featureTypes.feat.subtypes` ausgelesen werden.

- `"fighting"` wird durch QA v1.9 als **ERROR** verworfen.
- Fehlender `system.type.subtype` wird als **ERROR** verworfen.
- Jeder andere derzeit noch nicht live verifizierte Wert ergibt mindestens **WARN**. Vor der nächsten als 'korrekt' bezeichneten Importdatei ist die genaue Foundry-Fassung und der dort ausgelesene Wert zu dokumentieren.
- Der Importer v0.1.1 verändert dieses Feld nicht: die JSON muss den richtigen nativen Wert selbst enthalten.
- D&D5e-Dokumentation bestätigt `CONFIG.DND5E.featureTypes` als Konfigurationsquelle: https://github.com/foundryvtt/dnd5e/wiki/Modifying-Your-Game-with-Scripts
- Die bestehende Hunter's-Angle-Datei mit `"fighting"` ist eine **bekannte fehlerhafte Regression-Datei**, kein Referenzbeispiel für einen gelungenen Import.


## QA v2.0 – Fighting Style Candidate und Regression

- Nach dem *Live-Fehler* `system.type.subtype: "fighting"` (Feat Type blieb leer) nutzt der neue Test `system.type.value: "feat"` und `system.type.subtype: "fightingStyle"` für `classification: "fighting-style-feat"`.
- `fighting`, `fighting-style`, fehlende Subtypes oder Widersprüche werden als **ERROR** abgelehnt. Der automatische Klassifizierungshelfer setzt bei explizitem `fighting-style-feat` den Kandidaten `fightingStyle`.
- **Status:** `fightingStyle` ist eine aus der typischen dnd5e-5.x-camelCase-Konvention abgeleitete Hypothese, **noch nicht live in deiner Foundry-v13-Welt bestätigt**. Auch bei 0 ERROR bleibt deshalb eine **WARN** bis zur Bestätigung im Dropdown. Erst dann darf die Warnung entfernt werden.
- Eine QA-Datenprüfung bestätigt die Struktur der JSON. Sie beweist nicht, dass ein Dropdown die Kategorie im Spiel anzeigt. Die Tests dürfen diesen Unterschied nicht verschleiern.
- Hunter's Angle ist weiterhin ein Legendary Maneuver → Fighting Style Feat, genau **eine Bonus Action**, **ein Effekt**, native `ScaleValue`-Advancement mit 1d4/2d4/3d4/4d4 auf Level 1/5/11/17. Zielbindung, Cover und Einmaligkeit bleiben für diesen Test manuell zu prüfen.
- Beispiel: `examples/24-hunters-angle-fighting-style-corrected.json`.


## v2.1 – Bedingter Post-Hit-Bonusschaden als eigene Damage-Activity (Hunter’s Angle)

**Neue verbindliche Ausnahme zur Regel für Angriffsschaden:** Wenn ausdrücklich eine **manuell nach einem bereits gewürfelten Angriff ausgelöste Schadens-Activity** gewünscht ist, erstellen wir **keinen dauerhaften Damage-Bonus-Active-Effect**. Stattdessen:

1. Eine **Utility-Activity** für die eigentliche Bonus Action, ohne Damage Roll.
2. Genau **eine Damage-Activity**, die erst nach einem Treffer manuell verwendet wird und **`damage.critical.allow: true`** besitzt. Diese Activity darf keine zusätzliche Action oder Bonus Action kosten.
3. Die Damage-Activity muss mit dem Charakterlevel skalieren, ohne zusätzliche Stufen-Activities. Für *Hunter's Angle* (Level 1–4: 1d4; 5–10: 2d4; 11–16: 3d4; 17–20: 4d4) ist die native Actor-Rolldata `@details.level` verfügbar. Aktueller Testansatz als Custom Damage Formula: `(1 + floor((@details.level + 1) / 6))d4`.
4. **Keine automatisch auf jeden Fernkampf-Angriff übertragene `system.bonuses.rwak.damage`-AE**. Ziel, Half Cover, Trefferprüfung und einmalige Nutzung werden im angegebenen Workflow manuell kontrolliert.
5. Das Original spezifiziert **keinen festen Schadentyp**: Der Zusatzschaden soll den Schadentyp der getroffenen Waffe erhalten. Eine eigenständige Damage-Activity kann diesen Typ in v0.1.1 nicht sicher dynamisch übernehmen; daher im Test keine erfundene feste Damage Type setzen und beim Würfeln gegebenenfalls manuell angleichen.
6. **Critical Allowed macht den Bonus wählbar kritisch**, erkennt aber einen zuvor ausgeführten Weapon Crit nicht automatisch. In D&D5e 5.x wurden zudem Bugs bei komplexen Custom Damage Formulas und Criticals gemeldet. Das tatsächliche Verdoppeln der Würfel ist zwingend in Foundry v13 mit Midi-QOL live zu prüfen.

**Abgrenzung:** Wenn Nutzer *automatischen* zusätzlichen Attack-Damage bei einem Treffer verlangt, ist die bevorzugte Umsetzung weiterhin ein bedingter Attack-Damage-Part oder ein bestätigter Midi-QOL-Workflow. Die Ausnahme oben gilt nur für den ausdrücklich gewünschten **separaten Post-Hit-Damage-Wurf**. Ein generelles Verbot eigenständiger Damage-Activities für alle on-hit-Boni wäre ebenso falsch wie ihre ungefragte Verwendung.

**QA-Konvention:** `items[].flags.world.coastForgeDamageTiming = "manual-post-hit"`. Dieses Flag ist ausschließlich Entwicklungsmetadatum und automatisiert nichts in Foundry. Der Validator verlangt dann eine Bonus-Action-Aktivierung, eine Damage-Activity mit Critical Allowed, keine persistente Damage-Bonus-AE und eine dynamische Schadensformel. Für die Schadensart/Crithäufigkeit bleibt ein Foundry-Livetest erforderlich.


## QA v2.2 – Gültige Foundry-v13-Document-IDs und Fighting-Style-Feld

**Livetest-Fehler:** `MidiDamageActivity [HAngleDamage002] validation errors: _id: must be a valid 16-character alphanumeric ID`. Die ursprüngliche ID hatte nur **15 Zeichen**. Der Importer v0.1.1 reicht explizite `_id`-Werte durch; deshalb konnte die Datenschema-Prüfung des D&D5e-Systems scheitern.

**Verbindliche Regeln:**

- Bei neuen Activity- und Effect-Objekten **`_id` bevorzugt weglassen**, sofern kein Verweis diese ID benötigt. Coast Forge v0.1.1 erzeugt automatisch IDs via `foundry.utils.randomID()`. Dies ist bei Hunter's Angle mit zwei unabhängigen Activities der Fall.
- Eine ausdrücklich übergebene `_id` muss exakt **16 Zeichen [A-Za-z0-9]** lang sein. Mehrfach verwendete IDs innerhalb eines Items sind unzulässig. Der neue QA-Prüfer erzwingt dies vor dem Foundry-Import.
- `Hunter's Angle` bleibt `kind: "maneuver"`, `classification: "fighting-style-feat"`, mit `system.type.value: "feat"` und dem bisherigen **noch nicht live bestätigten** Kandidaten `system.type.subtype: "fightingStyle"`. Der Name `Fighting Style` darf **nicht** als verifiziert behauptet werden, bevor die Auswahl im tatsächlichen Foundry-v13-Sheet korrekt angezeigt wird. Der belegte Fehler bisher war `fighting`, nicht `fightingStyle`.
- Die **Bonus-Action-Utility-Activity** und die **separat nach einem Treffer aufgerufene Damage-Activity** bleiben erhalten, ebenso `damage.critical.allow: true`. Keine dauerhafte Damage-AE.
- Der Würfelbonus bleibt bei Stufen 1–4 `1d4`, 5–10 `2d4`, 11–16 `3d4`, 17–20 `4d4`. Die verwendete Formel ist ein weiterer **Livetestpunkt**, kein durch JavaScript-Tests garantierter Foundry-Wurf.
- Der QA-Code verwendet die native Item-JSON vor dem Import; ein erfolgreicher QA-Durchlauf ist **nicht gleichbedeutend** mit einem bestandenen Foundry-/Midi-QOL-Livetest.

**Regression:** die Testdatei `examples/25-hunters-angle-damage-activity.json` muss nun wegen ihrer 15-stelligen Damage-Activity-ID scheitern; die Korrektur `examples/26-hunters-angle-fighting-style-id-fix.json` muss die neue Prüfung bestehen.


## QA v2.3 — Native Scale Value Advancements (Hunter’s Angle)

**Verbindlich:** Wenn der Nutzer ausdrücklich die native `ScaleValue`-Advancement-Tabelle verlangt, niemals ersatzweise arithmetische Formeln wie `floor((@details.level + 1)/6)` ausgeben. Die Level-Werte 1/5/11/17 gehören als `dice`-Skalierung in `system.advancement`, die Damage-Activity referenziert `@scale.<parent-identifier>.<scale-identifier>`. Keine vier duplizierten Activities.

**Wichtige Einschränkung:** Laut offizieller D&D5e-Roll-Formula-Dokumentation sind Standard-`ScaleValue`-Quellen Class, Subclass, Species/Race oder Background. **Ein selbstständiges Feat mit `system.advancement` ist nicht automatisch eine funktionsfähige Scale-Quelle**. Wenn kein Parent-Item mit funktionierender Advancement-Registrierung bekannt ist, darf der Export lediglich als `TEST`/unbestätigt bezeichnet werden, keinesfalls als in Foundry bewiesen funktionierend. Zur robusten Lösung muss die Progression in das zugehörige Class/Subclass-Advancement integriert und der `@scale`-Pfad darauf ausgerichtet werden.

**Erforderliche QA-Checks:**

- `Damage`-Activity besitzt `damage.critical.allow: true`.
- Exakt eine Bonus-Action- und eine Damage-Activity für Hunter’s Angle.
- `system.advancement[].type` ist `ScaleValue`, `configuration.type` ist `dice`.
- `configuration.scale`: Level 1→1d4, 5→2d4, 11→3d4, 17→4d4.
- Keine Level-Arithmetik in Damage-Formeln, keine vier Stufen-Actions.
- Quelle des `@scale`-Wertes ist explizit dokumentiert. Ein ungeprüftes Feat-eigenes Scale wird **WARN**, niemals „vollständig funktionsfähig“.
- Die echte Würfelberechnung und der gewählte Feat Type „Fighting Style“ benötigen weiterhin Foundry-Livebestätigung.

**Testfall:** `27-hunters-angle-advancement-scaling-TEST.json` verwendet die gewünschte Native-Scale-Struktur als expliziten Test. Falls D&D5e auf dem Feat keine Skala bereitstellt, kein `@details.level`-Workaround! Stattdessen Parent-Item-Integration umsetzen.


## QA v2.4 — Produktionsmodus, bestätigte Vorlagen und PB-Limited Uses

**Ziel:** Der normale Import soll nicht jedes Mal das gesamte QA-Kit neu entwickeln. Bekanntes wird aus der zuletzt erfolgreich getesteten Referenz-Datei übernommen; neue Mechaniken bekommen nur dann neue Tests und einen neuen QA-Stand, wenn der reale Import einen neuen Fall aufdeckt.

### Bestätigte Referenzen — Umfang der Bestätigung

| Referenz | Vom Nutzer in Foundry bestätigt | Noch gesondert zu prüfen |
|---|---|---|
| `examples/27-hunters-angle-advancement-scaling-TEST.json` | Der Nutzer hat die native `ScaleValue`-Struktur für Hunter's Angle als **richtig und gut umgesetzt** bestätigt. Die Ein-Button-/Post-Hit-Activity-Struktur bleibt verbindlich. | Ob jede Stufe, der Critical-Roll und insbesondere *Feat Type → Fighting Style* im Details-Dropdown vollständig korrekt sind, wurde nicht separat bestätigt. |
| `examples/28-brutal-follow-through-legendary-maneuver.json` | Der Nutzer hat erklärt: **„Super das Ding funktioniert.“** Gemeint ist die importierte Technik mit `@prof` Damage, PB-Maximum und Long-Rest-Recovery. | Fighting-Style-Subtype weiterhin nicht ausdrücklich im Dropdown nachgewiesen; genauer Schadenstyp laut Originaltext nicht spezifiziert. |
| Ring of Sun (mehrere JSON-Tests) | AC nach Charaktersheet-Korrektur, globaler Save-Bonus mit `system.bonuses.abilities.save`, grundlegende Item- und Effect-Struktur. | Zenith/Temporal-Effect-Verhalten und DAE-Symbolanzeige nicht pauschal als live verifiziert einstufen. |
| Gravemark | Import komplexer Waffen und Activities als weitgehend erfolgreich gemeldet. | Korrekte Crit-Würfe aller kombinierten Varianten, Charges und bedingte Effekte pro Mechanik weiterhin separat testen. |

**Keine falschen Garantien:** User-Erfolgsmeldungen gelten für den getesteten Gesamtworkflow, nicht automatisch für jede einzelne intern vermutete Eigenschaft.

### Verbindliches Muster: einmal pro Treffer, PB-Schaden und PB-Uses

Für den Originaltext von **Brutal Follow-Through**:

- `kind: "maneuver"` und `classification: "fighting-style-feat"`; nativer Feat-Subtype bleibt als eigener Live-Kontrollpunkt.
- **Eine** Damage-Activity, `activation.type: "special"`, **kein** zusätzlicher Action-/Bonus-Action-Aufwand.
- `damage.parts[].custom.formula: "@prof"` für den festen Bonus; **keine Würfel** und keine erfundene Skalierung.
- `damage.critical.allow: true` gemäß gewünschtem importiertem Activity-Standard. Der **feste** Bonus wird durch einen Crit nicht verdoppelt.
- `system.uses.max: "@prof"`, `system.uses.recovery: [{"period":"lr","type":"recoverAll"}]` und genau **1** `itemUses`-Verbrauch beim Einsatz.
- Der Stoß 10 Feet und *Large or smaller* bleiben in der englischen Description und werden manuell abgewickelt. Keine unbestätigte automatische Push-Makrologik erfinden.
- Die Beschränkung **once during each of your turns** ist eine eigene Regel neben der PB-Verbrauchsanzeige. Nicht als kostenpflichtige Bonus Action missverstehen.
- Statischer QA-Test validiert `@prof`, Long Rest, Verbrauch, Kosten, Critical Allowed und die exakte Formula. Dieser Test allein beweist noch keine Midi-QOL-Abwicklung bei anderen Foundry-/D&D5e-Minorversionen.

### Produktionsfreigabe (neue verbindliche Definition)

1. **Quelltext lesen:** Regelteil + Trigger + Schadensquelle + Zeitpunkt + erforderliche Ressourcen bestimmen. Keine Textänderungen oder stillschweigenden Neugewichtungen.
2. **Vorlage wählen:** Hunter's Angle für native Advancement-Skalierung; Brutal Follow-Through für PB-Ressourcen und nach dem Treffer gewürfelten festen Schaden; Gravemark für Weapon-Attack-Varianten; Ring of Sun für Attunement und Effekte.
3. **Format prüfen:** `scripts/schema.mjs` des **installierten** Importers lesen, danach `tools/validate-import.mjs` und `node --test tests/*.test.mjs` ausführen.
4. **Release-Notiz:** Nur Dateien liefern, die die statische Prüfung bestanden haben; offene D&D5e-/Midi-QOL-Fragen als Live-Test deklarieren. Keine künstlichen Versprechen zu vollautomatischen Effekten.
5. **QA nur bei echtem Befund aktualisieren:** Neues Schema-/Datenproblem → Regressionsfixture und Test; bekannte Vorlage → direkt JSON liefern. Der Benutzer erhält standardmäßig **eine JSON-Datei**, nicht immer eine neue QA-ZIP.

### Nächste Modulversion — vorbereiteter Scope, noch nicht implementiert

**Coast Forge Importer v0.1.2 (Plan):**

- Im **Importdialog** dieselben QA-Warnungen wie im externen Prüfer sichtbar machen, insbesondere ungültige IDs und fehlende native Subtype-Felder.
- Feat Type / Fighting Style anhand der **tatsächlich laufenden D&D5e-Konfiguration** validieren, statt geratenen Enum-Werten blind zu vertrauen; importierte Items gegen die erlaubten Select-Optionen prüfen.
- Vor dem eigentlichen Erstellen eine Übersicht von Activities, Uses, Damage, Recovery und Effects anzeigen; invalides Schema blockieren und verständliche Fehler liefern.
- Im späteren Schritt `@UUID`-Condition-Links und sauberes HTML-Rich-Text-Rendering ergänzen; nur nach gesondertem Test.
- Automatisches Umschreiben von Nutzer-Regeltexten, erzwungenes Ändern der Homebrew-Balance und ungetestete Makros **nicht** als Release-Ziel.

**Release-Routine:** Neue Modulversion benötigt aktualisierte `module.json` im Repository **und** im GitHub-Release, zusammen mit einer ZIP gleichen Versionsnamens. Reines QA-Update ändert die installierte Modulversion **nicht**.


## QA v2.5 — Native ItemGrant-Verknüpfungen und individuelle Icons

- Coast Forge Importer v0.1.2: Nutzer bestätigte individuelle Icon-Auswahl und erfolgreichen Legendary-Cantrip-Import. Item-Bilder werden über das native `img`-Feld gespeichert.
- The Golden Ledger: Parent-Feat plus vier eigenständige Features; alle Grants bei Erhalt (Level 0). Nutzer bestätigte das korrigierte GM-Verknüpfungsmakro. Der ursprüngliche Fehler `advancements.find is not a function` belegt, dass Advancements nicht immer Arrays sind. Array und ID-keyed Object müssen unterstützt werden. Bei Objektstruktur gezielte Update-Pfade verwenden; nach dem Update gespeicherte UUIDs erneut prüfen.
- v0.1.3 (lokal gebaut, Live-Test ausstehend): optionale Item-Metadaten `ref` und `grantLinks`; schemaVersion bleibt 1. Ein Grant-Link besitzt `advancementId` und `refs`. Der Parent enthält einen nativen, zunächst leeren ItemGrant mit gültiger 16-stelliger ID. Nach Erstellung aller Items werden echte UUIDs in `configuration.items` geschrieben. Keine geratenen UUIDs.
- Verknüpfte Imports nur in World Items, nicht direkt auf einen Actor. Fehlende, doppelte, selbstreferenzielle oder zyklische Referenzen werden abgelehnt. Bereits existierende Items ohne passende lokale Referenz werden nicht überschrieben; nach fehlgeschlagenem Import können bereits erstellte Dokumente verbleiben.
- `examples/30-the-golden-ledger-auto.json` ist die neue Testdatei. Automatische Vergabe bei Hinzufügen des Feats und spätere Levelaufstiege sind noch nicht live bestätigt.
- Lokale Tests v0.1.3: 21/21 bestanden (11 bestehende Icon-Tests plus 10 Grant-Tests). Mock-Tests sind kein Foundry-Livetest. Die historische 92-Test-Suite aus QA v2.4 wurde nicht erneut ausgeführt.
- Weiterhin bestehende v2.4-Regeln bleiben verbindlich.

## QA v2.6 — Compendium References, Update-Modi und Live-Befund v0.1.3

- **Live bestätigt:** The Golden Ledger v2 (Parent plus fünf Child Features) wurde nach Bereinigung des Zielordners vollständig importiert, inklusive individueller Icons und fünf Grant-Links. Zuvor blieben Icons bei vorhandenen Items durch den Duplikatschutz unverändert. Vergabe auf Actors/Levelaufstieg und jeder einzelne Calculated-Influence-Wurf sind nicht separat bestätigt.
- **v0.1.4:** SchemaVersion 1 bleibt. Optional `effectRefs`, `compendiumGrants`, `[[condition:Name]]`. Syntax und Beispiele siehe README. Resolver verwendet ausschließlich explizit gewählte/angegebene Compendium-Packs und exakte Namen; fehlende oder mehrdeutige Treffer stoppen den Import vor Item-Erstellung. Keine geratenen UUIDs, keine Änderungen an Quell-Packs.
- Custom Conditions im v13-Item-Compendium als Feature mit eingebettetem Active Effect; optional gleichnamiger Journal Entry in Journal-Compendium. `effectRefs` braucht existierende Activity-ID (16 alphanumerische Zeichen), ggf. `effectName`, explizites `onSave` bei Bedarf. Der kopierte Effect erhält eine neue ID und passenden Activity-Link, `transfer:false`, `disabled:false`, `flags.dae.showIcon:true`. Historisches Resolver-Verhalten (weiterhin in v0.1.8): Regeln, Changes, Status, Dauer und sonstige Flags bleiben aus der Quelle erhalten, alte Herkunft und Startzeitpunkte werden entfernt. Für neue Imports gilt v2.10: Quelle vorher auf Timer prüfen und timerfrei vorbereiten; keine automatische Ablaufkonfiguration übernehmen. Default-SVG oder fehlendes Bild durch Feature-Artwork ersetzen, individuelles Effect-Artwork behalten. Quell-Makros müssen vorhanden sein; Importer führt sie nicht selbst aus. Keine dynamische Synchronisierung von Effect-Kopien.
- **Korrektur zu historischem v1.5:** Die aktuelle offizielle Foundry-v13-API (`https://foundryvtt.com/api/v13/classes/foundry.documents.ActiveEffect.html`, `defineSchema`) weist `img` als natives ActiveEffect-Bildfeld aus, nicht `icon`. Bei Compendium-Kopien natives `img` verwenden und ggf. Legacy-`icon` als Eingangswert akzeptieren. Alte Importdateien/Parser werden nicht rückwirkend verändert. Native `showIcon` ist weiterhin nicht als v13-Top-Level-Eingabe vorausgesetzt; DAE-Flag verwenden. Diese Korrektur überstimmt frühere gegenteilige QA-Feldregeln für neue Daten. Live prüfen.
- `[[condition:Name]]` wird bei ausgewähltem Journal-Pack zum echten `@UUID[...]`-Link. Ohne Journal-Pack Klartext plus Warnung; bei fehlendem/mehrdeutigem Journal in ausgewähltem Pack Fehler. Native `&Reference` bleibt unverändert; Darstellung und Zugriff für Spieler prüfen.
- `compendiumGrants` verweist auf tatsächliche UUIDs vorhandener Item-Dokumente im gewählten Compendium. Native ItemGrant-ID muss existieren und leer sein; keine Überschneidung mit lokalen Grant-Links für dieselbe Advancement-ID. Nur World Items.
- **Update-Modi:** Default Skip unverändert. Icons-only schreibt ausschließlich bewusst geänderte Bilder bestehender Items; vorhandene Parents werden nur auf bereits korrekte Links geprüft. Full Update ersetzt Systemdaten und eingebettete Effects im Zielordner, behält Top-Level-UUID, altes Icon ohne neue Auswahl, Ordner und Berechtigungen. Neue IDs für Activities/Effects möglich; manuelle Änderungen an System/Effects können verloren gehen. Keine automatische Actor-Aktualisierung. Gleichnamige mehrdeutige Ziele blockieren Updates. Nicht transaktional, Backup/Testwelt nötig.
- **Teststatus:** 47/47 Node-Mock-Tests (21 bisherige, 26 zusätzliche). Alte 92er-Testsuite nicht enthalten. Foundry-/Forge-Livetests für alle neuen Funktionen ausstehend; Mock-Tests belegen keine Midi-QOL-Effect-Anwendung oder konkrete Timer-Funktion.
- Testfixture: `examples/33-drenching-slam-compendium-TEST.json`. Drenched aus Compendium übernehmen, nicht nachbauen. Drenched-Dauer bis zum zweiten eigenen Zugbeginn bleibt Regeltext; gemäß v2.10 manuell beenden. Bereits konfigurierte Quell-Timer prüfen und bei Bedarf vor dem Import entfernen.


## QA v2.7 — Journal-Link-Korrektur (Importer v0.1.5)

- Nutzerbefund v0.1.4: Drenched-Effect-Kopie funktioniert laut Nutzer; Journal-Link fehlt und Journal-Einträge sind im Auswahlmenü nicht auswählbar. Genaue Ursache des leeren Menüs in der Live-Welt noch nicht bestätigt. Codebefund: nur Compendium-Packs wurden angeboten; fehlende Auswahl führte zu Klartext statt Link.
- `Condition Journals` bietet jetzt JournalEntry-Packs (Dokumenttyp mit Fallback auf Dokumentklasse/Metadaten) sowie einzelne World Journals. Keine Änderungen an Quell-Journals.
- `[[condition:Name]]` ist zwingend ein echter `@UUID[...]{Name}`-Verweis auf einen exakten Journal Entry oder eine Page innerhalb der ausgewählten Quelle. Ein Entry hat Vorrang vor seiner eigenen gleichnamigen Page; Mehrdeutigkeit zwischen Dokumenten und fehlende Treffer sind Fehler. Kein Klartext-Fallback mehr. Dies überstimmt QA v2.6. Journal-Pack-Inhalte werden pro Import zwischengespeichert.
- `effectRefs` und Journal-Link sind unabhängige Funktionen: Kopie für Activity-Automatisierung, UUID-Link für Regeltext. Ein Link-only-Item braucht keine Effect-Kopie. Bestehende JSON ohne Platzhalter bleibt kompatibel.
- Vorhandenes Drenching Slam im Standardmodus Skip wird nicht aktualisiert; Testitem verschieben oder löschen, oder bewusst World-Item-Vollupdate in Testwelt verwenden.
- 57/57 lokale Node-Mock-Tests bestanden (47 bisherige Testfälle mit korrigierter Klartext-Erwartung, 10 zusätzliche). Foundry-/Forge-Dropdown, anklickbarer Link, Spielerzugriff und Midi-QOL-Laufzeit bleiben offen. Die historische 92er-Testsuite ist nicht verfügbar.


## QA v2.8 — Importdialog v0.1.6

Live-Befund v0.1.5: beim Ausklappen der Compendium-Referenzen waren untere Felder nicht erreichbar. Quellcode enthält alle drei Selects. Ursache als Layout-Hypothese behandelt. v0.1.6 begrenzt die Formularhöhe auf 65vh und aktiviert vertikales Scrollen; kleineres Textfeld und resizable window. Keine Änderung an Resolver, Parser, Grants, Updates oder Icons. Foundry-Livetest für Scrollbarkeit und Journal-Link offen.


## QA v2.9 — Freie Zielordner und allgemeine Referenzen (Importer v0.1.7)

- Live-Befund: Nutzer bestätigte, dass die zuvor abgeschnittenen Quellenfelder durch Browser-Zoom erreichbar waren. Drenched-Effect-Kopie wurde bestätigt; fehlende Effect Description stammte aus der Quelle, nicht aus dem Resolver. Journal-Link-Rendering wurde nicht ausdrücklich separat bestätigt. Creator’s Sorcery wurde laut Nutzer importiert; sichtbare Levelangaben und Spell-Links fehlten. Automatische Actor-Vergabe und Einzelmechaniken weiterhin nicht pauschal als bestätigt werten.
- Zielordner frei wählbar (nur Item-Ordner, inklusive Unterordner); Standard `Coast Forge Imports` bleibt. Duplikate/Updates ausschließlich im Zielordner. Verschobene Items in anderen Ordnern werden nicht automatisch aktualisiert; UUID bleibt beim Verschieben eines World Items erhalten. Keine Vollupdates auf Actor-Kopien.
- Externe Grants und Description-Links: mehrere bevorzugte Item-Compendiums, bei keinem Treffer automatische Suche in übrigen Item-Packs; genaue Namen mit Apostrophnormalisierung, optional native Typprüfung. Expliziter `pack` ist strikt. Mehrdeutige Treffer stoppen den Import vor Item-Schreibvorgängen, kein Erraten der richtigen Regelversion. `effectRefs` und `[[condition:Name]]` behalten ihre bisherigen Quellenbeschränkungen. Diese externe Suchregel überstimmt frühere Einzel-Pack-Regeln für externe Item-Grants.
- In zukünftigen englischen Item-Descriptions alle konkret benannten Spells mit expliziten `[[spell:Name]]`-Platzhaltern verlinken, entsprechend auch vorhandene Compendium-Features `[[feature:Name]]` und Items `[[item:Name]]`. Optional `|pack.id` für feste Quelle. Verweise in Effect-Descriptions nur bei sicherem, explizitem Platzhalter und gültigem HTML. Bereits aufgelöste Grant-UUIDs für Links wiederverwenden; keine Fantasie-UUIDs, keine automatische Umschreibung unmarkierter Wörter. Externe Links werden vor Erstellung aufgelöst. Neue lokale Items im selben Batch sind als freie Description-Links noch nicht unterstützt.
- Class-/Subclass-Features müssen in ihrer Description mit `Level N: Feature Name` beginnen, in `system.requirements` die konkrete Klasse und Level führen und `system.prerequisites.level` numerisch setzen. ItemGrant-Level muss dazu passen. `prerequisites.level` ist eine generische Level-Voraussetzung; die Klassenlevel-Vergabe erfolgt durch das native Advancement. Ob Details das Feld bei Class Features anzeigt, im D&D5e-5.x-Livetest kontrollieren. Nicht automatisch den Regeltext oder Level von alten JSONs verändern.
- `examples/35-creators-sorcery-v2-TEST.json` als neuer Testfall für 7 lokale Feature Grants plus 14 externe Spell Grants, jeweils sichtbare Feature-Level und konsistente UUIDs. Kein Nachbau vorhandener Zauber.
- Teststatus: unveränderte v0.1.6 57/57 bestanden; v0.1.7 75/75 (18 zusätzliche Tests). Mock-Tests, keine echten Foundry-/Midi-QOL-Tests. UI und echte Datenmodell-Anzeige separat prüfen. Historische 92er-Suite nicht im Archiv.
