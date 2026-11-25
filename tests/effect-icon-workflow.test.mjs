import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fixture=readFileSync(new URL('../examples/36-ring-of-sun-v2.json',import.meta.url),'utf8');
const event={preventDefault(){},stopPropagation(){}};
let state;
const scope='coast-forge-importer';
class Picker {
 constructor(options){this.options=options;this.rendered=false;state.pickers.push(this);}
 async browse(){this.rendered=true;}
 async close(){this.rendered=false;}
}
function fakeRow(){
 const fields={'.coast-forge-item-icon':{},'.coast-forge-pick-icon':{},'.coast-forge-reset-icon':{}};
 const effects=Array.from({length:2},(_,i)=>{
  const elements={'.coast-forge-effect-image':{},'.coast-forge-effect-mode':{},'.coast-forge-effect-choose':{},'.coast-forge-effect-reset':{}};
  return {dataset:{coastForgeEffect:String(i)},querySelector:s=>elements[s],elements};
 });
 return {dataset:{coastForgeRow:'0'},querySelector:s=>fields[s],querySelectorAll:()=>effects,fields,effects};
}
globalThis.foundry={applications:{api:{DialogV2:{async prompt(o){if(o.ok.label==='Vorschau prüfen')return {text:fixture,destination:'world',mode:state.mode};return true;},async confirm(o){assert.match(o.content,/<details class="coast-forge-effect-picker">/);assert.match(o.content,/Sunlit Resolve/);assert.match(o.content,/Zenith/);const row=fakeRow();o.render({}, {element:{querySelectorAll:()=>[row]}});await state.interact(row);return state.approved;}}},apps:{FilePicker:{implementation:Picker}}},utils:{randomID:(()=>{let i=0;return ()=>String(++i).padStart(16,'0')})()}};
globalThis.Hooks={on(){},once(){}};
globalThis.CONFIG={Item:{documentClass:class{constructor(data){this.data=data;}toObject(){return structuredClone(this.data);}}}};
globalThis.ui={notifications:{error(x){throw Error(x);},warn(){},info(){}}};
globalThis.game={user:{isGM:true},system:{id:'dnd5e',version:'5.2.5'},settings:{get:()=>''},packs:{contents:[]},actors:{contents:[]},items:{contents:[]},folders:[{id:'folder1',name:'Coast Forge Imports',type:'Item'}]};
globalThis.Item={implementation:{async createDocuments(docs){state.created.push(...structuredClone(docs));return docs;}}};
const {openImporter}=await import('../scripts/main.mjs');
function setup(interact,approved=true,mode='skip'){state={interact,approved,mode,pickers:[],created:[]};game.items.contents=[];}
const pick=async(button,path)=>{await button.onclick(event);state.pickers.at(-1).options.callback(path);};
test('preview item picker propagates inherited art, effect picker sets independent custom image',async()=>{
 setup(async row=>{
  const [a,b]=row.effects.map(e=>e.elements);
  assert.equal(a['.coast-forge-effect-mode'].value,'inherit');assert.equal(b['.coast-forge-effect-choose'].hidden,true);
  await pick(row.fields['.coast-forge-pick-icon'],'ring.webp');assert.equal(a['.coast-forge-effect-image'].src,'ring.webp');
  b['.coast-forge-effect-mode'].value='custom';b['.coast-forge-effect-mode'].onchange();assert.equal(b['.coast-forge-effect-choose'].hidden,false);
  await pick(b['.coast-forge-effect-choose'],'zenith.webp');
  await pick(row.fields['.coast-forge-pick-icon'],'ring2.webp');assert.equal(b['.coast-forge-effect-image'].src,'zenith.webp');assert.equal(a['.coast-forge-effect-image'].src,'ring2.webp');
 });const result=await openImporter();assert.equal(result.successes.length,1);assert.deepEqual(state.created[0].effects.map(e=>e.img),['ring2.webp','zenith.webp']);assert.ok(state.pickers.every(p=>!p.rendered));
});
test('preview cancel and stale picker callbacks cause no document writes',async()=>{
 setup(async row=>{const b=row.effects[1].elements;b['.coast-forge-effect-mode'].value='custom';b['.coast-forge-effect-mode'].onchange();await b['.coast-forge-effect-choose'].onclick(event);const old=state.pickers.at(-1);b['.coast-forge-effect-reset'].onclick(event);old.options.callback('late.webp');assert.equal(b['.coast-forge-effect-mode'].value,'inherit');},false);assert.equal(await openImporter(),undefined);assert.deepEqual(state.created,[]);
});
test('icon-only repairs existing legacy effects and changes individual effect without replacing rules',async()=>{
 setup(async row=>{const b=row.effects[1].elements;b['.coast-forge-effect-mode'].value='custom';b['.coast-forge-effect-mode'].onchange();await pick(b['.coast-forge-effect-choose'],'new-zenith.webp');},true,'icons');
 const original=JSON.parse(fixture).items[0];const effects=original.effects.map((e,i)=>({...e,_id:String(i+1).padStart(16,'0'),img:'icons/svg/aura.svg'}));let calls=[];
 const doc={id:'existing1',name:'Ring of Sun',type:'equipment',img:'existing-ring.webp',folder:{id:'folder1'},toObject:()=>({effects:structuredClone(effects)}),async updateEmbeddedDocuments(t,patches){calls.push([t,patches]);},async update(){throw Error('parent must not change');}};game.items.contents=[doc];
 const result=await openImporter();assert.deepEqual(result.updated,['Ring of Sun']);assert.equal(calls.length,1);assert.equal(calls[0][0],'ActiveEffect');assert.deepEqual(calls[0][1].map(p=>p.img),['existing-ring.webp','new-zenith.webp']);assert.ok(calls[0][1].every(p=>Object.keys(p).length===3 && p[`flags.${scope}.effectIcon`]));assert.equal(state.created.length,0);
});
