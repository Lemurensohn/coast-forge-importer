import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveReferences,referenceSources,resolveJournal} from '../scripts/references.mjs';
import {parseImport,buildItemData} from '../scripts/schema.mjs';
const fixture=()=>parseImport(readFileSync(new URL('../examples/33-drenching-slam-compendium-TEST.json',import.meta.url),'utf8')).items;
const base={_id:'OldEffect0000001',name:'Drenched',img:'icons/svg/aura.svg',transfer:true,disabled:true,origin:'Item.old',duration:{rounds:2,startRound:5},changes:[{key:'system.attributes.ac.bonus',mode:2,value:'-2'},{key:'system.attributes.movement.bonus',mode:2,value:'-20'}],flags:{dae:{specialDuration:['turnStart'],macroRepeat:'startEveryTurn'},world:{test:true}},description:'<p>Drenched.</p>'};
const effect=()=>({name:base.name,toObject:()=>structuredClone(base)});
const item=(effects=[effect()])=>({name:'Drenched',uuid:'Compendium.world.effects.Item.a',img:'forge/drenched.webp',effects:{contents:effects}});
const journal={name:'Drenched',uuid:'Compendium.world.journals.JournalEntry.b'};
function pack(type,docs){return {documentName:type,async getIndex(){return {contents:docs.map((d,i)=>({_id:String(i),name:d.name}))}},async getDocument(id){return docs[Number(id)];}};}
const packs=(docs=[item()])=>new Map([['world.effects',pack('Item',docs)],['world.journals',pack('JournalEntry',[journal])],['world.other',pack('Item',[item(),item()])]]);
const settings={effectPack:'world.effects',journalPack:'world.journals',itemPack:'world.effects'};
const id=()=> 'NewEffect0000001';
test('copy compendium effect, preserve mechanics and flags, use feature image, link to activity and journal',async()=>{
 const original=fixture();const result=await resolveReferences(original,settings,packs(),id);const spec=result.items[0];const e=spec.effects[0];assert.equal(e.img,'forge/drenched.webp');assert.equal(e._id,id());assert.deepEqual(e.changes,base.changes);assert.deepEqual(e.flags.world,base.flags.world);assert.equal(e.flags.dae.showIcon,true);assert.equal(e.flags.dae.macroRepeat,base.flags.dae.macroRepeat);assert.deepEqual(e.duration,{rounds:2});assert.equal(e.origin,undefined);assert.equal(e.transfer,false);assert.equal(e.disabled,false);assert.deepEqual(spec.activities[0].effects,[{_id:id(),onSave:false}]);assert.match(spec.description,/@UUID\[Compendium.world.journals.JournalEntry.b\]\{Drenched\}/);assert.equal(original[0].effects,undefined);assert.equal(result.effects,1);assert.equal(result.journals,1);const built=buildItemData(spec,id);assert.equal(built.effects[0].img,'forge/drenched.webp');assert.match(built.system.description.value,/@UUID\[/);
});
test('custom effect artwork wins over feature image',async()=>{const d=item([{name:'Drenched',toObject:()=>({...base,img:'custom.webp'})}]);assert.equal((await resolveReferences(fixture(),settings,packs([d]),id)).items[0].effects[0].img,'custom.webp');});
test('explicit journal placeholder requires source; no plain text fallback',async()=>assert.rejects(resolveReferences(fixture(),{...settings,journalPack:''},packs(),id),/choose Condition Journals/));
for(const [name,ps,st] of [['missing',packs([]),settings],['ambiguous',packs([item(),item()]),settings],['unconfigured',packs(),{...settings,effectPack:''}],['wrong type',packs(),{...settings,effectPack:'world.journals'}],['no embedded effect',packs([item([])]),settings],['multiple embedded effects',packs([item([effect(),effect()])]),settings]]) test('reject '+name,async()=>assert.rejects(resolveReferences(fixture(),st,ps,id)));
test('explicit effect name and onSave flag',async()=>{const input=fixture();input[0].effectRefs[0].effectName='Drenched';input[0].effectRefs[0].onSave=true;const r=await resolveReferences(input,settings,packs([item([effect(),{name:'other'}])]),id);assert.equal(r.items[0].activities[0].effects[0].onSave,true);});
test('missing activity fails',async()=>{const i=fixture();i[0].effectRefs[0].activityId='NotFound00000001';await assert.rejects(resolveReferences(i,settings,packs(),id));});
test('external item grant resolves actual compendium UUID',async()=>{const i=[{name:'Parent',kind:'feat',system:{advancement:[{_id:'Grant00000000001',type:'ItemGrant',configuration:{items:[]}}]},compendiumGrants:[{advancementId:'Grant00000000001',items:[{name:'Drenched'}]}]}];const r=await resolveReferences(i,settings,packs(),id);assert.deepEqual(r.items[0].system.advancement[0].configuration.items,[{uuid:item().uuid,optional:false}]);assert.equal(r.grants,1);});
test('legacy items untouched',async()=>{const i=[{name:'Old',description:'&Reference[blinded]',kind:'feat'}];assert.deepEqual((await resolveReferences(i,{},packs(),id)).items,i);});

const page={name:'Drenched',uuid:'JournalEntry.conditions.JournalEntryPage.drenched'};
const worldBook={id:'conditions',name:'Conditions',uuid:'JournalEntry.conditions',pages:{contents:[page]}};
test('dropdown offers journal packs and individual world journal entries, not items',()=>{
 const ps={contents:[{collection:'world.journals',title:'Conditions',documentName:'JournalEntry'},{collection:'world.metadata',metadata:{type:'JournalEntry',label:'More Conditions'}},{collection:'world.effects',documentName:'Item'}]};
 assert.deepEqual(referenceSources(ps,{contents:[worldBook]},'JournalEntry').map(s=>s.value).sort(),['journal:conditions','world.journals','world.metadata']);
});
test('world journal page resolves to its UUID',async()=>{
 const r=await resolveReferences(fixture(),{...settings,journalPack:'journal:conditions'},packs(),id,{contents:[worldBook]});
 assert.ok(r.items[0].description.includes(`@UUID[${page.uuid}]{Drenched}`));assert.equal(r.effects,1);
});
test('world journal entry resolves to its UUID',async()=>{
 const doc={...journal,id:'drenched',uuid:'JournalEntry.drenched'};
 assert.equal(await resolveJournal('journal:drenched','Drenched',packs(),[doc]),doc);
});
test('journal compendium page is resolvable',async()=>{
 const p={...page,uuid:'Compendium.world.journals.JournalEntry.conditions.JournalEntryPage.drenched'};
 const ps=packs();ps.set('world.journals',pack('JournalEntry',[{...worldBook,pages:[p]}]));
 assert.equal(await resolveJournal('world.journals','Drenched',ps),p);
});
test('duplicate matching journal names rejected, including pages',async()=>{
 const ps=packs();ps.set('world.journals',pack('JournalEntry',[journal,{...worldBook,pages:[page]}]));
 await assert.rejects(resolveJournal('world.journals','Drenched',ps),/ambiguous/);
});
test('description only journal link does not copy active effect',async()=>{
 const r=await resolveReferences([{name:'Rules',kind:'feat',description:'[[condition:Drenched]]'}],settings,packs(),id);
 assert.equal(r.effects,0);assert.equal(r.journals,1);assert.equal(r.items[0].effects,undefined);
});
test('effect only still works without journal selection',async()=>{
 const i=fixture();i[0].description='Drenched';const r=await resolveReferences(i,{...settings,journalPack:''},packs(),id);assert.equal(r.effects,1);assert.equal(r.journals,0);
});
test('missing selected world journal rejected',async()=>await assert.rejects(resolveJournal('journal:missing','Drenched',packs(),[]),/no longer exists/));

test('exact entry takes precedence over its own identically named page',async()=>{const doc={...worldBook,name:'Drenched'};assert.equal(await resolveJournal('journal:conditions','Drenched',packs(),[doc]),doc);});
test('journal pack read once for repeated condition links in one import',async()=>{const ps=packs();const p=ps.get('world.journals');let calls=0;const read=p.getIndex;p.getIndex=async()=>{calls++;return read();};const r=await resolveReferences([{name:'Rules',description:'[[condition:Drenched]] and [[condition:Drenched]]'},{name:'Rules 2',description:'[[condition:Drenched]]'}],settings,ps,id);assert.equal(calls,1);assert.equal(r.journals,3);assert.equal((r.items[0].description.match(/@UUID/g)||[]).length,2);});
