import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseImport,buildItemData,getItemType} from '../scripts/schema.mjs';
import {planGrants,linkGrants} from '../scripts/grants.mjs';
import {createExternalResolver} from '../scripts/references.mjs';
const file=()=>parseImport(readFileSync(new URL('../examples/65-veyraki-species.json',import.meta.url),'utf8'));
const id=(()=>{let n=0;return ()=>String(++n).padStart(16,'0')})();
test('native race and species alias accepted, other unknown types still rejected',()=>{
 for(const field of [{kind:'species'},{kind:'race'},{type:'race'},{type:'species'}]) {
  const item={name:'Test',...field};assert.equal(getItemType(item),'race');assert.equal(buildItemData(parseImport(JSON.stringify({schemaVersion:1,items:[item]})).items[0],id).type,'race');
 }
 assert.throws(()=>parseImport('{"schemaVersion":1,"items":[{"name":"X","kind":"actor"}]}'));
});
test('Veyraki fixture builds one species and six correctly classified feats',()=>{
 const {items}=file();const built=items.map(x=>buildItemData(x,id));assert.equal(built.length,7);assert.equal(built[0].type,'race');assert.equal(built[0].system.type.value,'humanoid');assert.equal(built[0].system.movement.walk,30);assert.ok(built.slice(1).every(i=>i.type==='feat'&&i.system.type.value==='race'&&i.system.requirements==='Veyraki'));
 assert.ok(built[0].system.description.value.includes('approximately 200 years'));
});
test('native level zero size and skill choice retained, no invented ability scores',()=>{
 const adv=buildItemData(file().items[0],id).system.advancement;assert.equal(adv.length,3);assert.ok(adv.every(a=>a.level===0&&/^[a-zA-Z0-9]{16}$/.test(a._id)));assert.deepEqual(adv.find(a=>a.type==='Size').configuration.sizes,['med']);assert.deepEqual(adv.find(a=>a.type==='Trait').configuration.choices,[{count:1,pool:['skills:ath','skills:acr']}]);assert.ok(!adv.some(a=>a.type==='AbilityScoreImprovement'));
});
for(const object of [false,true]) test(`six local Species grants linked with ${object?'object':'array'} advancement data`,async()=>{
 const {items}=file(), docs=new Map();
 for(const [index,spec] of items.entries()) {const data=buildItemData(spec,id);if(object&&data.system.advancement)data.system.advancement=Object.fromEntries(data.system.advancement.map(a=>[a._id,a]));docs.set(spec.ref,{uuid:`Item.${String(index).padStart(16,'0')}`,toObject:()=>structuredClone(data),async update(p){for(const [k,v] of Object.entries(p)){const path=k.split('.');let o=data;for(const part of path.slice(0,-1))o=o[part];o[path.at(-1)]=structuredClone(v);}}});}
 const plans=planGrants(items);assert.equal(plans.length,1);assert.equal(await linkGrants(plans,docs),6);const adv=Object.values(docs.get('veyraki').toObject().system.advancement);assert.deepEqual(adv.find(a=>a.type==='ItemGrant').configuration.items,items.slice(1).map(i=>({uuid:docs.get(i.ref).uuid,optional:false})));assert.equal(adv.find(a=>a.type==='Trait').configuration.choices[0].count,1);
});
test('two independent long rest resources; self temp HP and ten-minute utility',()=>{
 const items=file().items.map(i=>buildItemData(i,id)); const a=items.find(i=>i.name==='Unbroken Spirit'), b=items.find(i=>i.name==='Voracious Metabolism');
 for(const i of [a,b]){assert.equal(i.system.uses.max,'1');assert.deepEqual(i.system.uses.recovery,[{period:'lr',type:'recoverAll'}]);const act=Object.values(i.system.activities)[0];assert.deepEqual(act.consumption.targets,[{type:'itemUses',value:'1'}]);assert.equal(act.consumption.spellSlot,false);assert.equal(act.target.affects.type,'self');assert.ok(!act.duration);}
 assert.equal(Object.values(a.system.activities)[0].healing.custom.formula,'max(1, @details.level + @abilities.con.mod)');assert.deepEqual(Object.values(a.system.activities)[0].healing.types,['temphp']);assert.equal(Object.values(b.system.activities)[0].activation.value,10);assert.ok(items.every(i=>i.effects.length===0));
});
test('external native race lookup supported',async()=>{
 const doc={name:'Veyraki',type:'race',uuid:'Compendium.test.species.Item.1234567890123456'};const pack={documentName:'Item',collection:'test.species',async getIndex(){return [{name:doc.name,type:doc.type,_id:'1234567890123456'}]},async getDocument(){return doc}};
 const resolver=createExternalResolver(new Map([[pack.collection,pack]]),[pack.collection]);assert.equal(await resolver('Veyraki','race'),doc);
});
