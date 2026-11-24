# Coast Forge — Verbindlicher Import- und Qualitätsstandard v1.1

**Zielsystem:** Foundry VTT **v13**, D&D5e **2024-Regeln**, installiertes **dnd5e 5.x** (exakte Minor-Version im Live-Test feststellen), Midi-QOL und ggf. DAE; Hosting: The Forge.

**Importer:** Coast Forge Importer **v0.1.1**, JSON-`schemaVersion: 1`. Die Code-Datei `scripts/schema.mjs` ist die verbindliche Quelle für gültige Importdaten; dieses Dokument ergänzt, aber ersetzt sie nicht.

## Arbeitsprozess: bei JEDEM Item

1. **Regeltexte strikt trennen:** `items[].description` ist der vollständige englische, lesbare D&D-2024-Regeltext des Items. `items[].effects[].description` ist **nur** die präzise Wirkung dieses einen Active Effects, ebenfalls in Spieler-Regelsprache. Keine technische Key-Liste und keine Bedienungs-/Testanweisungen in einer der beiden Descriptions. Keine unbeabsichtigten Änderungen an Mechanik oder Balancing. Coast Forge v0.1.1 rendert **Plain Text**, kein HTML-Markup; Foundry-Links sind separat auf Kompatibilität zu testen.
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

- **Nur die regeltechnischen Auswirkungen, die dieser einzelne Active Effect tatsächlich repräsentiert.** Kein Duplikat der gesamten Item Description und keine Zusammenfassung von Fähigkeiten, die ausschließlich durch separate Activities oder manuell abgewickelt werden.
- Kurz und präzise in normalem **englischem D&D-2024-Regelstil**, grundsätzlich in der zweiten Person ("Your Speed increases by 20 feet.") oder einer ebenso eindeutigen Regelperspektive.
- Ein DC, eine Bedingung oder Dauer wird **nur dann** genannt, wenn sie für die Wirkung dieses Effects notwendig und zutreffend ist; niemals als bloßes Techniketikett.
- **Verboten sind technische oder operative Hinweise**, insbesondere "Activate/deactivate this effect manually", "Use/Roll through the Utility Activity", "in Foundry", "Midi-QOL", "Active Effect key", "not automated", "handled manually", "transfer effect", "activity-applied", "campaign tracking convention" oder Test-Kommentare.
- Manuelle Bedienung, bekannte Einschränkungen und QA-Hinweise gehören **ausschließlich** in Entwicklungsdokumentation, Prüfbericht oder klar gekennzeichnete Import-Metadaten, nicht in spielerseitige Beschreibungen.

**Beispiel — Ring of Sun:**

| Feld | Richtige Aussage |
|---|---|
| Item Description / Zenith | Vollständige Zenith-Regeln: Bonus Action, 1/Long Rest, 1 Minute, +20 ft. Speed, Licht, 3d8 statt 1d8, Temporary Hit Points, Opportunity Attacks. |
| Effect: Sunlit Resolve (drei Changes) | `Your Speed increases by 10 feet. You gain a +1 bonus to AC and saving throws.` |
| Effect: Zenith (ein Speed-Change) | `Your Speed increases by 20 feet.` |
| Separate Damage-/Utility-Activities | Schaden, Temp HP und Schadensreduktion erhalten die zugehörigen Formeln; sie werden **nicht** in den Speed-Only-Effect-Text hineinkopiert. |

**Prüfpflicht:** Vor Auslieferung jeden Active Effect gegen seine konkreten `changes`, `statuses` und verknüpften Mechaniken abgleichen. Die automatisierte Prüfung kann verbotene Technikformulierungen erkennen; ob ein Text den **richtigen** Effekt vollständig und ausschließlich beschreibt, bleibt zusätzlich ein manueller semantischer Check.

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
