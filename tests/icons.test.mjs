import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createIconChoices } from '../scripts/icons.mjs';
import { parseImport, buildItemData } from '../scripts/schema.mjs';
const fixture = readFileSync(new URL('../examples/29-legendary-cantrips-TEST.json', import.meta.url), 'utf8');
const items = parseImport(fixture).items;
const makePreview = () => items.map(item => ({item, data: buildItemData(item), error: null}));
test('four independent rows retain distinct image paths, including Forge URLs', () => {
  const preview = makePreview();
  const icons = createIconChoices(preview);
  const paths = ['worlds/coast/cinder.png','https://assets.example.invalid/grave.webp','icons/svg/lightning.svg','assets/frost%20hook.jpg'];
  paths.forEach((p,i) => assert.equal(icons.select(i,p),true));
  icons.commit();
  assert.deepEqual(preview.map(x=>x.data.img),paths);
});
test('unchanged icons and original JSON image are preserved', () => {
  const preview = makePreview();
  preview[0].data.img = 'assets/original.webp';
  const before = structuredClone(preview);
  createIconChoices(preview).commit();
  assert.deepEqual(preview,before);
});
test('reset restores original icon, not another item icon', () => {
  const preview = makePreview();
  preview[1].data.img = 'assets/custom.webp';
  const icons = createIconChoices(preview);
  icons.select(0,'a.png'); icons.select(1,'b.png'); icons.reset(1); icons.commit();
  assert.equal(preview[0].data.img,'a.png');
  assert.equal(preview[1].data.img,'assets/custom.webp');
});
test('cancellation leaves parsed item data untouched', () => {
  const preview = makePreview(); const before = structuredClone(preview);
  const icons = createIconChoices(preview);
  icons.select(1,'new.png');
  assert.deepEqual(preview,before);
});
test('invalid rows and empty or nonstring paths cannot be selected', () => {
  const preview = makePreview(); preview[1] = {item: items[1],data:null,error:'Invalid'};
  const icons = createIconChoices(preview);
  for (const i of [-1,1,99,0.5]) assert.equal(icons.select(i,'x.png'),false);
  for (const path of [null,'','  ',123]) assert.equal(icons.select(0,path),false);
  assert.equal(icons.reset(1),false); icons.commit();
  assert.equal(preview[1].data,null);
});
test('commit modifies only img and retains all activities, effects and flags', () => {
  const preview = makePreview(); const before = structuredClone(preview);
  const icons = createIconChoices(preview);
  icons.select(2,'new.png'); icons.commit(); before[2].data.img = 'new.png';
  assert.deepEqual(preview,before);
});
test('all 100 supported import rows can select independent icons', () => {
  const preview = Array.from({length:100},(_,i)=>({data:{img:'original.svg'},item:{name:`Item ${i}`},error:null}));
  const icons = createIconChoices(preview);
  preview.forEach((_,i)=>icons.select(i,`assets/${i}.png`));
  icons.commit();
  assert.ok(preview.every((row,i)=>row.data.img===`assets/${i}.png`));
});
