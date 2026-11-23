import test from "node:test";
import assert from "node:assert/strict";
import { parseImport, buildItemData, normalizeDamagePart, normalizeActivity } from "../scripts/schema.mjs";

const ids = (() => { let i = 0; return () => `testid${String(++i).padStart(10,"0")}`; })();

test("JSON batch imports and maneuvers map to feat", () => {
  const parsed = parseImport(JSON.stringify({ schemaVersion: 1, items: [
    { name: "Test Maneuver", kind: "maneuver", description: "A **test**." },
    { name: "Test Spell", kind: "spell", system: { level: 1 } }
  ] }));
  assert.equal(parsed.items.length, 2);
  const built = buildItemData(parsed.items[0], ids);
  assert.equal(built.type, "feat");
  assert.match(built.system.description.value, /A \*\*test\*\*\./);
  assert.equal(built.flags["coast-forge-importer"].originalKind, "maneuver");
});

test("HTML is escaped and newlines preserved", () => {
  const result = buildItemData({ name: "X", kind: "feat", description: "<script>alert(1)</script>\n\nNext" }, ids);
  assert.match(result.system.description.value, /&lt;script&gt;/);
  assert.match(result.system.description.value, /<p>Next<\/p>/);
  assert.doesNotMatch(result.system.description.value, /<script>/);
});

test("Native attack activity and convenient damage parts", () => {
  const built = buildItemData({ name: "Blade", kind: "weapon", activities: [
    { type: "attack", name: "Hit", damage: { includeBase: false }, damageParts: [{ formula: "1d8 + @mod", type: "slashing" }] }
  ] }, ids);
  const activity = Object.values(built.system.activities)[0];
  assert.equal(activity.damage.parts[0].custom.enabled, true);
  assert.equal(activity.damage.parts[0].custom.formula, "1d8 + @mod");
  assert.deepEqual(activity.damage.parts[0].types, ["slashing"]);
  assert.equal("damageParts" in activity, false);
});

test("Effects get IDs, preserve changes, transfer", () => {
  const built = buildItemData({ name: "Effect", kind: "feature", effects: [
    { name: "Bonus", transfer: true, changes: [{ key: "system.attributes.init.bonus", mode: 2, value: "1d4", priority: 20 }] }
  ] }, ids);
  assert.equal(built.effects[0].transfer, true);
  assert.equal(built.effects[0].changes[0].value, "1d4");
});

test("Parser rejects invalid type, mixed raw activities, and unstructured input", () => {
  assert.throws(() => parseImport("Not JSON"), /Ungültiges JSON/);
  assert.throws(() => parseImport(JSON.stringify({schemaVersion:3,items:[]})), /schemaVersion/);
  assert.throws(() => parseImport(JSON.stringify({schemaVersion:1,items:[{name:"X",kind:"monster"}]})), /ungültiger type/);
  assert.throws(() => parseImport(JSON.stringify({schemaVersion:1,items:[{name:"X",kind:"feat",system:{activities:{}}, activities:[{type:"utility"}]}]})), /entweder/);
});

test("Native DamageField passthrough", () => {
  const native = { number: 1, denomination: 6, bonus: "", types: ["cold"] };
  assert.deepEqual(normalizeDamagePart(native), native);
  assert.equal(normalizeActivity({ type: "utility" }, ids).type, "utility");
});

import { readFileSync } from "node:fs";
for (const file of ["01-erster-import.json", "02-advanced-raw-effect.json", "03-textdatei.txt"]) {
  test(`Fixture ${file} parses and builds`, () => {
    const source = readFileSync(new URL(`../examples/${file}`, import.meta.url), "utf8");
    const parsed = parseImport(source);
    const built = parsed.items.map(item => buildItemData(item, ids));
    assert.equal(built.length, parsed.items.length);
    assert.ok(built.every(item => item.name && item.type));
  });
}
