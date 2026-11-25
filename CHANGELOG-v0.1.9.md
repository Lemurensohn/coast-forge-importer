# Coast Forge Importer v0.1.9 — Active Effect Icon Management

- Automatically inherit the final item image for regular Active Effects with missing or generic artwork.
- Preserve native condition icons, compendium effect artwork and explicit custom icons.
- Optional, collapsed effect icon controls with native FilePicker, inheritance/original/custom modes, and reset.
- Extend Update Icons Only to existing embedded effects; repair legacy generic icons without replacing mechanics.
- Persist icon policy and detect manual artwork changes on subsequent importer updates.
- Normalize legacy Active Effect `icon` input to Foundry v13's native `img` field.
- Keep the timer-free QA rule and update the QA standard to v2.11. Existing imported timers are not removed automatically.
- No automatic live synchronization or actor-copy updates; schemaVersion 1 remains supported.
