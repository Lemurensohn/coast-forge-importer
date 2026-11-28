import {validateAuraEffect,compileAuraEffect} from "./auras.mjs";
import {validateAdvancedSummon} from "./advanced-summoning.mjs";
/**
 * Coast Forge Importer v0.1 -- pure, testable parser/builder.
 * JSON is data; this module intentionally never evaluates source code.
 */
export const SCHEMA_VERSION = 1;
export const ALLOWED_TYPES = new Set([
  "feat", "spell", "weapon", "equipment", "consumable", "tool", "loot", "container", "class", "subclass", "race"
]);
const KIND_TO_TYPE = Object.freeze({
  feature: "feat", feat: "feat", maneuver: "feat", manoeuvre: "feat", invocation: "feat",
  spell: "spell", cantrip: "spell", weapon: "weapon", armor: "equipment",
  armour: "equipment", equipment: "equipment", gear: "equipment", consumable: "consumable",
  potion: "consumable", tool: "tool", loot: "loot", item: "loot", container: "container",
  class: "class", subclass: "subclass", race: "race", species: "race"
});
const DEFAULT_IMAGES = Object.freeze({
  feat: "icons/svg/book.svg", spell: "icons/svg/aura.svg", weapon: "icons/svg/sword.svg",
  equipment: "icons/svg/shield.svg", consumable: "icons/svg/potion.svg",
  tool: "icons/svg/item-bag.svg", loot: "icons/svg/item-bag.svg",
  container: "icons/svg/item-bag.svg", class: "icons/svg/book.svg", subclass: "icons/svg/book.svg", race: "icons/svg/book.svg"
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export { escapeHtml };
function renderDescription(value) {
  if (!value) return "";
  const safe = escapeHtml(value).replace(/\r\n?/g, "\n");
  return safe.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
}
export function getItemType(spec) {
  const requested = String(spec.type ?? spec.kind ?? "").trim().toLowerCase();
  return KIND_TO_TYPE[requested] ?? requested;
}
export function parseImport(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("Die Importdatei ist leer.");
  if (text.length > 1_000_000) throw new Error("Die Importdatei ist zu groß (maximal 1 MB Text).");
  let input;
  try { input = JSON.parse(text.replace(/^\uFEFF/, "")); }
  catch (error) { throw new Error(`Ungültiges JSON: ${error.message}`); }
  if (!isObject(input)) throw new Error("Die Datei muss ein JSON-Objekt sein.");
  if (input.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unbekannte schemaVersion ${String(input.schemaVersion)}. Erwartet: ${SCHEMA_VERSION}.`);
  }
  const scrolls = input.scrolls === undefined ? [] : input.scrolls;
  if (!Array.isArray(scrolls) || scrolls.length > 500) throw new Error("'scrolls' muss eine Liste mit maximal 500 Einträgen sein.");
  const items = input.items === undefined ? [] : input.items;
  if (!Array.isArray(items) || (!items.length && !scrolls.length && !input.actors?.length)) {
    throw new Error("'items', 'actors' oder 'scrolls' muss eine nichtleere Liste sein.");
  }
  input.items = items;
  if (input.items.length > 100) throw new Error("Maximal 100 Items pro Import.");
  const warnings = [];
  if (input.actors !== undefined) {
    if (!Array.isArray(input.actors) || input.actors.length > 50) throw new Error("'actors' muss eine Liste mit maximal 50 NPCs sein.");
    const refs = new Set(), names = new Set();
    for (const actor of input.actors) {
      if (!isObject(actor) || actor.type !== 'npc' || typeof actor.name !== 'string' || !actor.name.trim() || actor.name.length > 200) throw new Error('Actor: name and type npc required.');
      if (typeof actor.ref !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(actor.ref) || refs.has(actor.ref) || names.has(actor.name.trim())) throw new Error(`Actor: invalid or duplicate ref/name: ${actor.ref}`);
      refs.add(actor.ref); names.add(actor.name.trim());
      for (const key of ['system','flags','prototypeToken']) if (actor[key] !== undefined && !isObject(actor[key])) throw new Error(`${actor.name}: ${key} must be an object.`);
      for (const key of ['description','img']) if (actor[key] !== undefined && typeof actor[key] !== 'string') throw new Error(`${actor.name}: ${key} must be text.`);
      if (actor.ownership !== undefined || actor._id !== undefined) throw new Error(`${actor.name}: ownership and document IDs are managed in Foundry.`);
      if (actor.items !== undefined && (!Array.isArray(actor.items) || actor.items.length > 100)) throw new Error(`${actor.name}: invalid embedded items.`);
      if (actor.effects !== undefined && (!Array.isArray(actor.effects) || actor.effects.length > 30 || actor.effects.some(e=>!isObject(e)||!Array.isArray(e.changes)))) throw new Error(`${actor.name}: invalid effects.`);
      for (const effect of actor.effects??[]) validateAuraEffect(effect);
      if (actor.items?.length) {
        const embedded = parseImport(JSON.stringify({schemaVersion:1,items:actor.items}));
        if (embedded.items.some(i=>i.grantLinks!==undefined||i.compendiumGrants!==undefined||i.effectRefs!==undefined)) throw new Error(`${actor.name}: embedded Grant Links and compendium effect/grant imports are not supported yet.`);
        warnings.push(...embedded.warnings.map(w=>`${actor.name}: ${w}`));
      }
    }
  }
  const signatures = new Set();
  input.items.forEach((item, index) => {
    const p = `Item ${index + 1}`;
    if (!isObject(item)) throw new Error(`${p}: muss ein Objekt sein.`);
    if (typeof item.name !== "string" || !item.name.trim()) throw new Error(`${p}: 'name' fehlt.`);
    if (item.name.length > 200) throw new Error(`${p}: Name zu lang.`);
    const type = getItemType(item);
    if (!ALLOWED_TYPES.has(type)) throw new Error(`${p} (${item.name}): ungültiger type/kind '${String(item.type ?? item.kind)}'.`);
    if (item.description !== undefined && typeof item.description !== "string") {
      throw new Error(`${p} (${item.name}): 'description' muss Text sein.`);
    }
    if (item.img !== undefined && typeof item.img !== "string") throw new Error(`${p}: 'img' muss Text sein.`);
    if (item.system !== undefined && !isObject(item.system)) throw new Error(`${p}: 'system' muss ein Objekt sein.`);
    if (item.activities !== undefined && !Array.isArray(item.activities)) throw new Error(`${p}: 'activities' muss eine Liste sein.`);
    if (item.effects !== undefined && !Array.isArray(item.effects)) throw new Error(`${p}: 'effects' muss eine Liste sein.`);
    if (item.flags !== undefined && !isObject(item.flags)) throw new Error(`${p}: 'flags' muss ein Objekt sein.`);
    if ((item.activities?.length ?? 0) > 30) throw new Error(`${p}: maximal 30 Activities.`);
    if ((item.effects?.length ?? 0) > 30) throw new Error(`${p}: maximal 30 Effects.`);
    for (const [j, activity] of (item.activities ?? []).entries()) {
      if (!isObject(activity)) throw new Error(`${p}, Activity ${j + 1}: muss ein Objekt sein.`);
      if (typeof activity.type !== "string" || !activity.type) {
        throw new Error(`${p}, Activity ${j + 1}: 'type' fehlt (z. B. utility, attack, save).`);
      }
      if (activity.damageParts !== undefined && !Array.isArray(activity.damageParts)) {
        throw new Error(`${p}, Activity ${j + 1}: 'damageParts' muss eine Liste sein.`);
      }
    }
    for (const [j, effect] of (item.effects ?? []).entries()) {
      if (!isObject(effect) || !Array.isArray(effect.changes)) {
        throw new Error(`${p}, Effect ${j + 1}: Objekt mit 'changes'-Liste erwartet.`);
      }
      validateAuraEffect(effect);
    }
    if (item.system?.activities && item.activities?.length) {
      throw new Error(`${p}: Activities entweder in 'activities' ODER in 'system.activities' angeben, nicht beides.`);
    }
    if (item.advancedSummon !== undefined) {
      validateAdvancedSummon(item.advancedSummon, item.activities ?? Object.values(item.system?.activities ?? {}));
      warnings.push(`${item.name}: Advanced Summoning overrides native use dialog; requires unlinked NPCs, manual action economy and dismissal. Live-test permissions and scaling.`);
    }
    const sig = `${type}\u0000${item.name.trim().toLowerCase()}`;
    if (signatures.has(sig)) warnings.push(`${item.name}: mehrfach in derselben Importdatei vorhanden.`);
    signatures.add(sig);
    if (type === "feat" && String(item.kind ?? "").toLowerCase() === "maneuver") {
      warnings.push(`${item.name}: D&D5e kennt keinen eigenen Maneuver-Item-Typ. Wird als Feat angelegt.`);
    }
    if (item.automation === "partial" || item.automation === "manual") {
      warnings.push(`${item.name}: Automatisierung ist '${item.automation}' und benötigt möglicherweise manuelle Schritte.`);
    }
    if ((item.effects ?? []).length) {
      warnings.push(`${item.name}: Active Effects werden gespeichert, aber ihre tatsächliche Wirkung muss in Foundry geprüft werden.`);
    }
    if (type === "subclass" || type === "class") {
      warnings.push(`${item.name}: Klassen-/Subclass-Advancement wird noch nicht automatisch aufgebaut.`);
    }
  });
  return { schemaVersion: SCHEMA_VERSION, items: input.items, warnings, ...(input.scrolls !== undefined ? {scrolls} : {}), ...(input.actors !== undefined ? {actors:input.actors} : {}) };
}
/** Converts an approachable damage shorthand to the v5.2.5 DamageField structure. */
export function normalizeDamagePart(part) {
  if (!isObject(part)) throw new Error("Damage-Part muss ein Objekt sein.");
  if (!Object.hasOwn(part, "formula")) return clone(part);
  if (typeof part.formula !== "string" || !part.formula.trim()) throw new Error("Damage-Part: 'formula' fehlt.");
  const types = Array.isArray(part.types) ? part.types : [part.damageType ?? part.type ?? ""];
  if (types.some(x => typeof x !== "string")) throw new Error("Damage-Part: ungültige Schadensart.");
  return {
    number: 0, denomination: 0, bonus: "", types: types.filter(Boolean),
    custom: { enabled: true, formula: part.formula },
    scaling: { mode: "", number: null, formula: "" }
  };
}
export function normalizeActivity(activity, makeId) {
  const result = clone(activity);
  const id = result._id || makeId();
  delete result.damageParts;
  result._id = id;
  result.name = result.name ?? result.type;
  if (Array.isArray(activity.damageParts)) {
    if (result.damage === undefined) result.damage = {};
    result.damage.parts = activity.damageParts.map(normalizeDamagePart);
  } else if (Array.isArray(result.damage?.parts)) {
    result.damage.parts = result.damage.parts.map(normalizeDamagePart);
  }
  return result;
}
export function buildItemData(spec, makeId) {
  const id = makeId ?? (() => Math.random().toString(36).slice(2, 18).padEnd(16, "0"));
  const type = getItemType(spec);
  if (!ALLOWED_TYPES.has(type)) throw new Error(`Unbekannter Item-Typ: ${type}`);
  const system = clone(spec.system ?? {});
  if (spec.description !== undefined) {
    system.description ??= {};
    system.description.value = renderDescription(spec.description);
  }
  system.source ??= {};
  system.source.rules ??= "2024";
  if (Array.isArray(spec.activities)) {
    const activities = {};
    for (const a of spec.activities) {
      const normalized = normalizeActivity(a, id);
      if (activities[normalized._id]) throw new Error(`${spec.name}: doppelte Activity-ID ${normalized._id}`);
      activities[normalized._id] = normalized;
    }
    system.activities = activities;
  }
  const effects = (spec.effects ?? []).map(effect => ({
    ...compileAuraEffect(clone(effect)), _id: effect._id ?? id(),
    name: effect.name || `${spec.name} Effect`,
    disabled: effect.disabled ?? false,
    transfer: effect.transfer ?? false
  }));
  for (const effect of effects) {
    if (!effect.img && effect.icon) effect.img = effect.icon;
    delete effect.icon;
  }
  const flags = clone(spec.flags ?? {});
  flags["coast-forge-importer"] = {
    schemaVersion: SCHEMA_VERSION,
    ...(spec.ref ? {localRef: spec.ref} : {}),
    originalKind: String(spec.kind ?? type),
    automation: String(spec.automation ?? "unknown"),
    ...(spec.advancedSummon !== undefined ? {advancedSummon: clone(validateAdvancedSummon(spec.advancedSummon, Object.values(system.activities ?? {})))} : {})
  };
  return {
    name: spec.name.trim(), type,
    img: spec.img || DEFAULT_IMAGES[type] || "icons/svg/item-bag.svg",
    system, effects, flags
  };
}
