/** Isolated, per-row icon choices. No world writes until the import is approved. */
export function createIconChoices(preview) {
  const original = preview.map(row => row.error || !row.data ? null : row.data.img);
  const current = [...original];
  const valid = index => Number.isInteger(index) && index >= 0 && index < original.length && original[index] !== null;
  return {
    get(index) { return valid(index) ? current[index] : null; },
    changed(index) { return valid(index) && current[index] !== original[index]; },
    select(index, path) {
      if (!valid(index) || typeof path !== "string" || !path.trim()) return false;
      // Foundry asset paths and Forge URLs must remain unchanged.
      current[index] = path;
      return true;
    },
    reset(index) {
      if (!valid(index)) return false;
      current[index] = original[index];
      return true;
    },
    commit() {
      for (let i = 0; i < current.length; i++) {
        if (valid(i) && current[i] !== original[i]) preview[i].data.img = current[i];
      }
    }
  };
}
