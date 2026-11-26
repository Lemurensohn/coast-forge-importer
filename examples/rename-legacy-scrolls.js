// Coast Forge v0.1.12: rename existing v0.1.11 generated World Item scrolls only.
// Does not change descriptions, icons, quantities, activities, effects or IDs.
if (!game.user.isGM) throw new Error('GM required.');
const items = game.items.contents;
const prefixes = ['Cantrip','1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];
const plan = [];
for (const item of items) {
  if (item.type !== 'consumable' || item.system.type.value !== 'scroll' || item.flags?.['coast-forge-importer']?.schemaVersion !== 1) continue;
  const match = /^Spell Scroll: (.+) \((Cantrip|Level [1-9])\)$/.exec(item.name);
  if (!match) continue;
  const level = match[2] === 'Cantrip' ? 0 : Number(match[2].slice(6));
  if (item.flags?.dnd5e?.spellLevel?.value !== level) continue;
  plan.push({item, name:`${prefixes[level]} Spellscroll – ${match[1]}`});
}
const folderId = item => item.folder?.id ?? null;
const safe = plan.filter(({item,name}) => !items.some(i=>i.id!==item.id && folderId(i)===folderId(item) && i.type==='consumable' && i.name===name) && !plan.some(p=>p.item.id!==item.id && folderId(p.item)===folderId(item) && p.name===name));
if (!safe.length) ui.notifications.info(`Coast Forge: No unambiguous legacy scrolls to rename (${plan.length} candidates).`);
else {
  const confirmed = await foundry.applications.api.DialogV2.confirm({window:{title:'Coast Forge — Rename Spellscrolls'},content:`<p>Rename ${safe.length} generated World Item scrolls? ${plan.length-safe.length} conflicts will be skipped. No mechanics or IDs will change.</p>`});
  if (confirmed) {
    await Item.implementation.updateDocuments(safe.map(({item,name})=>({_id:item.id,name})));
    ui.notifications.info(`Coast Forge: Renamed ${safe.length} scrolls. Skipped ${plan.length-safe.length} conflicts.`);
  }
}
