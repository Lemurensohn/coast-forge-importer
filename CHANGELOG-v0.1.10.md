# v0.1.10 — Active Effect Icon Hotfix

- Validate detached item payloads so Foundry migration accessors cannot mutate editable import data.
- Rebuild effect icon data rather than deleting a potentially non-configurable legacy `icon` property.
- Apply detached validation during full updates as well.
- Regression tests reproduce the reported TypeError with a simulated migration accessor and cover frozen effect data.
- 103 automated tests pass; live Foundry verification pending. No schema or QA policy changes.
