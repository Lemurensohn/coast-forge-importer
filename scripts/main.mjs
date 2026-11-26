import { generateScrolls, MAX_SCROLLS } from "./scrolls.mjs";
import { PACK_SETTINGS, resolveReferences, referenceSources, hasDescriptionReferences } from "./references.mjs";
import { MODES, matchingItems, updateExisting } from "./updates.mjs";
import { planGrants, linkGrants } from "./grants.mjs";
import { parseImport, buildItemData, escapeHtml } from "./schema.mjs";
import { isWorldDestination, folderChoices, findWorldFolder, DEFAULT_FOLDER } from "./destinations.mjs";
import { createIconChoices } from "./icons.mjs";
import { createEffectIconChoices } from "./effect-icons.mjs";
import { renderPackPicker, bindPackPicker, selectedPacks } from "./pack-picker.mjs";

const MODULE_ID = "coast-forge-importer";
const TAG = "Coast Forge";
const DialogV2 = foundry.applications.api.DialogV2;

function notifyError(error) {
  console.error(`${TAG} |`, error);
  ui.notifications.error(`${TAG}: ${error.message ?? String(error)}`, { permanent: true });
}
function getDirectoryRoot(html, app) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return app?.element instanceof HTMLElement ? app.element : null;
}
function isItemDirectoryApp(app) {
  return app === ui?.items
    || app?.tabName === "items"
    || app?.id === "items"
    || app?.documentName === "Item"
    || app?.constructor?.name === "ItemDirectory";
}
function addDirectoryButton(app, html) {
  if (!game.user?.isGM) return;
  const root = getDirectoryRoot(html, app);
  if (!root) return;
  const tab = root.matches?.('#items, [data-tab="items"].directory, .item-directory')
    ? root
    : root.querySelector?.('#items, [data-tab="items"].directory, .item-directory');
  if (!tab && !isItemDirectoryApp(app)) return;
  const section = tab || root;
  const container = section.querySelector('.directory-header .action-buttons')
    || section.querySelector('.directory-header .header-actions')
    || section.querySelector('.directory-header');
  if (!container || section.querySelector('[data-coast-forge-open]')) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "coast-forge-open";
  button.setAttribute("data-coast-forge-open", "1");
  button.title = "Homebrew-Items mit Coast Forge importieren";
  button.innerHTML = '<i class="fa-solid fa-file-import"></i> Coast Forge Import';
  button.addEventListener("click", event => {
    event.preventDefault();
    void openImporter();
  });
  container.append(button);
}
function addButtonFromSidebar(app, html) {
  const root = getDirectoryRoot(html, app);
  const tab = root?.querySelector?.('#items, [data-tab="items"].directory, .item-directory');
  if (tab) addDirectoryButton(ui?.items, tab);
}
function packOptions(key, type) {
  const selected = game.settings.get(MODULE_ID,key);
  const sources = referenceSources(game.packs, game.journal, type);
  return `<option value="">${sources.length ? "Nicht ausgewählt" : "Keine passende Quelle gefunden"}</option>` + sources.map(p=>`<option value="${escapeHtml(p.value)}" ${p.value===selected?'selected':''}>${escapeHtml(p.label)}</option>`).join('');
}
async function askSource() {
  const actors = game.actors.contents
    .filter(a => a.isOwner)
    .sort((a, b) => a.name.localeCompare(b.name));
  const folders = folderChoices(game.folders).map(f=>`<option value="${escapeHtml(f.value)}">${escapeHtml(f.label)}</option>`).join('');
  const options = actors.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}</option>`).join("");
  return DialogV2.prompt({
    window: { title: "Coast Forge – Homebrew importieren", resizable: true },
    position: { width: Math.min(820, Math.max(300, globalThis.innerWidth - 32)) },
    content: `
      <div class="coast-forge-dialog">
        <p><strong>Format:</strong> JSON mit <code>schemaVersion: 1</code> und <code>items</code> bzw. <code>scrolls</code>. Eine .txt-Datei darf denselben JSON-Inhalt enthalten.</p>
        <div class="form-group"><label for="coast-forge-file">Datei (.json oder .txt)</label>
          <input id="coast-forge-file" type="file" name="sourceFile" accept=".json,.txt,application/json,text/plain"></div>
        <p class="hint">Alternativ Importtext direkt einfügen:</p>
        <textarea name="sourceText" rows="4" spellcheck="false" placeholder='{"schemaVersion":1,"items":[...]}'></textarea>
        <div class="form-group"><label for="coast-forge-target">Ziel</label>
          <select name="destination" id="coast-forge-target">
            <option value="world">Welt-Item-Verzeichnis (Ordner: Coast Forge Imports)</option>
            <optgroup label="Welt-Item-Ordner">${folders}</optgroup>
            <optgroup label="Actors">${options}</optgroup>
          </select></div>
        <div class="form-group"><label>Existing Items</label><select name="mode"><option value="skip">Skip Existing (Standard)</option><option value="icons">Update Icons Only</option><option value="update">Update Existing Items (nur Welt-Items)</option></select></div>
        <p class="hint">Vollupdate ersetzt Regeln, Activities, Effects und Advancements; UUID bleibt erhalten. Keine automatische Aktualisierung von Actor-Kopien.</p>
        <details><summary>Compendium-Referenzen (einmal einstellen)</summary>
          <div class="form-group"><label>Condition Effects (Items)</label><select name="effectPack">${packOptions('effectPack','Item')}</select></div>
          <div class="form-group"><label>Condition Journals (Compendium / World Journal)</label><select name="journalPack">${packOptions('journalPack','JournalEntry')}</select></div>
          <div class="form-group"><label>External Grant Items / Spell Links / Scroll Sources (mehrere möglich)</label>${renderPackPicker(referenceSources(game.packs, game.journal, "Item"), game.settings.get(MODULE_ID, "itemPack"))}<p class="hint">Einfach die gewünschten Compendiums anhaken. Ohne Treffer dort (oder ohne Auswahl) werden andere Item-Compendiums durchsucht. Mehrdeutige Treffer werden gemeldet, nicht geraten.</p></div>
        </details><p class="hint">Das Modul führt keine Makros aus. Nur vertrauenswürdige JSON und Compendiums verwenden.</p>
      </div>`,
    render: (_event, dialog) => bindPackPicker(dialog.element),
    ok: {
      label: "Vorschau prüfen",
      callback: async (_event, button) => {
        const form = button.form;
        const file = form.elements.namedItem("sourceFile")?.files?.[0];
        const text = file ? await file.text() : form.elements.namedItem("sourceText")?.value;
        const destination = form.elements.namedItem("destination")?.value ?? "world";
        const mode = form.elements.namedItem("mode")?.value ?? "skip";
        const packSelections = Object.fromEntries(Object.keys(PACK_SETTINGS).map(key=>[key,form.elements.namedItem(key)?.value ?? ""]));
        packSelections.itemPack = JSON.stringify(selectedPacks(form));
        return { text, destination, mode, packSelections };
      }
    },
    rejectClose: false
  });
}
function preflight(items) {
  const results = [];
  for (const item of items) {
    try {
      const data = buildItemData(item, () => foundry.utils.randomID());
      // Foundry may add non-configurable migration accessors to its input.
      // Validate a detached copy, never the editable import payload.
      new CONFIG.Item.documentClass(JSON.parse(JSON.stringify(data)));
      results.push({ item, data, error: null });
    } catch (error) {
      results.push({ item, data: null, error: String(error?.message ?? error) });
    }
  }
  return results;
}

// v0.1.9: native FilePicker for item and optional effect artwork.
async function confirmPreview(preview, warnings, destination, mode = "skip") {
  for (const row of preview) if (row.data && row.existing?.img) row.data.img = row.existing.img;
  const icons = createIconChoices(preview);
  const effectIcons = createEffectIconChoices(preview, icons, mode);
  let picker = null;
  let generation = 0;
  let active = true;
  const rows = preview.map(({ item, data, error }, index) => {
    const path = icons.get(index);
    const iconCell = error || !data ? "—" : `<div class="coast-forge-icon-controls">
      <img class="coast-forge-item-icon" src="${escapeHtml(path)}" alt="" title="${escapeHtml(path)}">
      <div class="coast-forge-icon-buttons">
        <button type="button" class="coast-forge-pick-icon" title="Icon auswählen: ${escapeHtml(item.name)}"><i class="fa-solid fa-image"></i> Bild wählen</button>
        <button type="button" class="coast-forge-reset-icon" title="Ursprüngliches Icon wiederherstellen" disabled><i class="fa-solid fa-rotate-left"></i> Reset</button>
      </div></div>`;
    const effectList = effectIcons.list(index);
    const effectCell = effectList.length ? `<details class="coast-forge-effect-picker"><summary>Active Effects (${effectList.length}) – Icons (optional)</summary>
      ${effectList.map(({index:j,name})=>{
        const choice=effectIcons.get(index,j);
        return `<div class="coast-forge-effect-row" data-coast-forge-effect="${j}">
          <img class="coast-forge-effect-image" src="${escapeHtml(choice.path)}" alt="">
          <div class="coast-forge-effect-fields"><strong>${escapeHtml(name)}</strong>
            <select class="coast-forge-effect-mode" aria-label="Icon-Modus: ${escapeHtml(name)}">${[['inherit','Item-Icon übernehmen'],['custom','Eigenes Icon'],['original','Original-Icon behalten']].map(([v,l])=>`<option value="${v}" ${choice.mode===v?'selected':''}>${l}</option>`).join('')}</select>
            <div class="coast-forge-effect-buttons"><button type="button" class="coast-forge-effect-choose" ${choice.mode==='custom'?'':'hidden'}><i class="fa-solid fa-image"></i> Bild wählen</button><button type="button" class="coast-forge-effect-reset" disabled>Reset</button></div>
          </div></div>`;
      }).join('')}</details>` : '';
    return `<tr data-coast-forge-row="${index}">
      <td>${iconCell}</td>
      <td>${escapeHtml(item.name)}${effectCell}</td>
      <td>${escapeHtml(item.type ?? item.kind ?? "")}</td>
      <td>${item.activities?.length ?? Object.keys(item.system?.activities ?? {}).length}</td>
      <td>${effectList.length || data?.effects?.length || item.effects?.length || 0}</td>
      <td>${error ? `<span class="coast-forge-error">${escapeHtml(error)}</span>` : escapeHtml(preview[index].existing ? (mode === "update" ? "Update" : mode === "icons" ? "Icon only (bei Auswahl)" : "Skip") : "Create")}</td>
      </tr>`;
  }).join("");
  const warningList = warnings.length
    ? `<details><summary>${warnings.length} Hinweis(e)</summary><ul>${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("")}</ul></details>`
    : "<p>Keine Formatwarnungen.</p>";
  const targetName = isWorldDestination(destination) ? (destination === 'world' ? `${DEFAULT_FOLDER} (Welt)` : folderChoices(game.folders).find(f=>f.value===destination)?.label ?? 'Unbekannt') : game.actors.get(destination)?.name ?? 'Unbekannt';
  const count = preview.filter(r => !r.error).length;
  let approved;
  try {
    approved = await DialogV2.confirm({
      window: { title: "Coast Forge – Importvorschau", resizable: true },
      position: { width: Math.min(900, Math.max(300, (globalThis.innerWidth ?? 932) - 32)) },
      modal: false,
      content: `<div class="coast-forge-preview">
        <p><strong>${count} von ${preview.length} Items vorgeprüft.</strong> Ziel: ${escapeHtml(targetName)}</p>
        ${mode === "update" ? `<p class="coast-forge-error"><strong>Vollupdate:</strong> Bestehende Regeln, Activities, Effects und Advancements werden ersetzt. Vorher Welt sichern; kein automatischer Rollback.</p>` : ""}
        <p class="hint">Optional: Wähle für jedes Item ein eigenes Bild aus der Foundry-Dateiauswahl. Ohne Auswahl bleibt das Item-Icon erhalten. Normale Effects übernehmen es automatisch; unter Active Effects kannst du einzelne Icons abweichend einstellen.</p>
        <table><thead><tr><th>Icon</th><th>Name</th><th>Typ</th><th>Activities</th><th>Effekte</th><th>Prüfung</th></tr></thead><tbody>${rows}</tbody></table>
        ${warningList}<p class="hint">Die Vorschau ist eine lokale Datenmodellprüfung; sie garantiert noch keine funktionierende Midi-QOL-Automation.</p>
      </div>`,
      render: (_event, dialog) => {
        for (const row of dialog.element.querySelectorAll("[data-coast-forge-row]")) {
          const index = Number(row.dataset.coastForgeRow);
          const choose = row.querySelector(".coast-forge-pick-icon");
          const reset = row.querySelector(".coast-forge-reset-icon");
          const image = row.querySelector(".coast-forge-item-icon");
          if (!choose || !reset || !image) continue;
          const effectControls = Array.from(row.querySelectorAll?.("[data-coast-forge-effect]") ?? []).map(el=>({
            index:Number(el.dataset.coastForgeEffect),
            image:el.querySelector(".coast-forge-effect-image"),
            mode:el.querySelector(".coast-forge-effect-mode"),
            choose:el.querySelector(".coast-forge-effect-choose"),
            reset:el.querySelector(".coast-forge-effect-reset")
          }));
          const refresh = () => {
            const path = icons.get(index);
            image.src = path;
            image.title = path;
            reset.disabled = !icons.changed(index);
            for (const control of effectControls) {
              const value = effectIcons.get(index,control.index);
              control.image.src=value.path; control.image.title=value.path;
              control.mode.value=value.mode;
              control.choose.hidden=value.mode!=="custom";
              control.reset.disabled=!value.touched;
            }
          };
          refresh();
          // A single native picker, with stale callback protection shared by all rows.
          const openPicker = async (event,current,select) => {
            event.preventDefault(); event.stopPropagation();
            if (!active) return;
            const request = ++generation;
            try {
              if (picker?.rendered) await picker.close();
              if (!active || request !== generation) return;
              const NativePicker = foundry.applications.apps.FilePicker;
              const Picker = NativePicker.implementation ?? NativePicker;
              const opened = new Picker({
                type: "image", current,
                callback: path => {
                  if (!active || request !== generation || !select(path)) return;
                  refresh();
                }
              });
              picker = opened;
              await opened.browse();
              if (!active || request !== generation) {
                if (opened.rendered) await opened.close();
                return;
              }
              if (!opened.rendered) await opened.render({ force: true });
            } catch (error) { notifyError(error); }
          };
          choose.onclick = event => openPicker(event,icons.get(index),path=>icons.select(index,path));
          reset.onclick = event => {
            event.preventDefault(); event.stopPropagation();
            if (active && icons.reset(index)) { generation++; refresh(); }
          };
          for (const control of effectControls) {
            control.mode.onchange = () => {
              if (active && effectIcons.setMode(index,control.index,control.mode.value)) { generation++; refresh(); }
            };
            control.choose.onclick = event => openPicker(event,effectIcons.get(index,control.index).path,path=>effectIcons.select(index,control.index,path));
            control.reset.onclick = event => {
              event.preventDefault(); event.stopPropagation();
              if (active && effectIcons.reset(index,control.index)) { generation++; refresh(); }
            };
          }
        }
      },
      yes: { label: "Importieren" }, no: { label: "Abbrechen" },
      rejectClose: false
    });
    if (approved) {
      for (let i=0;i<preview.length;i++) preview[i].iconChanged=icons.changed(i);
      icons.commit();
      effectIcons.commit();
    }
    return approved;
  } finally {
    active = false;
    if (picker?.rendered) {
      try { await picker.close(); }
      catch (error) { console.warn(`${TAG} | FilePicker konnte nicht geschlossen werden.`, error); }
    }
  }
}
async function resolveTarget(destination) {
  if (!isWorldDestination(destination)) {
    const actor = game.actors.get(destination);
    if (!actor || !actor.isOwner) throw new Error("Ziel-Actor nicht gefunden oder keine Berechtigung.");
    return { actor, folder: null };
  }
  let folder = findWorldFolder(destination, game.folders);
  if (!folder) folder = await Folder.create({ name: DEFAULT_FOLDER, type: "Item" });
  return { actor: null, folder };
}
async function performImport(preview, destination, plans = [], mode = "skip") {
  const documents = new Map();
  let linked = 0;
  const { actor, folder } = await resolveTarget(destination);
  const successes = [], skipped = [], failures = [], updated = [];
  for (const { item, data, error, iconChanged, existing, effectIconPatches } of preview) {
    if (error) { failures.push(`${item.name}: ${error}`); continue; }
    try {
      const collection = actor ? actor.items.contents : game.items.contents.filter(i => i.folder?.id === folder.id);
      const matches = matchingItems(collection,data);
      if (mode !== "skip" && (matches.length > 1 || (existing?.id ?? null) !== (matches[0]?.id ?? null))) throw new Error("Target changed after preview or ambiguous match. Restart import.");
      if (matches.length) {
        if (plans.length && item.ref) {
          if (matches.length !== 1 || matches[0].flags?.[MODULE_ID]?.localRef !== item.ref) throw new Error("Existing item does not match local reference; rename or remove it before importing.");
          documents.set(item.ref, matches[0]);
        }
        if (mode !== "skip" && await updateExisting(matches[0],data,mode,iconChanged,d=>new CONFIG.Item.documentClass(JSON.parse(JSON.stringify(d))).toObject(),effectIconPatches)) updated.push(item.name);
        else skipped.push(item.name);
        continue;
      }
      if (actor) {
        await actor.createEmbeddedDocuments("Item", [data]);
      } else {
        const created = await Item.implementation.createDocuments([{ ...data, folder: folder.id }]);
        if (plans.length && item.ref) documents.set(item.ref, created?.[0]);
      }
      successes.push(item.name);
    } catch (err) {
      failures.push(`${item.name}: ${String(err?.message ?? err)}`);
      console.error(`${TAG} | Import fehlgeschlagen: ${item.name}`, err);
    }
  }
  if (plans.length && !failures.length) {
    try { linked = await linkGrants(plans, documents, {readOnlyParents: new Set(mode === "icons" ? preview.filter(r=>r.existing).map(r=>r.item.ref) : [])}); }
    catch (err) { failures.push(`Grant Items: ${err.message}`); }
  } else if (plans.length) failures.push("Grant linking skipped because an item failed.");
  const resultText = `${successes.length} importiert, ${updated.length} aktualisiert, ${skipped.length} übersprungen, ${failures.length} fehlgeschlagen.${plans.length ? ` ${linked} Grant-Links bestätigt.` : ""}`;
  const failuresHtml = failures.length ? `<details open><summary>Fehler</summary><ul>${failures.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul></details>` : "";
  const skippedHtml = skipped.length ? `<details><summary>Übersprungen</summary><ul>${skipped.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details>` : "";
  await DialogV2.prompt({
    window: { title: "Coast Forge – Importergebnis" },
    content: `<div class="coast-forge-preview"><p><strong>${escapeHtml(resultText)}</strong></p>${failuresHtml}${skippedHtml}</div>`,
    ok: { label: "Schließen" }, rejectClose: false
  });
  if (failures.length) ui.notifications.warn(`${TAG}: ${resultText}`);
  else ui.notifications.info(`${TAG}: ${resultText}`);
  return { successes, skipped, failures, linked, updated };
}
export async function openImporter() {
  if (!game.user?.isGM) { ui.notifications.warn("Coast Forge: Nur Spielleitungen dürfen importieren."); return; }
  if (game.system?.id !== "dnd5e") { ui.notifications.error("Coast Forge: Benötigt das dnd5e-System."); return; }
  const major = Number(String(game.system.version).split(".")[0]);
  if (major !== 5) {
    ui.notifications.warn(`Coast Forge v0.1 wurde für D&D5e 5.x entwickelt. Installiert ist ${game.system.version}; bitte in einer Testwelt prüfen.`);
  }
  try {
    const entry = await askSource();
    if (!entry) return;
    const parsed = parseImport(entry.text);
    const mode = entry.mode ?? "skip";
    if (!MODES.includes(mode)) throw new Error("Unknown import mode.");
    if (mode === "update" && !isWorldDestination(entry.destination)) throw new Error("Full updates are limited to World Items.");
    const hasReferences = parsed.items.some(i=>i.effectRefs !== undefined || i.compendiumGrants !== undefined || hasDescriptionReferences(i));
    if (!isWorldDestination(entry.destination) && parsed.items.some(i=>i.compendiumGrants?.length)) throw new Error("Compendium grants require World Items.");
    const resolved = hasReferences ? await resolveReferences(parsed.items,entry.packSelections ?? {},game.packs,()=>foundry.utils.randomID(),game.journal) : {items:parsed.items,warnings:[]};
    if (parsed.scrolls?.length) {
      const cls = CONFIG.Item.documentClass;
      const generated = await generateScrolls(parsed.scrolls, {
        packs: game.packs, selection: entry.packSelections?.itemPack,
        createScroll: typeof cls.createScrollFromSpell === "function" ? cls.createScrollFromSpell.bind(cls) : undefined,
        challengeTable: CONFIG.DND5E.spellScrollValues,
        limit: MAX_SCROLLS - resolved.items.length
      });
      const names = new Set(resolved.items.map(i=>i.name));
      if (generated.items.some(i=>names.has(i.name))) throw new Error("Duplicate scroll name in items and scrolls.");
      resolved.items.push(...generated.items);
      resolved.warnings.push(...generated.warnings);
    }
    const plans = planGrants(resolved.items);
    if (plans.length && !isWorldDestination(entry.destination)) throw new Error("Linked advancement imports require World Items.");
    const preview = preflight(resolved.items);
    parsed.warnings.push(...resolved.warnings);
    const folder = isWorldDestination(entry.destination) ? findWorldFolder(entry.destination,game.folders) : null;
    const collection = isWorldDestination(entry.destination) ? (folder ? game.items.contents.filter(i=>i.folder?.id===folder.id) : []) : game.actors.get(entry.destination)?.items.contents ?? [];
    const seen = new Set();
    for (const row of preview) if (row.data) {
      const matches = matchingItems(collection,row.data);
      const signature = JSON.stringify([row.data.name,row.data.type]);
      if (mode!=="skip" && (matches.length>1 || seen.has(signature))) throw new Error(`${row.data.name}: ambiguous update target.`);
      seen.add(signature);
      if (matches.length===1) {
        row.existing=matches[0];
        if (row.existing.name!==row.data.name) parsed.warnings.push(`${row.data.name}: existing legacy-named scroll found (${row.existing.name}). It will not be renamed automatically; rename it manually or use the optional rename macro.`);
      }
      if (plans.length && row.item.ref && matches.length && (matches.length!==1 || matches[0].flags?.[MODULE_ID]?.localRef!==row.item.ref)) throw new Error(`${row.data.name}: existing item does not match local reference.`);
    }
    if (parsed.scrolls?.length && preview.some(p=>p.error)) throw new Error("Scroll import blocked: " + preview.filter(p=>p.error).map(p=>`${p.item.name}: ${p.error}`).join("; "));
    if (mode==='update') {
      if (preview.some(p=>p.error)) throw new Error('Full update blocked: invalid item in preview.');
      parsed.warnings.unshift('Full update replaces existing system data and embedded effects; no automatic rollback. Back up the world.');
    }
    if (mode==='skip' && preview.some(p=>p.existing)) parsed.warnings.unshift('Existing items are skipped: selected new icons will not be applied.');
    if (plans.length && preview.some(p => p.error)) throw new Error("Linked import blocked: " + preview.filter(p=>p.error).map(p=>`${p.item.name}: ${p.error}`).join("; "));
    if (plans.length) parsed.warnings.unshift(`${plans.reduce((n,p)=>n+p.refs.length,0)} Grant-Item-Verknüpfungen werden nach dem Import erstellt.`);
    const approved = await confirmPreview(preview, parsed.warnings, entry.destination, mode);
    if (!approved) return;
    if (!preview.some(p => !p.error)) {
      ui.notifications.error("Coast Forge: Kein gültiges Item zum Importieren.");
      return;
    }
    if (entry.packSelections) for (const key of Object.keys(PACK_SETTINGS)) {
      if (game.settings.get(MODULE_ID,key)!==entry.packSelections[key]) await game.settings.set(MODULE_ID,key,entry.packSelections[key]);
    }
    return await performImport(preview, entry.destination, plans, mode);
  } catch (error) { notifyError(error); }
}
Hooks.once("init",()=>{
  for (const key of Object.keys(PACK_SETTINGS)) game.settings.register(MODULE_ID,key,{scope:"world",config:false,type:String,default:""});
});
Hooks.on("renderItemDirectory", addDirectoryButton);
Hooks.on("renderItemDirectory5e", addDirectoryButton);
Hooks.on("renderSidebarTab", (app, html) => {
  if (isItemDirectoryApp(app)) addDirectoryButton(app, html);
});
Hooks.on("renderApplicationV2", (app, html) => {
  if (isItemDirectoryApp(app)) addDirectoryButton(app, html);
});
Hooks.on("renderSidebar", addButtonFromSidebar);
Hooks.once("ready", () => {
  if (game.system?.id !== "dnd5e") return;
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = Object.freeze({
    open: openImporter,
    parse: parseImport,
    build: (spec) => buildItemData(spec, () => foundry.utils.randomID())
  });
  if (game.user?.isGM) {
    addDirectoryButton(ui?.items, ui?.items?.element);
    addButtonFromSidebar(ui?.sidebar, ui?.sidebar?.element);
    console.info(`${TAG} | Bereit. Öffnen per game.modules.get("${MODULE_ID}").api.open()`);
  }
});
