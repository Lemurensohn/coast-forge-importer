# Coast Forge – Verbindliches Importformat v1

## Grundidee

Du kannst in ChatGPT frei über Features, Spells, Maneuvers, Waffen und Ausrüstung schreiben. ChatGPT soll daraus eine **JSON-Datei**, nicht die Texte für manuelle Eingaben, erzeugen. Der Importer führt weder KI noch Freitextanalyse aus: Er setzt die Daten in Foundry um.

```json
{
  "schemaVersion": 1,
  "items": [
    {
      "name": "Example Feature",
      "kind": "feature",
      "description": "Plain text feature description.",
      "automation": "manual",
      "activities": [
        { "type": "utility", "name": "Use Example", "activation": { "type": "bonus", "cost": 1 } }
      ],
      "effects": []
    }
  ]
}
```

## Unterstützte Itemarten

`kind` darf sein: `feature`, `feat`, `maneuver`, `spell`, `cantrip`, `weapon`, `armor`, `equipment`, `consumable`, `potion`, `tool`, `loot`, `item`, `container`, `class`, `subclass`. Alternativ den echten Foundry-Typ als `type` angeben. `maneuver` ist in dnd5e kein eigener Item-Typ und wird technisch als `feat` erzeugt. `class` und `subclass` sind nur rohe Itemhüllen; automatische Subclass-Level-Advancement fehlt noch.

## Item-Felder

- `name`: Pflicht.
- `type` oder `kind`: Pflicht. Verwende bevorzugt `kind`.
- `description`: optional, **Plain Text** (HTML wird escaped, Absätze werden beibehalten).
- `img`: optional, vorhandener Foundry-Bildpfad.
- `automation`: `manual`, `partial`, `full` oder `unknown` (v0.1 nur Hinweis, keine Garantie).
- `system`: optional, vollständige originale dnd5e-5.x-Systemfelder (z. B. `level`, `school`, `uses`, `damage`, `properties`, `advancement` etc.); **kein veraltetes 2014 `actionType` verwenden**.
- `activities`: Liste nativer Activity-Objekte, siehe unten. Stattdessen kann `system.activities` als bereits vollständige Map übergeben werden. **Nicht beides zugleich.**
- `effects`: Liste von ActiveEffect-Quellobjekten mit mindestens `changes: []`.
- `flags`: optionale native Foundry-/Modul-Flags; Macro-Flags nur auf ausdrückliche Anforderung und nach Prüfung.

## Activities

Jede Activity benötigt `type` und kann die nativen dnd5e-Activity-Felder enthalten. `name` und `_id` sind optional. V0.1 unterstützt den Rohdaten-Passthrough der von dnd5e 5.2.5 angebotenen Activities, beispielsweise `utility`, `attack`, `save`, `damage`, `heal`, `check`. Bei der Erzeugung prüft Foundry das Schema der installierten Version.

Vereinfachung: `damageParts: [{"formula":"2d6 + @mod","type":"fire"}]` wird in die nativen DamageFields mit Custom-Formula überführt. Du kannst alternativ native `damage.parts` ausgeben. Wenn die Activity `damage` einen Block mit `onSave`/`includeBase` braucht, muss er gesondert angegeben werden.

### Beispiel: Rettungswurf

```json
{
  "type": "save",
  "name": "Memory Shock",
  "activation": { "type": "action", "cost": 1 },
  "save": { "ability": ["wis"], "dc": { "calculation": "", "formula": "15" } },
  "damage": { "onSave": "half" },
  "damageParts": [{ "formula": "3d6", "type": "psychic" }]
}
```

### Beispiel: Waffenangriff

```json
{
  "type": "attack",
  "name": "Blade Strike",
  "activation": { "type": "action", "cost": 1 },
  "attack": {
    "ability": "str", "bonus": "", "flat": false,
    "type": { "value": "mwak", "classification": "weapon" }
  },
  "damage": { "includeBase": false },
  "damageParts": [{ "formula": "1d8 + @mod", "type": "slashing" }]
}
```

## Effekte

```json
{
  "name": "Initiative +1d4",
  "transfer": true,
  "disabled": false,
  "changes": [{ "key": "system.attributes.init.bonus", "mode": 2, "value": "1d4", "priority": 20 }]
}
```

Bei `transfer:true` muss im Foundry-Test überprüft werden, ob der Effekt wie gewünscht beim Actor ankommt. Ein automatischer Midi-QOL-Auslöser beim Schaden, Attack-Hit oder Beginn eines **eigenen** Turns entsteht durch diese Daten **nicht**.

## Arbeitsanweisung für ChatGPT (für unsere weiteren Tests)

> Schreibe einen vollständigen gültigen JSON-Import für Coast Forge, Schema-Version 1. Spiele D&D5e 2024 mit Foundry v13 und dnd5e 5.2.5, Midi-QOL und DAE. Erfinde keine mechanischen Angaben. Verwende Item-Activities, nicht alte Item-Angriffsfelder. Setze pro beschriebenem Feature passende Activities und Effects, soweit eindeutig darstellbar. Für Spezialmechaniken wähle `automation: "partial"` oder `"manual"` und erkläre die verbleibende Automatisierung getrennt, statt unsichere Makros als funktionierend auszugeben. Antworte mit einer validen Datei, die `schemaVersion: 1` und `items: [...]` enthält.

## Laufzeit-Hinweise

Der Importer legt Welt-Items in `Coast Forge Imports` ab. Gleichnamige und gleichartige Einträge werden beim zweiten Import übersprungen. Original-Kind und Automationsstatus werden im Flag `flags.coast-forge-importer` gespeichert. Der JSON-Parser ist auf höchstens 1 MB bzw. 100 Items begrenzt.
