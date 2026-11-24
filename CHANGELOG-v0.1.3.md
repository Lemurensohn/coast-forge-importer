# 0.1.3
- Optional local `ref` and `grantLinks` metadata, schemaVersion 1 unchanged.
- World Items only for linked batches; native ItemGrant entries receive real created document UUIDs after creation.
- Supports array and keyed object advancement storage. Validates references and verifies saved links.
- Existing matching local references can be reused; unrelated same-name documents are not overwritten. A failed batch may leave created items, allowing retry with matching refs.
- Individual icon choices remain unchanged. Actor grant execution and level-up still require a Foundry live test.
