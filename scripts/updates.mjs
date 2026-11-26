export const MODES = ['skip','icons','update'];
const clone = v => JSON.parse(JSON.stringify(v));
export function matchingItems(collection,data) {
  const level=data.flags?.dnd5e?.spellLevel?.value;
  const match=/^(Cantrip|1st|2nd|3rd|[4-9]th) Spellscroll – (.+)$/.exec(data.name);
  const generated=data.type==='consumable' && data.system?.type?.value==='scroll' && data.flags?.['coast-forge-importer']?.schemaVersion===1 && Number.isInteger(level) && level>=0 && level<=9 && match;
  const legacy=generated ? `Spell Scroll: ${match[2]} (${level===0?'Cantrip':`Level ${level}`})` : null;
  return collection.filter(i=>i.type===data.type && (i.name===data.name || (legacy && i.name===legacy && i.system?.type?.value==='scroll' && i.flags?.['coast-forge-importer']?.schemaVersion===1 && i.flags?.dnd5e?.spellLevel?.value===level)));
}
/** Updates only the chosen world template. Never propagates changes to actors. */
export async function updateExisting(doc,data,mode,iconChanged,normalize=x=>x,effectIconPatches=[]) {
  if (!MODES.includes(mode)) throw new Error('Invalid update mode.');
  if (mode==='skip') return false;
  if (mode==='icons') {
    if (!iconChanged && !effectIconPatches.length) return false;
    if (effectIconPatches.length) {
      const ids = new Set((doc.effects?.contents ?? doc.toObject?.()?.effects ?? []).map(e=>e.id ?? e._id));
      if (effectIconPatches.some(p=>!ids.has(p._id))) throw new Error('Effect changed after preview. Restart import.');
      await doc.updateEmbeddedDocuments('ActiveEffect',effectIconPatches);
    }
    if (iconChanged) {
      await doc.update({img:data.img});
      if (doc.img!==data.img) throw new Error('Icon verification failed.');
    }
    return true;
  }
  if (doc.parent) throw new Error('Full update is restricted to World Items.');
  const normalized=normalize(data);
  const before=doc.toObject();
  const flags=clone(before.flags ?? {});
  for (const [scope,fields] of Object.entries(data.flags ?? {})) {
    flags[scope]=scope==='coast-forge-importer'?clone(fields):{...(flags[scope]??{}),...clone(fields)};
  }
  // Keep the original document, folder, permissions, image unless selected.
  const patch={system:clone(normalized.system),flags};
  if (iconChanged) patch.img=data.img;
  const next=clone(normalized.effects ?? data.effects ?? []);
  const old=before.effects ?? [];
  const ids=new Set(next.map(e=>e._id));
  if (ids.size!==next.length || next.some(e=>!(/^[A-Za-z0-9]{16}$/.test(e._id ?? '')))) throw new Error('Invalid or duplicate effect ID.');
  const oldIds=new Set(old.map(e=>e._id));
  const add=next.filter(e=>!oldIds.has(e._id));
  const edit=next.filter(e=>oldIds.has(e._id));
  const remove=old.filter(e=>!ids.has(e._id)).map(e=>e._id);
  // New effects first, system references second, obsolete effects last. Not transactional.
  if (add.length) await doc.createEmbeddedDocuments('ActiveEffect',add,{keepId:true});
  if (edit.length) await doc.updateEmbeddedDocuments('ActiveEffect',edit,{diff:false,recursive:false});
  await doc.update(patch,{diff:false,recursive:false});
  if (remove.length) await doc.deleteEmbeddedDocuments('ActiveEffect',remove);
  const saved=doc.toObject();
  const actual=new Set((saved.effects??[]).map(e=>e._id));
  if (actual.size!==ids.size || [...ids].some(id=>!actual.has(id))) throw new Error('Updated effect IDs did not match.');
  const expectedActivities=Object.keys(patch.system.activities??{}).sort();
  const actualActivities=Object.keys(saved.system.activities??{}).sort();
  if (JSON.stringify(expectedActivities)!==JSON.stringify(actualActivities)) throw new Error('Updated activity IDs did not match.');
  if (iconChanged && doc.img!==data.img) throw new Error('Icon verification failed.');
  return true;
}
