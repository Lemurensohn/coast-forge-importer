# v0.2.0 — Actor & Monster Importer

- Add native NPC Actor creation with embedded items, effects, attributes, and prototype token data.
- Actor-only or mixed actor/item/scroll JSON batches; separate Actor destination and preflight artwork preview.
- Local `actorRef` in native Summon Activity profiles resolves automatically to verified Actor UUIDs. Multiple activities and multiple selectable profiles supported.
- Existing matching NPC templates reused without overwrite; no automatic permission changes. Existing world items retain standard update modes.
- Add Tactician tier-1 test fixture (three NPCs, four summon activities).
- 156/156 Node tests passed (139 previous + 17 new), including mocked import workflow. Actual Foundry/Midi-QOL live test still required.
- No new runtime combat hooks, automatic timers, aura engine, mixed-species simultaneous summon coordinator, or shared cross-actor resource engine. Those remain later milestones.
