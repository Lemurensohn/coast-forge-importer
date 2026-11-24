# Coast Forge — Verbindlicher Import- und Qualitätsstandard v1.5

**Zielsystem:** Foundry VTT **v13**, D&D5e **2024-Regeln**, installiertes **dnd5e 5.x** (exakte Minor-Version im Live-Test feststellen), Midi-QOL und ggf. DAE; Hosting: The Forge.

**Importer:** Coast Forge Importer **v0.1.1**, JSON-`schemaVersion: 1`. Die Code-Datei `scripts/schema.mjs` ist die verbindliche Quelle für gültige Importdaten; dieses Dokument ergänzt, aber ersetzt sie nicht.

## Arbeitsprozess: bei JEDEM Item

1. **Regeltexte strikt trennen:** `items[].description` ist der vollständige englische, lesbare D&D-2024-Regeltext des Items. `items[].effects[].description` enthält den **vollständigen Regeltext der benannten Fähigkeit**, zu der der Effekt gehört – auch Wirkungen, die separat gewürfelt oder manuell durchgeführt werden; ebenfalls in Spieler-Regelsprache. Keine technische Key-Liste und keine Bedienungs-/Testanweisungen in einer der beiden Descriptions. Keine unbeabsichtigten Änderungen an Mechanik oder Balancing. Coast Forge v0.1.1 wandelt **Item**-Descriptions von Plain Text in HTML um, lässt **Active-Effect**-Descriptions aber unverändert. Deshalb bei Active Effects für Absätze und Aufzählungen explizit `<p>`, `<ul>` und `<li>` in die JSON-Description schreiben. Foundry-Links sind separat auf Kompatibilität zu testen.
2. **Mechanikmatrix bilden:** Alle Boni, Conditions, Saves, Damage, Dauer, Attunement, Uses, Recovery, Activation, Targets, Item-Properties und manuelle Schritte notieren. Keine Regel übersehen.
3. **Schema/Parser bestimmen die Form:** `schemaVersion: 1`, `items: []`, `kind`, `system`, `activities`, `effects`. Keine erfundenen Felder oder ältere 2014-Angriffsfelder. Der native D&D5e-`system`-Block wird durchgereicht, muss also in der installierten D&D5e-Version gültig sein.
4. **Getestete Schablonen bevorzugen:** Bei bekanntem Mechanismus die im Foundry-Livetest bestätigte Struktur verwenden; nicht bei jedem Item neu raten. Neue/unsichere Attribute Keys nicht als bestätigt ausgeben.
5. **Automatisch statisch prüfen:** `node tools/validate-import.mjs pfad/zu/item.json` muss ohne ERROR laufen. WARNs einzeln beurteilen und offen benennen. Zusätzlich `node --test tests/*.test.mjs` ausführen.
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
- **Foundry VTT v13** nutzt für ActiveEffect-Dokumente **`icon`**, nicht `img`. `img` gehört zum ActiveEffect-Datenmodell von **v14**. Importer v0.1.1 reicht Effektfelder unverändert durch, weshalb wir `icon` korrekt setzen müssen.
- Diese Einstellung bedeutet **nicht**, dass der Effekt automatisch aktiviert, jeden Tag umgeschaltet, beim Ablauf entfernt oder mit einer Activity verknüpft wird. Sie regelt nur die Sichtbarkeit des Symbols auf dem Token/Kampftracker, **wenn der Effekt angewendet wird**.
- Sunlit Resolve bleibt der bedingte Ausrüstungsbonus (`transfer:true`), dessen Tageszeit-Gültigkeit manuell kontrolliert wird. Zenith bleibt der Activity-gebundene Effekt (`transfer:false`); seine Aktivierung und Beendigung sind separat zu prüfen.
- Verwende kein v14-Top-Level-Feld `showIcon` für die v13-Daten. **Keine technischen Hinweise in der Effect Description**; dort stehen weiterhin vollständige D&D-2024-Regeln mit HTML-Listen.
- QA: Fehlendes DAE-Flag und fehlendes `icon` erzeugen WARN; `showIcon:false` oder ein `img`-Feld an temporären/bedingten Effekten ERROR. Ein erfolgreicher QA-Test ist kein Live-Test in Foundry.

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
