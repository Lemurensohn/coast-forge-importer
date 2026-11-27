import {test} from 'node:test';
import assert from 'node:assert/strict';
let state;
const spell={name:'Fireball',type:'spell',uuid:'Compendium.spells.Item.Fireball',system:{level:3},toObject:()=>({name:'Fireball',type:'spell',system:{level:3,properties:[],duration:{units:'inst'},description:{value:'<p>Spell rules</p>'},activities:{a:{_id:'attack0000000001',name:'Save',type:'save',save:{dc:{calculation:'spellcasting'}},consumption:{targets:[]},damage:{parts:[]}}}},effects:[]})};
const pack={collection:'spells',documentName:'Item',getIndex:async()=>[{_id:'fireball',name:'Fireball',type:'spell'}],getDocument:async()=>spell};
class ItemMock {
 constructor(data){this.data=structuredClone(data);}
 toObject(){return structuredClone(this.data);}
 static async createScrollFromSpell(source,opts,config){state.converted.push(config.level);return new this({type:'consumable',name:'Native',img:'scroll.webp',system:{type:{value:'scroll'},description:source.system.description,activities:source.system.activities,uses:{max:'1'},price:{value:1,denomination:'gp'}},effects:source.effects});}
}
globalThis.CONFIG={Item:{documentClass:ItemMock},DND5E:{spellScrollValues:{0:{dc:13,bonus:5},3:{dc:15,bonus:7},5:{dc:17,bonus:9}}}};
globalThis.foundry={applications:{api:{DialogV2:{async prompt(opts){return opts.ok.label==='Vorschau prüfen'?{text:state.text,destination:'world',mode:'skip',scrollScaling:state.scrollScaling,packSelections:{itemPack:'["spells"]'}}:true;},async confirm(opts){state.preview=opts.content;return state.approved;}}}},utils:{randomID:()=> '1234567890123456'}};
globalThis.Hooks={once(){},on(){}};
globalThis.ui={notifications:{error(message){state.errors.push(message);},warn(){},info(){}}};
globalThis.game={user:{isGM:true},system:{id:'dnd5e',version:'5.2.5'},packs:new Map([['spells',pack]]),actors:{contents:[]},folders:[{id:'folder1',type:'Item',name:'Coast Forge Imports',folder:null}],items:{contents:[]},settings:{get:()=>'',set:async()=>{}}};
globalThis.Item={implementation:{async createDocuments(docs){state.created.push(...structuredClone(docs));}}};
const {openImporter}=await import('../scripts/main.mjs');
const start=(approved=true,scrolls=[{spell:'Fireball',scrollLevels:[3,5]}])=>{state={approved,converted:[],created:[],errors:[],text:JSON.stringify({schemaVersion:1,scrolls})};};
test('scroll-only JSON flows through actual importer preview and creation',async()=>{start();const result=await openImporter();assert.equal(result.successes.length,2);assert.deepEqual(state.converted,[3,5]);assert.deepEqual(state.created.map(x=>x.name),['3rd Spellscroll – Fireball','5th Spellscroll – Fireball']);const a=Object.values(state.created[1].system.activities)[0];assert.equal(a.type,'cast');assert.equal(a.spell.challenge.override,false);assert.equal(a.spell.level,5);assert.equal(a.spell.uuid,spell.uuid);assert.equal(a.consumption.targets[0].value,'1');assert.equal(a.consumption.spellSlot,false);assert.equal(state.created[1].system.uses.autoDestroy,true);assert.ok(state.created.every(x=>x.folder==='folder1'));assert.match(state.preview,/5th Spellscroll – Fireball/);});
test('cancelled scroll preview never creates items',async()=>{start(false);await openImporter();assert.equal(state.created.length,0);assert.equal(state.converted.length,2);});
test('missing spell never creates items or invokes native converter',async()=>{start(true,[{spell:'Missing'}]);await openImporter();assert.equal(state.created.length,0);assert.equal(state.converted.length,0);assert.match(state.errors[0],/not found/);});

test('official scaling selected in dialog reaches linked activity',async()=>{start();state.scrollScaling='official';await openImporter();const a=Object.values(state.created[1].system.activities)[0];assert.deepEqual(a.spell.challenge,{override:true,attack:9,save:17});});
