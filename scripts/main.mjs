import { planGrants, linkGrants } from "./grants.mjs";
import { parseImport, buildItemData, escapeHtml } from "./schema.mjs";
import { createIconChoices } from "./icons.mjs";

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
async function askSource() {
  const actors = game.actors.contents
    .filter(a => a.isOwner)
    .sort((a, b) => a.name.localeCompare(b.name));
  const options = actors.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}</option>`).join("");
  return DialogV2.prompt({
    window: { title: "Coast Forge – Homebrew importieren" },
    content: `
      <div class="coast-forge-dialog">
        <p><strong>Format:</strong> JSON mit <code>schemaVersion: 1</code> und <code>items</code>. Eine .txt-Datei darf denselben JSON-Inhalt enthalten.</p>
        <div class="form-group"><label for="coast-forge-file">Datei (.json oder .txt)</label>
          <input id="coast-forge-file" type="file" name="sourceFile" accept=".json,.txt,application/json,text/plain"></div>
        <p class="hint">Alternativ Importtext direkt einfügen:</p>
        <textarea name="sourceText" rows="11" spellcheck="false" placeholder='{"schemaVersion":1,"items":[...]}'></textarea>
        <div class="form-group"><label for="coast-forge-target">Ziel</label>
          <select name="destination" id="coast-forge-target">
            <option value="world">Welt-Item-Verzeichnis (Ordner: Coast Forge Imports)</option>
            ${options}
          </select></div>
        <p class="hint">Bestehende Items mit gleichem Namen und Typ am Ziel werden übersprungen. Das Modul führt keine Makros aus.</p>
      </div>`,
    ok: {
      label: "Vorschau prüfen",
      callback: async (_event, button) => {
        const form = button.form;
        const file = form.elements.namedItem("sourceFile")?.files?.[0];
        const text = file ? await file.text() : form.elements.namedItem("sourceText")?.value;
        const destination = form.elements.namedItem("destination")?.value ?? "world";
        return { text, destination };
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
      new CONFIG.Item.documentClass(data);
      results.push({ item, data, error: null });
    } catch (error) {
      results.push({ item, data: null, error: String(error?.message ?? error) });
    }
  }
  return results;
}

// v0.1.2: a native FilePicker for each preview row. Only img is changed.
async function confirmPreview(preview, warnings, destination) {
  const icons = createIconChoices(preview);
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
    return `<tr data-coast-forge-row="${index}">
      <td>${iconCell}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.type ?? item.kind ?? "")}</td>
      <td>${item.activities?.length ?? Object.keys(item.system?.activities ?? {}).length}</td>
      <td>${item.effects?.length ?? 0}</td>
      <td>${error ? `<span class="coast-forge-error">${escapeHtml(error)}</span>` : "✓"}</td>
      </tr>`;
  }).join("");
  const warningList = warnings.length
    ? `<details><summary>${warnings.length} Hinweis(e)</summary><ul>${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("")}</ul></details>`
    : "<p>Keine Formatwarnungen.</p>";
  const targetName = destination === "world" ? "Coast Forge Imports (Welt)" : game.actors.get(destination)?.name ?? "Unbekannt";
  const count = preview.filter(r => !r.error).length;
  let approved;
  try {
    approved = await DialogV2.confirm({
      window: { title: "Coast Forge – Importvorschau" },
      position: { width: 760 },
      modal: false,
      content: `<div class="coast-forge-preview">
        <p><strong>${count} von ${preview.length} Items vorgeprüft.</strong> Ziel: ${escapeHtml(targetName)}</p>
        <p class="hint">Optional: Wähle für jedes Item ein eigenes Bild aus der Foundry-Dateiauswahl. Ohne Auswahl bleibt das bisherige Icon erhalten.</p>
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
          const refresh = () => {
            const path = icons.get(index);
            image.src = path;
            image.title = path;
            reset.disabled = !icons.changed(index);
          };
          refresh();
          // Assign handlers rather than accumulating listeners on dialog re-render.
          choose.onclick = async event => {
            event.preventDefault();
            event.stopPropagation();
            if (!active) return;
            const request = ++generation;
            try {
              if (picker?.rendered) await picker.close();
              if (!active || request !== generation) return;
              const NativePicker = foundry.applications.apps.FilePicker;
              const Picker = NativePicker.implementation ?? NativePicker;
              const opened = new Picker({
                type: "image",
                current: icons.get(index),
                callback: path => {
                  if (!active || request !== generation || !icons.select(index, path)) return;
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
          reset.onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            if (active && icons.reset(index)) refresh();
          };
        }
      },
      yes: { label: "Importieren" }, no: { label: "Abbrechen" },
      rejectClose: false
    });
    if (approved) icons.commit();
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
  if (destination !== "world") {
    const actor = game.actors.get(destination);
    if (!actor || !actor.isOwner) throw new Error("Ziel-Actor nicht gefunden oder keine Berechtigung.");
    return { actor, folder: null };
  }
  let folder = game.folders.find(f => f.type === "Item" && f.name === "Coast Forge Imports" && !f.folder);
  if (!folder) folder = await Folder.create({ name: "Coast Forge Imports", type: "Item" });
  return { actor: null, folder };
}
async function performImport(preview, destination, plans = []) {
  const documents = new Map();
  let linked = 0;
  const { actor, folder } = await resolveTarget(destination);
  const successes = [], skipped = [], failures = [];
  for (const { item, data, error } of preview) {
    if (error) { failures.push(`${item.name}: ${error}`); continue; }
    try {
      const collection = actor ? actor.items.contents : game.items.contents.filter(i => i.folder?.id === folder.id);
      const matches = collection.filter(i => i.name === data.name && i.type === data.type);
      if (matches.length) {
        if (plans.length && item.ref) {
          if (matches.length !== 1 || matches[0].flags?.[MODULE_ID]?.localRef !== item.ref) throw new Error("Existing item does not match local reference; rename or remove it before importing.");
          documents.set(item.ref, matches[0]);
        }
        skipped.push(item.name); continue;
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
    try { linked = await linkGrants(plans, documents); }
    catch (err) { failures.push(`Grant Items: ${err.message}`); }
  } else if (plans.length) failures.push("Grant linking skipped because an item failed.");
  const resultText = `${successes.length} importiert, ${skipped.length} übersprungen, ${failures.length} fehlgeschlagen.${plans.length ? ` ${linked} Grant-Links bestätigt.` : ""}`;
  const failuresHtml = failures.length ? `<details open><summary>Fehler</summary><ul>${failures.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul></details>` : "";
  const skippedHtml = skipped.length ? `<details><summary>Übersprungen</summary><ul>${skipped.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details>` : "";
  await DialogV2.prompt({
    window: { title: "Coast Forge – Importergebnis" },
    content: `<div class="coast-forge-preview"><p><strong>${escapeHtml(resultText)}</strong></p>${failuresHtml}${skippedHtml}</div>`,
    ok: { label: "Schließen" }, rejectClose: false
  });
  if (failures.length) ui.notifications.warn(`${TAG}: ${resultText}`);
  else ui.notifications.info(`${TAG}: ${resultText}`);
  return { successes, skipped, failures, linked };
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
    const plans = planGrants(parsed.items);
    if (plans.length && entry.destination !== "world") throw new Error("Linked advancement imports require World Items.");
    const preview = preflight(parsed.items);
    if (plans.length && preview.some(p => p.error)) throw new Error("Linked import blocked: " + preview.filter(p=>p.error).map(p=>`${p.item.name}: ${p.error}`).join("; "));
    if (plans.length) parsed.warnings.unshift(`${plans.reduce((n,p)=>n+p.refs.length,0)} Grant-Item-Verknüpfungen werden nach dem Import erstellt.`);
    const approved = await confirmPreview(preview, parsed.warnings, entry.destination);
    if (!approved) return;
    if (!preview.some(p => !p.error)) {
      ui.notifications.error("Coast Forge: Kein gültiges Item zum Importieren.");
      return;
    }
    return await performImport(preview, entry.destination, plans);
  } catch (error) { notifyError(error); }
}
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
