// Local references are import metadata, never executable code or UUID guesses.
export function planGrants(items) {
  const refs = new Map(), plans = [], signatures = new Set();
  for (const item of items) {
    if (item.ref !== undefined) {
      if (typeof item.ref !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(item.ref) || refs.has(item.ref)) throw new Error(`Invalid or duplicate ref: ${item.ref}`);
      refs.set(item.ref, item);
    }
  }
  for (const item of items) {
    if (item.grantLinks === undefined) continue;
    if (!item.ref || !Array.isArray(item.grantLinks) || !item.grantLinks.length) throw new Error(`${item.name}: grantLinks needs a ref and nonempty array.`);
    const raw = item.system?.advancement ?? [];
    const entries = Array.isArray(raw) ? raw : Object.values(raw);
    const ids = new Set();
    for (const link of item.grantLinks) {
      if (!link || !/^[A-Za-z0-9]{16}$/.test(link.advancementId ?? '') || ids.has(link.advancementId)) throw new Error(`${item.name}: invalid or duplicate advancement ID.`);
      ids.add(link.advancementId);
      const grant = entries.find(a => a?._id === link.advancementId && a.type === 'ItemGrant');
      if (!grant || !Array.isArray(grant.configuration?.items) || grant.configuration.items.length) throw new Error(`${item.name}: expected empty ItemGrant ${link.advancementId}.`);
      if (!Array.isArray(link.refs) || !link.refs.length || new Set(link.refs).size !== link.refs.length || link.refs.some(r => !refs.has(r) || r === item.ref)) throw new Error(`${item.name}: missing, duplicate or self grant reference.`);
      plans.push({parent: item.ref, id: link.advancementId, refs: link.refs});
    }
  }
  if (plans.length) {
    for (const item of items) {
      const sig = `${item.type ?? item.kind}:${item.name.trim().toLowerCase()}`;
      if (signatures.has(sig)) throw new Error(`Duplicate linked batch item: ${item.name}`);
      signatures.add(sig);
    }
    const edges = new Map();
    for (const p of plans) edges.set(p.parent, [...(edges.get(p.parent) ?? []), ...p.refs]);
    const visit = (ref, stack = new Set()) => {
      if (stack.has(ref)) throw new Error(`Cyclic grant reference: ${ref}`);
      for (const next of edges.get(ref) ?? []) visit(next, new Set([...stack, ref]));
    };
    for (const ref of edges.keys()) visit(ref);
  }
  return plans;
}
export async function linkGrants(plans, documents) {
  let linked = 0;
  // Validate all targets before any update.
  const updates = plans.map(plan => {
    const parent = documents.get(plan.parent);
    const children = plan.refs.map(ref => documents.get(ref));
    if (!parent || children.some(c => !c?.uuid)) throw new Error(`Unresolved grant: ${plan.parent}`);
    const raw = parent.toObject().system.advancement;
    const array = Array.isArray(raw);
    const entries = array ? raw.map((v,i)=>[i,v]) : Object.entries(raw ?? {});
    const match = entries.find(([,v])=>v?._id===plan.id && v.type==='ItemGrant');
    if (!match) throw new Error(`Missing ItemGrant: ${plan.id}`);
    const [key, grant] = match;
    const items = children.map(c=>({uuid:c.uuid,optional:false}));
    const old = grant.configuration?.items ?? [];
    if (old.length && (old.length !== items.length || !items.every(i=>old.some(o=>o.uuid===i.uuid && !o.optional)))) throw new Error(`Existing grant differs: ${plan.parent}`);
    return {parent, array, key, id:plan.id, items};
  });
  for (const u of updates) {
    if (u.array) {
      const raw = structuredClone(u.parent.toObject().system.advancement);
      const grant = raw.find(a=>a._id===u.id);
      grant.configuration.items=u.items; grant.configuration.optional=false;
      await u.parent.update({'system.advancement':raw});
    } else {
      await u.parent.update({[`system.advancement.${u.key}.configuration.items`]:u.items,[`system.advancement.${u.key}.configuration.optional`]:false});
    }
    const raw=u.parent.toObject().system.advancement;
    const saved=Object.values(raw).find(a=>a._id===u.id)?.configuration?.items;
    if (!Array.isArray(saved) || saved.length!==u.items.length || !u.items.every(i=>saved.some(s=>s.uuid===i.uuid))) throw new Error(`Grant verification failed: ${u.id}`);
    linked+=u.items.length;
  }
  return linked;
}
