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
