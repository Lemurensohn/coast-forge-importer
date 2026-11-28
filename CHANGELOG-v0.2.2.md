# Coast Forge Importer v0.2.2 — Stability & Aura Integration

- Optional Aura Effects 1.5.2 adapter using the real custom Active Effect type and configuration.
- Colored visible radii, fixed or formula-based distance, relative disposition, self targeting, source roll data, stacking and collision settings.
- Support for ordinary Items, embedded NPC Items and direct Actor effects; manual duration only.
- Dependency/model validation before any writes; verify aura data on document serialization and creation/update.
- Advanced Summoning runtime loads separately and can be disabled via world settings; startup error isolation and partial hook cleanup.
- No new gameplay hooks, timers, executable aura filters, or autonomous combat decisions.
- Four aura test fixtures; schemaVersion 1 retained. QA v2.18.
- 192/192 local automated tests passed (173 previous + 19 new). Foundry/Midi-QOL live test pending.
