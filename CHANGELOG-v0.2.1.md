# Coast Forge Importer v0.2.1 — Advanced Summoning

- Opt-in declarative `advancedSummon` configuration, schemaVersion 1 unchanged.
- Class-level tier scaling of HP, AC, speed, save modifiers, damage dice, damage type, healing and calculated chat guidance.
- Native proficiency, attack and save-DC matching preserved.
- Select mixed profiles with individual size and damage type; one item use after all placements succeed, no spell slot.
- Owner/group token metadata, capacity checks across loaded scene documents, manual dismissal, actor-sheet Summons button and managed activity dialog.
- Rollback of the current batch on canceled/failed placement, with explicit manual-repair warning if deletion is denied.
- Native non-managed activities and all prior importer functionality unchanged.
- New test fixture 72 and QA v2.17. 173 local Node tests (156 baseline, 17 new).
- Foundry v13 / D&D5e 5.2.5 / Midi-QOL live test pending. Snapshot scaling, not continuous live updates. Range, action economy, commands, initiative, on-hit effects, specialized shared resources, damage reduction and auras remain manual. No automated timers. No server-wide transaction/lock; permissions and simultaneous use need live testing.
