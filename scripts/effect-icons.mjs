/** Effect artwork policy. No document writes or timer hooks. */
const SCOPE = 'coast-forge-importer';
const MODES = new Set(['inherit','custom','original']);
const GENERIC = new Set(['icons/svg/aura.svg','icons/svg/book.svg','icons/svg/shield.svg','icons/svg/item-bag.svg','icons/svg/upgrade.svg','icons/svg/mystery-man.svg']);
export const isGenericEffectIcon = path => GENERIC.has(path);
const validPath = p => typeof p === 'string' && !!p.trim();
const image = e => validPath(e?.img) ? e.img : validPath(e?.icon) ? e.icon : '';
const marker = e => e?.flags?.[SCOPE]?.effectIcon;
const hasStatus = e => Array.isArray(e?.statuses) ? e.statuses.length > 0 : !!e?.statuses?.size;
function statusImage(e) {
  const statuses = Array.isArray(e?.statuses) || e?.statuses instanceof Set ? [...e.statuses] : [];
  const def = globalThis.CONFIG?.statusEffects?.find?.(s => statuses.includes(s.id));
  return image(def);
}
export function defaultEffectIcon(effect, itemImg, existing = false) {
  const path = image(effect), saved = marker(effect);
  const original = validPath(saved?.original) ? saved.original : path || statusImage(effect) || itemImg;
  // A manual edit in Foundry takes precedence over a previous inheritance marker.
  if (existing && validPath(saved?.applied) && path && path !== saved.applied)
    return {mode:'custom', custom:path, original};
  if (MODES.has(saved?.mode)) return {mode:saved.mode, custom:path, original};
  if (hasStatus(effect)) return {mode:'original', custom:path, original:path || statusImage(effect) || original};
  if (!path || isGenericEffectIcon(path) || (existing && path === itemImg)) return {mode:'inherit', custom:path, original};
  return {mode:'original', custom:path, original};
}
function actualEffects(doc) {
  return doc?.effects?.contents?.map(e=>e.toObject?.() ?? e) ?? doc?.toObject?.()?.effects ?? (Array.isArray(doc?.effects) ? doc.effects : []);
}
function matchExisting(next, old, allNext) {
  const exact = old.find(e=>e._id === next._id);
  if (exact) return exact;
  const byName = old.filter(e=>e.name === next.name && !allNext.some(n=>n._id===e._id));
  return byName.length === 1 && allNext.filter(e=>e.name === next.name).length === 1 ? byName[0] : null;
}
function policyFor(effect, row, mode, old, incoming) {
  const oldItem = row.existing?.img ?? row.data.img;
  const original = defaultEffectIcon(effect,row.data.img);
  const prior = mode === 'update' ? matchExisting(effect,old,incoming) : null;
  if (mode === 'icons' && row.existing) return defaultEffectIcon(effect,oldItem,true);
  if (!prior) return original;
  const previous = defaultEffectIcon(prior,oldItem,true);
  // Preserve individual choices (including manual Foundry changes). New source
  // artwork is used only when the previous effect was inheriting.
  if (previous.mode !== 'inherit') return previous;
  return original.mode === 'inherit' ? previous : original;
}
export function createEffectIconChoices(preview, itemIcons, mode = 'skip') {
  const rows = preview.map(row=>{
    if (!row.data || row.error || (row.existing && mode === 'skip')) return [];
    const old = actualEffects(row.existing);
    const incoming = row.data.effects ?? [];
    const effects = mode === 'icons' && row.existing ? old : incoming;
    return effects.map(effect=>{
      const policy = policyFor(effect,row,mode,old,incoming);
      const initial = {...policy};
      return {effect, initial, current:{...initial}, touched:false};
    });
  });
  const entry = (i,j)=>rows[i]?.[j];
  const pathFor = (i,c)=> c.mode === 'inherit' ? itemIcons.get(i) : c.mode === 'custom' ? c.custom || c.original : c.original;
  return {
    list(i) { return (rows[i]??[]).map(({effect},j)=>({index:j,name:effect.name})); },
    get(i,j) {
      const e=entry(i,j); if (!e) return null;
      return {...e.current, path:pathFor(i,e.current), touched:e.touched};
    },
    setMode(i,j,value) {
      const e=entry(i,j); if (!e || !MODES.has(value)) return false;
      if (value === 'custom' && !validPath(e.current.custom)) e.current.custom=pathFor(i,e.current);
      e.current.mode=value; e.touched=true; return true;
    },
    select(i,j,path) {
      const e=entry(i,j); if (!e || !validPath(path)) return false;
      e.current.mode='custom'; e.current.custom=path; e.touched=true; return true;
    },
    reset(i,j) {
      const e=entry(i,j); if (!e) return false;
      e.current={...e.initial}; e.touched=false; return true;
    },
    commit() {
      rows.forEach((entries,i)=>{
        const row=preview[i];
        const only=mode==='icons' && row.existing;
        const patches=[];
        entries.forEach(({effect,current,touched})=>{
          const path=pathFor(i,current);
          if (!validPath(path)) return;
          const meta={mode:current.mode,original:current.original,applied:path};
          if (only) {
            // Icon-only mode also repairs legacy generic icons, even when
            // the parent image is unchanged. Other effects are not touched.
            if (!touched && current.mode!=='inherit') return;
            if (path===image(effect) && !touched) return;
            patches.push({_id:effect._id ?? effect.id,img:path,[`flags.${SCOPE}.effectIcon`]:meta});
          } else {
            effect.img=path; delete effect.icon;
            effect.flags ??= {}; effect.flags[SCOPE] ??= {}; effect.flags[SCOPE].effectIcon=meta;
          }
        });
        if (patches.length) row.effectIconPatches=patches;
      });
    }
  };
}
