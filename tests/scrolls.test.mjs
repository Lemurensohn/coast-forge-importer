import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseImport,buildItemData} from '../scripts/schema.mjs';
import {generateScrolls as generateNativeScrolls,expandLevels,validateScrollRequests,scrollChallenge,scrollName} from '../scripts/scrolls.mjs';
// Retain the existing regression suite for the explicitly requested legacy copied-scroll path.
const generateScrolls=(requests,env)=>generateNativeScrolls(requests.map(r=>({...r,implementation:'copy'})),env);
const table={0:{dc:13,bonus:5},3:{dc:15,bonus:7},5:{dc:17,bonus:9},7:{dc:18,bonus:10},9:{dc:19,bonus:11}};
const copy=x=>structuredClone(x);
function spell(name,level,pack,activities={a:{_id:'attack0000000001',type:'attack',name:'Attack',attack:{bonus:'0'},consumption:{spellSlot:true,targets:[]},duration:{override:false},damage:{parts:[{number:2,denomination:8,scaling:{mode:'whole',number:2}}]}}}) {
  const raw={_id:'spell00000000001',name,type:'spell',system:{level,properties:['concentration'],duration:{units:'minute',value:'1'},description:{value:'<p>Full source rules.</p>'},activities},effects:[{_id:'effect0000000001',name:'Test',changes:[{key:'system.attributes.ac.bonus',value:'1'},{key:'macro.execute',value:'Timer'}],duration:{rounds:10},flags:{dae:{specialDuration:['turnEnd'],showIcon:true,macroRepeat:'startEveryTurn'}}}],flags:{'midi-qol':{onUseMacroName:'Timer'}}};
  return {name,type:'spell',system:{level},uuid:`Compendium.${pack}.Item.${name.replaceAll(' ','')}`,toObject:()=>copy(raw),raw};
}
function pack(id,docs){return {collection:id,documentName:'Item',getIndex:async()=>docs.map((d,i)=>({_id:String(i),name:d.name,type:d.type})),getDocument:async i=>docs[Number(i)]};}
function factory(calls){return async (source,options,config)=>{
  calls.push({source:copy(source),options,config:copy(config)});
  // Simulates the detached native API: level-specific template, copied effects and activities.
  const data={name:source.name,type:'consumable',img:'scroll.webp',system:{type:{value:'scroll'},rarity:config.level>=5?'rare':'uncommon',price:{value:100,denomination:'gp'},description:source.system.description,activities:source.system.activities,uses:{max:'1',spent:0}},effects:source.effects,flags:source.flags};
  return {toObject:()=>copy(data)};
};}
function env(docs=[spell('Cure Wounds',1,'a')]){const calls=[];const packs=new Map([['a',pack('a',docs)]]);return {calls,packs,selection:['a'],createScroll:factory(calls),challengeTable:table};}
test('scroll-only and mixed imports parse without changing schema version',()=>{assert.equal(parseImport('{"schemaVersion":1,"scrolls":[{"spell":"Fireball"}]}').items.length,0);assert.equal(parseImport('{"schemaVersion":1,"items":[{"name":"X","kind":"loot"}],"scrolls":[{"spell":"Fireball"}]}').scrolls.length,1);assert.throws(()=>parseImport('{"schemaVersion":1,"items":[],"scrolls":[]}'));});
test('levels default to base, all expands 1–9, cantrips stay at 0',()=>{assert.deepEqual(expandLevels({spell:'X'},3),[3]);assert.deepEqual(expandLevels({spell:'X',scrollLevels:'all'},1),[1,2,3,4,5,6,7,8,9]);assert.deepEqual(expandLevels({spell:'X',scrollLevels:'all'},0),[0]);});
test('reject invalid, duplicate, below-base and cantrip upcast levels',()=>{for(const levels of [[1,1],[10],['3'],[],null]) assert.throws(()=>validateScrollRequests([{spell:'X',scrollLevels:levels}]));assert.throws(()=>expandLevels({spell:'X',scrollLevels:[2]},3));assert.throws(()=>expandLevels({spell:'X',scrollLevels:[1]},0));});
test('fixed challenge table uses scroll level not original spell level',()=>{assert.deepEqual(Array.from({length:10},(_,i)=>scrollChallenge(i,table).dc),[13,13,13,15,15,17,17,18,18,19]);assert.deepEqual(scrollChallenge(9,table),{dc:19,bonus:11});});
test('generates nine independent native requests with fixed levels and no dialogs',async()=>{const e=env();const r=await generateScrolls([{spell:'Cure Wounds',scrollLevels:'all'}],e);assert.equal(r.items.length,9);assert.deepEqual(e.calls.map(x=>x.config.level),[1,2,3,4,5,6,7,8,9]);assert.ok(e.calls.every(x=>x.config.dialog===false));assert.equal(r.items[8].flags.dnd5e.scaling,8);assert.equal(r.items[8].system.activities.a.attack.bonus,'11');assert.equal(r.items[8].system.uses.autoDestroy,true);assert.equal(r.items[8].system.activities.a.damage.parts[0].scaling.number,2);assert.equal(buildItemData(r.items[8]).system.type.value,'scroll');});
test('copies source data without mutation, strips timers and macro hooks',async()=>{const s=spell('X',1,'a'), before=copy(s.raw);const r=await generateScrolls([{spell:'X'}],env([s]));assert.deepEqual(s.raw,before);const effect=r.items[0].effects[0];assert.equal(effect.duration,undefined);assert.equal(effect.flags.dae.specialDuration,undefined);assert.equal(effect.flags.dae.macroRepeat,undefined);assert.equal(effect.changes.length,1);assert.equal(r.items[0].flags['midi-qol'].onUseMacroName,undefined);assert.match(r.items[0].system.description.value,/1 minute/);assert.match(r.items[0].system.description.value,/@UUID\[/);});
test('fixed save DC, preserves effect links, substitutes item.level in formulas',async()=>{const s=spell('X',3,'a',{a:{type:'save',name:'Save',save:{ability:['wis'],dc:{calculation:'spellcasting'}},target:{template:{size:'20 + 5 * floor((@item.level - 3)/2)'}},effects:[{_id:'effect0000000001',onSave:false}],duration:{units:'minute',value:'1',concentration:true}}});const r=await generateScrolls([{spell:'X',scrollLevels:[7]}],env([s]));const a=r.items[0].system.activities.a;assert.equal(a.save.dc.formula,'18');assert.equal(a.save.dc.calculation,'');assert.equal(a.effects[0]._id,'effect0000000001');assert.match(a.target.template.size,/7 - 3/);assert.equal(a.duration.units,'spec');assert.equal(a.duration.concentration,true);assert.deepEqual(a.consumption.targets,[{type:'itemUses',target:'',value:'1'}]);});
test('multi-pack search and ambiguity handling use same resolver',async()=>{const a=spell('A',1,'a'),b=spell('B',2,'b');const e=env([a]);e.packs.set('b',pack('b',[b]));e.selection=['a','b'];const r=await generateScrolls([{spell:'A'},{spell:'B'}],e);assert.equal(r.items.length,2);e.packs.set('b',pack('b',[spell('A',1,'b')]));await assert.rejects(generateScrolls([{spell:'A'}],e),/ambiguous/);const x=await generateScrolls([{spell:'A',pack:'a'}],e);assert.equal(x.items.length,1);});
test('missing source and expansion limit stop before conversion',async()=>{const e=env();await assert.rejects(generateScrolls([{spell:'Cure Wounds'},{spell:'Missing'}],e),/not found/);assert.equal(e.calls.length,0);await assert.rejects(generateScrolls([{spell:'Cure Wounds',scrollLevels:'all'}],{...e,limit:2}),/Maximum/);assert.equal(e.calls.length,0);});
test('duplicate variant names stop before conversion',async()=>{const e=env();await assert.rejects(generateScrolls([{spell:'Cure Wounds'},{spell:'Cure Wounds',scrollLevels:[1]}],e),/duplicate/);assert.equal(e.calls.length,0);});
test('explicit followups have no item consumption; spent scroll retained',async()=>{const s=spell('X',3,'a',{a:{type:'utility',name:'Cast'},b:{type:'save',name:'Pulse'}});const r=await generateScrolls([{spell:'X',followUpActivities:['Pulse']}],env([s]));assert.equal(r.items[0].system.uses.autoDestroy,false);assert.equal(r.items[0].system.activities.a.consumption.targets.length,1);assert.equal(r.items[0].system.activities.b.consumption.targets.length,0);assert.match(r.warnings.join(' '),/Do not stack/);await assert.rejects(generateScrolls([{spell:'X',followUpActivities:['Missing']}],env([s])),/unknown follow-up/);});
test('price override and image are explicit; source prices otherwise retained',async()=>{const r=await generateScrolls([{spell:'Cure Wounds',scrollLevels:[1,2],img:'my.webp',priceByLevel:{2:300}}],env());assert.equal(r.items[0].system.price.value,100);assert.equal(r.items[1].system.price.value,300);assert.equal(r.items[1].img,'my.webp');});
test('invalid native output aborts rather than inventing a scroll',async()=>{await assert.rejects(generateScrolls([{spell:'Cure Wounds'}],{...env(),createScroll:async()=>null}),/no scroll/);});

test('all scroll levels lead with the correct English ordinal, including cantrip',()=>{assert.deepEqual(Array.from({length:10},(_,i)=>scrollName('Cure Wounds',i)),['Cantrip','1st','2nd','3rd','4th','5th','6th','7th','8th','9th'].map(x=>`${x} Spellscroll – Cure Wounds`));assert.throws(()=>scrollName('X',10));});
test('generated names and description headings use level-first naming',async()=>{const r=await generateScrolls([{spell:'Cure Wounds',scrollLevels:'all'}],env());assert.deepEqual(r.items.map(i=>i.name),Array.from({length:9},(_,i)=>scrollName('Cure Wounds',i+1)));for(const i of r.items){assert.equal(buildItemData(i).name,i.name);assert.ok(i.system.description.value.includes(i.name));}const c=await generateScrolls([{spell:'Ray of Frost'}],env([spell('Ray of Frost',0,'a')]));assert.equal(c.items[0].name,'Cantrip Spellscroll – Ray of Frost');});

test('default Cast scrolls link source UUID, use caster values and consume a single scroll, not a slot',async()=>{
  const s=spell('Cure Wounds',1,'a'),before=copy(s.raw),e=env([s]);
  const result=await generateNativeScrolls([{spell:s.name,scrollLevels:'all'}],e);
  assert.equal(result.items.length,9);assert.deepEqual(s.raw,before);
  for(const [i,raw] of result.items.entries()){
    const item=buildItemData(raw),acts=Object.values(item.system.activities),a=acts[0];
    assert.equal(acts.length,1);assert.equal(a.type,'cast');assert.equal(a._id.length,16);
    assert.equal(a.spell.uuid,s.uuid);assert.equal(a.spell.level,i+1);assert.equal(a.spell.ability,'');
    assert.equal(a.spell.challenge.override,false);assert.equal(a.spell.challenge.attack,undefined);assert.equal(a.spell.challenge.save,undefined);
    assert.equal(a.spell.spellbook,false);assert.deepEqual(a.spell.properties,['vocal','somatic','material']);
    assert.deepEqual(a.consumption,{spellSlot:false,targets:[{type:'itemUses',target:'',value:'1'}],scaling:{allowed:false,max:''}});
    assert.equal(item.system.quantity,1);assert.deepEqual(item.system.uses,{max:'1',spent:0,recovery:[],autoDestroy:true});
    assert.deepEqual(item.effects,[]);assert.equal(item.flags.dnd5e.spellLevel.value,i+1);assert.equal(item.flags.dnd5e.scaling,0);
    assert.equal(e.calls[i].config.level,i+1);assert.deepEqual(e.calls[i].source.system.activities,{});assert.deepEqual(e.calls[i].source.effects,[]);
    assert.match(item.system.description.value,/@UUID\[/);assert.match(item.system.description.value,/reader’s spellcasting values/);
  }
  assert.match(result.warnings.join(' '),/NOT sanitized/);
});
test('official Cast mode sets only fixed challenge values for actual scroll level',async()=>{
  const r=await generateNativeScrolls([{spell:'Cure Wounds',scrollLevels:[1,9]}],{...env(),scalingMode:'official'});
  assert.deepEqual(r.items.map(i=>Object.values(i.system.activities)[0].spell.challenge),[{override:true,attack:5,save:13},{override:true,attack:11,save:19}]);
  assert.ok(r.items.every(i=>i.system.uses.autoDestroy && Object.values(i.system.activities)[0].type==='cast'));
});
test('per-request mode overrides dialog default; bad modes rejected',async()=>{
  const r=await generateNativeScrolls([{spell:'Cure Wounds',scalingMode:'character'}],{...env(),scalingMode:'official'});
  assert.equal(Object.values(r.items[0].system.activities)[0].spell.challenge.override,false);
  assert.throws(()=>validateScrollRequests([{spell:'X',scalingMode:'wrong'}]));
  await assert.rejects(generateNativeScrolls([{spell:'Cure Wounds'}],{...env(),scalingMode:'wrong'}),/Invalid scroll scaling mode/);
});
test('Cast cantrip remains level zero; fixed name and level-specific price override retained',async()=>{
  const r=await generateNativeScrolls([{spell:'Ray of Frost',scrollLevels:'all',priceByLevel:{0:20},img:'custom.webp'}],env([spell('Ray of Frost',0,'a')]));
  assert.equal(r.items.length,1);assert.equal(r.items[0].name,'Cantrip Spellscroll – Ray of Frost');assert.equal(r.items[0].system.price.value,20);assert.equal(r.items[0].img,'custom.webp');assert.equal(Object.values(r.items[0].system.activities)[0].spell.level,0);
});
test('Cast source duration override is manual, concentration preserved; original source effects untouched',async()=>{
  const s=spell('X',1,'a'),before=copy(s.raw);
  const r=await generateNativeScrolls([{spell:'X'}],env([s]));const a=Object.values(r.items[0].system.activities)[0];
  assert.deepEqual(a.duration,{override:true,units:'spec',value:null,concentration:true});assert.deepEqual(s.raw,before);assert.equal(r.items[0].effects.length,0);assert.match(r.warnings.join(' '),/source timers\/macros/);
});
test('legacy follow-up requests explicitly retain old behavior; Cast cannot silently pretend to support followups',async()=>{
  const s=spell('X',3,'a',{a:{type:'utility',name:'Cast'},b:{type:'save',name:'Pulse'}});
  const r=await generateNativeScrolls([{spell:'X',followUpActivities:['Pulse']}],env([s]));assert.equal(r.items[0].system.uses.autoDestroy,false);assert.match(r.warnings.join(' '),/legacy copied/);
  assert.throws(()=>validateScrollRequests([{spell:'X',implementation:'cast',followUpActivities:['Pulse']}]));
});
test('source activities with disabled slot consumption are explicitly warned about',async()=>{
  const s=spell('X',1,'a',{a:{type:'utility',name:'Cast',consumption:{spellSlot:true,targets:[]}},b:{type:'utility',name:'Pulse',consumption:{spellSlot:false,targets:[]}}});
  const r=await generateNativeScrolls([{spell:'X'}],env([s]));assert.match(r.warnings.join(' '),/native linked consumption may be skipped/);
});

test('all source activities skipping linked consumption are blocked, not imported as free scrolls',async()=>{
 const s=spell('X',1,'a',{a:{type:'utility',name:'Cast',consumption:{spellSlot:false,targets:[]}}});const e=env([s]);
 await assert.rejects(generateNativeScrolls([{spell:'X'}],e),/Native Cast would skip scroll consumption/);assert.equal(e.calls.length,0);
});
