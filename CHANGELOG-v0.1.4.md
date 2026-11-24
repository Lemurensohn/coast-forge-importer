# Coast Forge Importer v0.1.4

- Optional exact-name Compendium resolver, configured per world in the import dialog: Item effects, Journal Entry rule links and external ItemGrant targets.
- `effectRefs`, `compendiumGrants` and `[[condition:Name]]` are optional schemaVersion 1 extensions. Old documents need no conversion. Source compendiums remain read-only.
- Existing Item modes: Skip Existing (default), Update Icons Only, Update Existing Items (World Items only). Preserve top-level UUID and image unless explicitly selected. Full updates replace system data and embedded effects and are not atomic.
- Imported effects preserve source rules, changes, statuses, duration and flags, remove previous origin/start timestamps, use fresh embedded ID, and set transfer=false, disabled=false and DAE showIcon=true. Retain source effect artwork, falling back to source feature artwork for missing/default SVG icon. Native v13 effect image field is img per v13 API; existing legacy import inputs are not changed.
- Individual file picker and local grant links retained. Missing or ambiguous named references reject before creation. No automatic Actor-copy synchronization, no automatic timer generation.
- 47/47 local Node mock tests passed; Foundry/The Forge/Midi-QOL live tests for new functions still open. Historical QA v2.4 92-test suite not available in this archive.
