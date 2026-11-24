import { escapeHtml } from './schema.mjs';
import { readPackSelection } from './references.mjs';

export function renderPackPicker(sources, saved) {
  const selected = new Set(readPackSelection(saved));
  const count = sources.filter(p => selected.has(p.value)).length;
  return `<section class="coast-forge-pack-picker" aria-label="External Grant Items / Spell Links">
    <div class="coast-forge-pack-toolbar">
      <input type="search" class="coast-forge-pack-search" aria-label="Compendiums suchen" placeholder="Compendiums suchen …" autocomplete="off">
      <button type="button" class="coast-forge-pack-clear">Auswahl leeren</button>
    </div>
    <div class="coast-forge-pack-count" aria-live="polite">${count} ausgewählt · ${sources.length} verfügbar</div>
    <div class="coast-forge-pack-list" role="group" aria-label="Bevorzugte Item-Compendiums">
      ${sources.map(p => `<label class="coast-forge-pack-row"><input type="checkbox" name="itemPack" value="${escapeHtml(p.value)}"${selected.has(p.value) ? ' checked' : ''}><span>${escapeHtml(p.label)}</span></label>`).join('')}
      <p class="coast-forge-pack-empty"${sources.length ? ' hidden' : ''}>Keine passenden Compendiums.</p>
    </div>
  </section>`;
}
export function selectedPacks(form) {
  return Array.from(form.querySelectorAll('input[name="itemPack"]:checked'), input => input.value);
}
export function bindPackPicker(root) {
  const picker = root.querySelector('.coast-forge-pack-picker');
  if (!picker) return;
  const search = picker.querySelector('.coast-forge-pack-search');
  const clear = picker.querySelector('.coast-forge-pack-clear');
  const count = picker.querySelector('.coast-forge-pack-count');
  const empty = picker.querySelector('.coast-forge-pack-empty');
  const rows = Array.from(picker.querySelectorAll('.coast-forge-pack-row'));
  const entries = rows.map(row => ({row, input:row.querySelector('input'), text:row.textContent.toLocaleLowerCase()}));
  const refresh = () => {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const entry of entries) {
      entry.row.hidden = !terms.every(term => entry.text.includes(term));
      if (!entry.row.hidden) visible++;
    }
    const checked = entries.filter(entry => entry.input.checked).length;
    count.textContent = `${checked} ausgewählt · ${visible} von ${entries.length} sichtbar`;
    empty.hidden = visible > 0;
    clear.disabled = checked === 0;
  };
  search.oninput = refresh;
  search.onkeydown = event => { if (event.key === 'Enter') event.preventDefault(); };
  for (const entry of entries) entry.input.onchange = refresh;
  clear.onclick = () => { for (const entry of entries) entry.input.checked = false; refresh(); };
  refresh();
}
