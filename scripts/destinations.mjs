/** World-folder destinations preserve old actor IDs and the default import folder. */
export const DEFAULT_FOLDER = 'Coast Forge Imports';
export const isWorldDestination = value => value === 'world' || (typeof value === 'string' && value.startsWith('folder:'));
const contents = x => x?.contents ?? (Array.isArray(x) ? x : [...(x?.values?.() ?? [])]);
export function folderChoices(folders, type = 'Item') {
  const entries = contents(folders).filter(f => f.type === type);
  const byId = new Map(entries.map(f => [f.id, f]));
  return entries.map(f => {
    const names = [f.name]; const seen = new Set([f.id]); let parent = f.folder;
    while (parent) {
      const id = typeof parent === 'string' ? parent : parent.id;
      if (!id || seen.has(id) || !byId.has(id)) break;
      seen.add(id); const doc = byId.get(id); names.unshift(doc.name); parent = doc.folder;
    }
    return {value:`folder:${f.id}`,label:names.join(' / ')};
  }).sort((a,b)=>a.label.localeCompare(b.label));
}
export function findWorldFolder(destination, folders) {
  const entries = contents(folders);
  if (destination === 'world') return entries.find(f=>f.type==='Item' && f.name===DEFAULT_FOLDER && !f.folder) ?? null;
  if (!isWorldDestination(destination)) throw new Error('Not a World Item destination.');
  const folder = entries.find(f=>f.id===destination.slice(7) && f.type==='Item');
  if (!folder) throw new Error('Selected Item folder is no longer available. Restart import.');
  return folder;
}
