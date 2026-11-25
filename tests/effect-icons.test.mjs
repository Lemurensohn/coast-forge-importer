import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createIconChoices} from '../scripts/icons.mjs';
import {createEffectIconChoices,defaultEffectIcon} from '../scripts/effect-icons.mjs';
import {buildItemData,parseImport} from '../scripts/schema.mjs';
import {updateExisting} from '../scripts/updates.mjs';
import {readFileSync} from 'node:fs';
const scope='coast-forge-importer', key=`flags.${scope}.effectIcon`;
const fx=(name,img,more={})=>({_id:name.padEnd(16,'0'),name,...(img?{img}:{}),changes:[{key:'system.attributes.ac.bonus',mode:2,value:'1'}],flags:{dae:{showIcon:true}},...more});
const inherited=(name,path,original='icons/svg/aura.svg')=>fx(name,path,{flags:{dae:{showIcon:true},[scope]:{effectIcon:{mode:'inherit',original,applied:path}}}});
const fixture=(effects,existing,mode='skip')=>{
 const row={data:{name:'Ring',type:'equipment',img:existing?.img??'ring.webp',effects:structuredClone(effects),system:{activities:{a:{}}}},existing};
 const icons=createIconChoices([row]), choices=createEffectIconChoices([row],icons,mode);
 return {row,icons,choices,commit(){icons.commit();choices.commit();}};
};
const existing=(effects,img='old.webp')=>({img,toObject:()=>({img,effects:structuredClone(effects)})});
test('missing and generic icons inherit item image, with mechanics intact',()=>{
 const f=fixture([fx('A'),fx('B','icons/svg/aura.svg')]);
 const before=structuredClone(f.row.data.effects);f.icons.select(0,'forge/new.webp');f.commit();
 for(let i=0;i<2;i++){const e=f.row.data.effects[i];assert.equal(e.img,'forge/new.webp');assert.equal(e.flags[scope].effectIcon.mode,'inherit');assert.deepEqual(e.changes,before[i].changes);assert.deepEqual(e.flags.dae,before[i].flags.dae);}
});
test('native status and explicit non-generic artwork retain original',()=>{
 const f=fixture([fx('Prone','icons/svg/falling.svg',{statuses:['prone']}),fx('Custom','special.webp'),fx('Other','icons/svg/aura.svg',{statuses:['frightened']})]);
 f.icons.select(0,'new.webp');f.commit();assert.deepEqual(f.row.data.effects.map(e=>e.img),['icons/svg/falling.svg','special.webp','icons/svg/aura.svg']);
});
test('compendium original flag protects even generic SVG',()=>{
 const e=fx('Drenched','icons/svg/aura.svg',{flags:{[scope]:{effectIcon:{mode:'original',original:'icons/svg/aura.svg',applied:'icons/svg/aura.svg'}}}});
 const f=fixture([e]);f.icons.select(0,'item.webp');f.commit();assert.equal(f.row.data.effects[0].img,e.img);
});
test('custom and original override inheritance, reset restores per-effect default',()=>{
 const f=fixture([fx('A','icons/svg/aura.svg'),fx('B','icons/svg/book.svg'),fx('C')]);
 f.choices.select(0,0,'https://forge.example/a%20b.webp');f.choices.setMode(0,1,'original');f.choices.select(0,2,'temp.webp');f.choices.reset(0,2);f.icons.select(0,'new.webp');
 assert.equal(f.choices.get(0,0).path,'https://forge.example/a%20b.webp');f.commit();assert.deepEqual(f.row.data.effects.map(e=>e.img),['https://forge.example/a%20b.webp','icons/svg/book.svg','new.webp']);
});
test('cancel leaves item data unchanged, invalid paths and rows rejected',()=>{
 const f=fixture([fx('A')]),before=structuredClone(f.row.data);assert.equal(f.choices.select(0,0,''),false);assert.equal(f.choices.select(1,0,'x'),false);assert.equal(f.choices.setMode(0,0,'bad'),false);f.choices.select(0,0,'custom.webp');f.icons.select(0,'new.webp');assert.deepEqual(f.row.data,before);
});
test('icon-only uses actual existing effects, repairs legacy and propagates inherited',()=>{
 const old=[inherited('A','old.webp'),fx('B','icons/svg/aura.svg'),fx('C','manual.webp')];const f=fixture([fx('Different')],existing(old),'icons');
 assert.deepEqual(f.choices.list(0).map(x=>x.name),['A','B','C']);f.icons.select(0,'new.webp');f.commit();assert.deepEqual(f.row.effectIconPatches.map(p=>[p._id,p.img]),[[old[0]._id,'new.webp'],[old[1]._id,'new.webp']]);assert.deepEqual(Object.keys(f.row.effectIconPatches[0]),['_id','img',key]);
});
test('icon-only can change a single effect with no parent selection',()=>{
 const old=[fx('A','old.webp'),fx('B','custom.webp')];const f=fixture([],existing(old),'icons');f.choices.select(0,1,'other.webp');f.commit();assert.equal(f.row.effectIconPatches.length,1);assert.equal(f.row.effectIconPatches[0].img,'other.webp');assert.equal(f.icons.changed(0),false);
});
test('icon-only repairs old generic icons even without a new parent image',()=>{
 const f=fixture([],existing([fx('A','icons/svg/aura.svg')]),'icons');f.commit();assert.equal(f.row.effectIconPatches[0].img,'old.webp');
});
test('existing manual edit supersedes inherited marker and remains unchanged',()=>{
 const old=inherited('A','old.webp');old.img='manually-edited.webp';const f=fixture([],existing([old]),'icons');f.icons.select(0,'new.webp');f.commit();assert.equal(f.row.effectIconPatches,undefined);
});
test('full update preserves old custom art by exact ID or unique name',()=>{
 const old=[fx('A','manual.webp'),fx('B','bespoke.webp'),inherited('C','old.webp')];const f=fixture([fx('Renamed',null,{_id:old[0]._id}),fx('B','icons/svg/aura.svg',{_id:'NewId00000000001'}),fx('C')],existing(old),'update');f.icons.select(0,'new.webp');f.commit();assert.deepEqual(f.row.data.effects.map(e=>e.img),['manual.webp','bespoke.webp','new.webp']);
});
test('full update explicit override can replace an old custom image',()=>{
 const f=fixture([fx('A')],existing([fx('A','manual.webp')]),'update');f.choices.setMode(0,0,'inherit');f.commit();assert.equal(f.row.data.effects[0].img,'old.webp');
});
test('full update does not reuse a prior icon for a second effect when ID already matched',()=>{
 const old=fx('A','manual.webp');const f=fixture([fx('Renamed',null,{_id:old._id}),fx('A',null,{_id:'NewId00000000001'})],existing([old]),'update');f.commit();assert.deepEqual(f.row.data.effects.map(e=>e.img),['manual.webp','old.webp']);
});
test('skipped existing items get no effect changes',()=>{
 const f=fixture([fx('A')],existing([fx('A','manual.webp')]),'skip');assert.equal(f.choices.list(0).length,0);f.commit();assert.equal(f.row.effectIconPatches,undefined);
});
test('legacy icon normalized to native img without touching mechanics',()=>{
 const spec={name:'Feat',kind:'feat',effects:[{name:'A',icon:'old.webp',changes:[]}]};const result=buildItemData(spec);assert.equal(result.effects[0].img,'old.webp');assert.equal(result.effects[0].icon,undefined);assert.equal(spec.effects[0].icon,'old.webp');
});
test('declared original policy can retain intentional generic artwork',()=>{
 const e=fx('A','icons/svg/aura.svg',{flags:{[scope]:{effectIcon:{mode:'original'}}}});assert.equal(defaultEffectIcon(e,'ring.webp').mode,'original');
});
test('ring fixture retains timer-free mechanics and inherits two icons',()=>{
 const spec=parseImport(readFileSync(new URL('../examples/36-ring-of-sun-v2.json',import.meta.url),'utf8')).items[0];const data=buildItemData(spec);const f=fixture(data.effects);const before=structuredClone(data.effects);f.icons.select(0,'ring-art.webp');f.commit();assert.equal(f.row.data.effects.length,2);for(let i=0;i<2;i++){const e=f.row.data.effects[i];assert.equal(e.img,'ring-art.webp');assert.deepEqual(e.changes,before[i].changes);assert.equal(e.duration,undefined);assert.ok(!e.flags.dae.specialDuration);assert.ok(!e.changes.some(c=>c.key==='macro.execute'));}
});
test('updateExisting icon-only writes embedded icon patch, not system or full effect',async()=>{
 const old=fx('A','old.webp');const f=fixture([],existing([old]),'icons');f.choices.select(0,0,'custom.webp');f.commit();let call;
 const d={img:'old.webp',toObject:()=>({effects:[old]}),async updateEmbeddedDocuments(t,p){call=[t,p];},async update(){throw Error('must not update parent');}};
 assert.equal(await updateExisting(d,f.row.data,'icons',false,x=>x,f.row.effectIconPatches),true);assert.equal(call[0],'ActiveEffect');assert.deepEqual(Object.keys(call[1][0]),['_id','img',key]);
});
test('updateExisting rejects stale effect ID before any writes',async()=>{
 const d={img:'old.webp',toObject:()=>({effects:[]}),async update(){throw Error('unexpected write');}};await assert.rejects(updateExisting(d,{img:'new.webp'},'icons',true,x=>x,[{_id:'missing',img:'x'}]),/Effect changed/);
});
