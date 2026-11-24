/** Resolve explicit references only; never guess UUIDs or search unrelated packs. */
const clone = v => JSON.parse(JSON.stringify(v));
const values = v => Array.isArray(v) ? v : v?.contents ?? (v?.values ? [...v.values()] : Object.values(v ?? {}));
const validId = v => typeof v === 'string' && /^[A-Za-z0-9]{16}$/.test(v);
export const PACK_SETTINGS = {effectPack:'Item', journalPack:'JournalEntry', itemPack:'Item'};
export const packType = pack => pack?.documentName || pack?.documentClass?.documentName || pack?.metadata?.type;
export function referenceSources(packs, worldJournals, type) {
  const sources = values(packs).filter(p => packType(p) === type).map(p => ({value:p.collection, label:`Compendium: ${p.title || p.metadata?.label || p.collection} (${p.collection})`}));
  if (type === 'JournalEntry') for (const doc of values(worldJournals)) {
    if (doc.id && doc.name) sources.push({value:`journal:${doc.id}`,label:`World Journal: ${doc.name}`});
  }
  return sources.sort((a,b)=>a.label.localeCompare(b.label));
}
export function createPackResolver(packs) {
  const indices = new Map();
  return async (packId, type, name) => {
    if (typeof name !== 'string' || !name.trim()) throw new Error('Reference name missing.');
    const pack = packs?.get(packId);
    if (!pack || packType(pack) !== type) throw new Error(`Choose a ${type} compendium for ${name}.`);
    if (!indices.has(packId)) indices.set(packId, Promise.resolve(pack.getIndex()));
    const matches = values(await indices.get(packId)).filter(i => i.name === name);
    if (matches.length !== 1) throw new Error(`${name}: ${matches.length ? 'ambiguous' : 'not found'} in ${packId}.`);
    const doc = await pack.getDocument(matches[0]._id ?? matches[0].id);
    if (!doc?.uuid || doc.name !== name) throw new Error(`Cannot load reference: ${name}.`);
    return doc;
  };
}
// An exact entry or page within the explicitly selected journal source.
// Never fall back to plain text or silently select an unrelated journal.
export async function resolveJournal(source, name, packs, worldJournals, cache = new Map()) {
  if (!source) throw new Error(`${name}: choose Condition Journals (Journal compendium or World Journal).`);
  let docs;
  if (source.startsWith('journal:')) {
    const id=source.slice(8);
    const doc=values(worldJournals).find(d=>d.id===id);
    if (!doc) throw new Error(`${name}: selected World Journal no longer exists.`);
    docs=[doc];
  } else {
    const pack=packs?.get(source);
    if (!pack || packType(pack)!=='JournalEntry') throw new Error(`${name}: choose a JournalEntry compendium.`);
    // Pages are embedded, not individually indexed. Load only the selected pack,
    // in small batches and cache it for the duration of the import.
    if (!cache.has(source)) cache.set(source,(async()=>{
      const index=values(await pack.getIndex()), result=[];
      for (let i=0;i<index.length;i+=20) result.push(...await Promise.all(index.slice(i,i+20).map(d=>pack.getDocument(d._id ?? d.id))));
      return result;
    })());
    docs=await cache.get(source);
    if (docs.some(d=>!d)) throw new Error(`${name}: selected journal pack could not be fully read.`);
  }
  const matches=docs.flatMap(d=>d.name===name && d.uuid ? [d] : values(d.pages).filter(p=>p.name===name && p.uuid));
  if (matches.length!==1) throw new Error(`${name}: ${matches.length?'ambiguous':'not found'} in selected journal source (entry/page).`);
  return matches[0];
}
export async function resolveReferences(input, settings, packs, makeId, worldJournals) {
  const items = clone(input), warnings = [], resolve = createPackResolver(packs);
  const journalCache = new Map();
  let effects = 0, journals = 0, grants = 0;
  for (const item of items) {
    if (item.effectRefs !== undefined && (!Array.isArray(item.effectRefs) || item.effectRefs.length > 30)) throw new Error(`${item.name}: invalid effectRefs.`);
    for (const ref of item.effectRefs ?? []) {
      if (!ref || !validId(ref.activityId) || (ref.onSave !== undefined && typeof ref.onSave !== 'boolean')) throw new Error(`${item.name}: invalid effect reference.`);
      const activities = item.activities ?? Object.values(item.system?.activities ?? {});
      const activity = activities.find(a=>a._id===ref.activityId);
      if (!activity) throw new Error(`${item.name}: activity ${ref.activityId} missing.`);
      const source = await resolve(ref.pack ?? settings.effectPack, 'Item', ref.name);
      const candidates = values(source.effects).filter(e => ref.effectName === undefined || e.name === ref.effectName);
      if (candidates.length !== 1) throw new Error(`${ref.name}: expected exactly one matching Active Effect; specify effectName if needed.`);
      const effect = clone(candidates[0].toObject());
      if (!Array.isArray(effect.changes)) throw new Error(`${ref.name}: invalid Active Effect changes.`);
      for (const key of ['_id','_stats','origin','sort','folder','ownership','parent']) delete effect[key];
      for (const key of ['startTime','startRound','startTurn']) if (effect.duration) delete effect.duration[key];
      effect._id = makeId();
      if (!validId(effect._id)) throw new Error('Invalid generated effect ID.');
      effect.transfer = false; effect.disabled = false;
      // Preserve the effect's artwork; inherit the item artwork for default/missing icons.
      const image = effect.img || effect.icon;
      effect.img = (!image || image.startsWith('icons/svg/')) ? (source.img || image || 'icons/svg/aura.svg') : image;
      delete effect.icon;
      effect.flags ??= {}; effect.flags.dae ??= {}; effect.flags.dae.showIcon = true;
      item.effects ??= []; activity.effects ??= [];
      if (item.effects.length >= 30 || item.effects.some(e=>e._id===effect._id)) throw new Error(`${item.name}: effect limit or duplicate ID.`);
      item.effects.push(effect);
      activity.effects.push({_id:effect._id,onSave:ref.onSave ?? false});
      warnings.push(`${item.name}: ${ref.name} übernommen (${source.uuid}); Wirkung und Ablauf live prüfen.`);
      effects++;
    }
    if (item.compendiumGrants !== undefined && (!Array.isArray(item.compendiumGrants) || item.compendiumGrants.length > 30)) throw new Error(`${item.name}: invalid compendiumGrants.`);
    const used = new Set((item.grantLinks ?? []).map(g=>g.advancementId));
    for (const ref of item.compendiumGrants ?? []) {
      if (!ref || !validId(ref.advancementId) || used.has(ref.advancementId) || !Array.isArray(ref.items) || !ref.items.length || ref.items.length > 100) throw new Error(`${item.name}: invalid or conflicting compendium grant.`);
      used.add(ref.advancementId);
      const advancement = Object.values(item.system?.advancement ?? {}).find(a=>a._id===ref.advancementId && a.type==='ItemGrant');
      if (!advancement || !Array.isArray(advancement.configuration?.items) || advancement.configuration.items.length) throw new Error(`${item.name}: expected empty ItemGrant.`);
      const links=[];
      for (const entry of ref.items) {
        if (!entry || (entry.optional !== undefined && typeof entry.optional !== 'boolean')) throw new Error('Invalid external grant.');
        const doc=await resolve(entry.pack ?? settings.itemPack,'Item',entry.name);
        if (links.some(l=>l.uuid===doc.uuid)) throw new Error(`Duplicate external grant: ${entry.name}`);
        links.push({uuid:doc.uuid,optional:entry.optional ?? false});
      }
      advancement.configuration.items=links;
      grants+=links.length;
      warnings.push(`${item.name}: ${links.length} externe Grant-Referenzen aufgelöst.`);
    }
    // Only explicit placeholders; never rewrite ordinary rules text or native &Reference links.
    if (typeof item.description === 'string') {
      const matches = [...item.description.matchAll(/\[\[condition:([^\]\n]+)\]\]/g)];
      for (const m of matches) {
        const name=m[1];
        const doc=await resolveJournal(settings.journalPack,name,packs,worldJournals,journalCache);
        if (/[\[\]{}\n]/.test(doc.uuid+name)) throw new Error('Invalid journal link.');
        const replacement=`@UUID[${doc.uuid}]{${name}}`; journals++;
        warnings.push(`${item.name}: Journal-Link ${name} aufgelöst; Darstellung live prüfen.`);
        item.description=item.description.replace(m[0],()=>replacement);
      }
    }
    delete item.effectRefs; delete item.compendiumGrants;
  }
  return {items,warnings,effects,journals,grants};
}
