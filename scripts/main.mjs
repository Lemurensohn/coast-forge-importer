import { parseImport, buildItemData, escapeHtml } from "./schema.mjs";

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

function addDirectoryButton(app, html) {
  if (!game.user?.isGM) return;
  const root = getDirectoryRoot(html, app);
  if (!root || !root.matches?.("#items, .item-directory, .directory") && !root.querySelector?.("#items")) {
    // The directory's own root can have a variety of classes across v13 builds.
    if (app?.tabName !== "items" && app?.id !== "items") return;
  }
  const container = root.querySelector(".directory-header .header-actions")
    || root.querySelector(".directory-header");
  if (!container || container.querySelector("[data-coast-forge-open]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "coast-forge-open";
  button.setAttribute("data-coast-forge-open", "1");
  button.innerHTML = '<i class="fa-solid fa-file-import"></i> Coast Forge Import';
  button.addEventListener("click", event => { event.preventDefault(); void openImporter(); });
  container.append(button);
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
      // Constructor validates the installed dnd5e data model without writing to the world.
      new CONFIG.Item.documentClass(data);
      results.push({ item, data, error: null });
    } catch (error) {
      results.push({ item, data: null, error: String(error?.message ?? error) });
    }
  }
  return results;
}

async function confirmPreview(preview, warnings, destination) {
  const rows = preview.map(({ item, error }) => `<tr>
    <td>${escapeHtml(item.name)}</td>
    <td>${escapeHtml(item.type ?? item.kind ?? "")}</td>
    <td>${item.activities?.length ?? Object.keys(item.system?.activities ?? {}).length}</td>
    <td>${item.effects?.length ?? 0}</td>
    <td>${error ? `<span class="coast-forge-error">${escapeHtml(error)}</span>` : "✓"}</td>
    </tr>`).join("");
  const warningList = warnings.length
    ? `<details><summary>${warnings.length} Hinweis(e)</summary><ul>${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("")}</ul></details>`
    : "<p>Keine Formatwarnungen.</p>";
  const targetName = destination === "world" ? "Coast Forge Imports (Welt)" : game.actors.get(destination)?.name ?? "Unbekannt";
  const count = preview.filter(r => !r.error).length;
  return DialogV2.confirm({
    window: { title: "Coast Forge – Importvorschau" },
    content: `<div class="coast-forge-preview">
      <p><strong>${count} von ${preview.length} Items vorgeprüft.</strong> Ziel: ${escapeHtml(targetName)}</p>
      <table><thead><tr><th>Name</th><th>Typ</th><th>Activities</th><th>Effekte</th><th>Prüfung</th></tr></thead><tbody>${rows}</tbody></table>
      ${warningList}<p class="hint">Die Vorschau ist eine lokale Datenmodellprüfung; sie garantiert noch keine funktionierende Midi-QOL-Automation.</p>
    </div>`,
    yes: { label: "Importieren" }, no: { label: "Abbrechen" },
    rejectClose: false
  });
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

async function performImport(preview, destination) {
  const { actor, folder } = await resolveTarget(destination);
  const successes = [], skipped = [], failures = [];
  for (const { item, data, error } of preview) {
    if (error) { failures.push(`${item.name}: ${error}`); continue; }
    try {
      const collection = actor ? actor.items.contents : game.items.contents.filter(i => i.folder?.id === folder.id);
      const exists = collection.some(i => i.name === data.name && i.type === data.type);
      if (exists) { skipped.push(item.name); continue; }
      if (actor) {
        await actor.createEmbeddedDocuments("Item", [data]);
      } else {
        await Item.implementation.createDocuments([{ ...data, folder: folder.id }]);
      }
      successes.push(item.name);
    } catch (err) {
      failures.push(`${item.name}: ${String(err?.message ?? err)}`);
      console.error(`${TAG} | Import fehlgeschlagen: ${item.name}`, err);
    }
  }
  const resultText = `${successes.length} importiert, ${skipped.length} übersprungen, ${failures.length} fehlgeschlagen.`;
  const failuresHtml = failures.length ? `<details open><summary>Fehler</summary><ul>${failures.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul></details>` : "";
  const skippedHtml = skipped.length ? `<details><summary>Übersprungen</summary><ul>${skipped.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details>` : "";
  await DialogV2.prompt({
    window: { title: "Coast Forge – Importergebnis" },
    content: `<div class="coast-forge-preview"><p><strong>${escapeHtml(resultText)}</strong></p>${failuresHtml}${skippedHtml}</div>`,
    ok: { label: "Schließen" }, rejectClose: false
  });
  if (failures.length) ui.notifications.warn(`${TAG}: ${resultText}`);
  else ui.notifications.info(`${TAG}: ${resultText}`);
  return { successes, skipped, failures };
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
    const preview = preflight(parsed.items);
    const approved = await confirmPreview(preview, parsed.warnings, entry.destination);
    if (!approved) return;
    if (!preview.some(p => !p.error)) {
      ui.notifications.error("Coast Forge: Kein gültiges Item zum Importieren.");
      return;
    }
    return await performImport(preview, entry.destination);
  } catch (error) { notifyError(error); }
}

Hooks.once("ready", () => {
  if (game.system?.id !== "dnd5e") return;
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = Object.freeze({
    open: openImporter,
    parse: parseImport,
    build: (spec) => buildItemData(spec, () => foundry.utils.randomID())
  });
  if (game.user?.isGM) {
    Hooks.on("renderItemDirectory", addDirectoryButton);
    Hooks.on("renderItemDirectory5e", addDirectoryButton);
    Hooks.on("renderSidebarTab", (app, html) => {
      if (app?.tabName === "items" || app?.id === "items") addDirectoryButton(app, html);
    });
    console.info(`${TAG} | Bereit. Öffnen per game.modules.get("${MODULE_ID}").api.open()`);
  }
});
