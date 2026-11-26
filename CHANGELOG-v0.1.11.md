# Coast Forge Importer v0.1.11 – Bulk Spell Scroll Generation

- Added optional `scrolls` requests to schema version 1. Existing `items` files continue to work.
- Converts named spells from multiple preferred Item compendiums using D&D5e's detached native scroll converter, preserving existing activity and effect data where possible.
- Supports explicit cast levels, base-only, and all levels through 9; up to 500 expanded items in scroll imports.
- Applies level-specific scroll templates and fixed attack bonuses / save DCs; retains native scaling flags and source spell link.
- Copies data rather than modifying source compendiums; strips known effect expiry and macro hooks on scroll copies.
- Uses existing preview, destination folders, item/effect icon controls and duplicate/update modes.
- Supports explicit follow-up activity names and optional GP price overrides by level.
- 119 automated tests passed (103 existing + 16 new). Native Foundry/Midi-QOL runtime tests still required.
