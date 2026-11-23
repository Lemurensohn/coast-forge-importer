# Coast Forge Importer – Version 0.1.0 (Prototyp)

**Ziel:** Foundry VTT **v13** mit **dnd5e 5.x (Referenz 5.2.5)**, D&D 2024-Regeln. Midi-QOL/DAE können installiert bleiben, ihre Automatisierung ist in v0.1 aber **noch nicht implementiert oder getestet**.

## Installation (The Forge / GitHub)

GitHub-Repository: https://github.com/Lemurensohn/coast-forge-importer

Manifest-Link für Forge: https://github.com/Lemurensohn/coast-forge-importer/releases/latest/download/module.json

1. Sicherheitskopie deiner Welt erstellen (idealerweise eine separate Testwelt verwenden).
2. Die Quelldateien aus dem `coast-forge-importer-github-source-v0.1.0.zip` in das GitHub-Repository hochladen. `module.json` muss im Repository-Hauptverzeichnis liegen; `scripts/`, `styles/` usw. bleiben Unterordner.
3. Auf GitHub unter **Releases** einen Release mit Tag **`v0.1.0`** erstellen und **zwei Assets** hochladen: `module.json` und `coast-forge-importer-v0.1.0.zip` (Release-Paket; `module.json` liegt in dieser ZIP im Archiv-Stammverzeichnis).
4. Danach auf The Forge unter Bazaar/Custom Module mit dem Manifest-Link installieren und in einer Testwelt unter **Module verwalten** `Coast Forge Importer` aktivieren.
5. Als GM im **Items-Verzeichnis** den Knopf **Coast Forge Import** verwenden. Sollte er in deiner Foundry-Oberfläche nicht erscheinen, erstelle ein Script-Makro und führe es aus:

   ```js
   game.modules.get("coast-forge-importer").api.open();
   ```

6. Datei `examples/01-erster-import.json` über **Datei auswählen** laden, **Vorschau prüfen**, dann **Importieren**. Standardziel ist der Weltordner `Coast Forge Imports`; optional kann ein berechtigter Actor gewählt werden.
7. Jedes angelegte Item in Foundry öffnen und die Activities/Effekte durchspielen. Besonders bei Attack/Save/DAE/Midi-QOL ist das nötig.

## Das Importformat

Siehe **IMPORT_FORMAT.md**. Es ist normales, streng formatiertes JSON. Die Dateiendung darf `.json` oder `.txt` sein. **Unstrukturierter natürlicher Fließtext wird von diesem Modul nicht selbst verstanden:** ChatGPT übersetzt den Homebrew-Text vorab in das JSON-Format.

## Fähigkeiten und Grenzen in 0.1

- Mehrere Items pro Datei; Features, Maneuvers (als `feat`), Spells, Weapons, Equipment und weitere D&D5e-Itemtypen.
- Preview + Fehlermeldungen + GM-Rechte + Duplikat-Vermeidung nach Name und Typ im Ziel.
- Native D&D5e-Activities über `activities` (einschließlich Formelkürzel für `damageParts`) oder vollständige `system.activities`.
- Speichert Active Effects. Ihre automatische Anwendung/Transferlogik ist versions- und modulspezifisch und **nicht garantiert**.
- Unbekannte/komplexe Features werden **nicht magisch automatisiert**: API-Hooks, Midi-QOL-Makros, DAE-Timer, Short/Long Rest und Ressourcengrenzen benötigen spätere Implementierungen.
- Spells erhalten im Beispiel Basisfelder. Spell-Komponenten, Range, Duration, Consumption, Concentration und Scaling können bereits als native `system`-Daten übergeben werden, erfordern aber exakte v5.2.5-Werte.
- Noch kein Compendium-Export, keine Undo-Funktion, kein automatischer Icon-Upload und keine `Advancement`-Erstellung für Subclasses.
- Kein automatisches Ausführen von mitgeliefertem JavaScript. Imports werden als JSON geparst.

## Fehlersuche

Wenn die Vorschau einen Schemafehler zeigt, klicke **nicht** auf Importieren. Die Meldung zeigt den Namen des betroffenen Items an. Bei laufendem Foundry unter **F12 -> Konsole** weitere Fehler prüfen.

Sende für Fehlersuche bitte die **dnd5e-Systemversion** (in Foundry sichtbar), die **Fehlermeldung** und die **betroffene Beispiel-Datei**. Die erste Funktion, die wir gemeinsam live prüfen, ist der normale `utility`-Feat-Import.

## Sicherheit

Nur als Spielleitung verwendbar. Imports werden nicht online versendet. Kein `eval` oder `new Function`. JSON kann jedoch Effects/Makro-Flags enthalten, die andere installierte Module später verarbeiten: importiere daher nur selbst geprüfte Dateien.

## Technischer Entwicklungsstand

Die statischen Parser-/Builder-Tests (`node --test tests/*.test.mjs`) wurden lokal ausgeführt. **Foundry selbst steht hier nicht als lauffähige Testinstanz zur Verfügung**; darum ist das Paket ein installierbarer Prototyp, keine garantiert verifizierte Foundry-Liveversion.
