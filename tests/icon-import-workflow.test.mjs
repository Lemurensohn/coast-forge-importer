import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const fixture = readFileSync(new URL('../examples/29-legendary-cantrips-TEST.json', import.meta.url), 'utf8');
let state;
const event = {preventDefault(){},stopPropagation(){}};
class Picker {
  constructor(options){ this.options=options;this.rendered=false;state.pickers.push(this); }
  async browse(){ this.rendered=true; return this; }
  async render(){this.rendered=true;return this;}
  async close(){this.rendered=false;}
}
const makeRows=()=>Array.from({length:4},(_,index)=>{
  const elements={'.coast-forge-pick-icon':{},'.coast-forge-reset-icon':{},'.coast-forge-item-icon':{}};
  return {dataset:{coastForgeRow:String(index)},querySelector:s=>elements[s],elements};
});
globalThis.foundry={applications:{api:{DialogV2:{
  async prompt(opts){ if(opts.ok.label!=='Vorschau prüfen') return true; if(state.form) return state.form(opts); return {text:fixture,destination:state.destination,mode:state.mode}; },
  async confirm(opts){
    assert.match(opts.content,/Cinder Snap/);
    assert.match(opts.content,/Grave Pinch/);
    assert.equal((opts.content.match(/class="coast-forge-pick-icon"/g)||[]).length,4);
    const rows=makeRows();
    opts.render({}, {element:{querySelectorAll:()=>rows}});
    await state.interact(rows);
    return state.approved;
  }
}},apps:{FilePicker:{implementation:Picker}}},utils:{randomID:(()=>{let i=0;return ()=>String(++i).padStart(16,'0');})()}};
globalThis.Hooks={on(){},once(){}};
globalThis.ui={notifications:{error(x){throw new Error(x);},warn(){},info(){}}};
globalThis.CONFIG={Item:{documentClass:class{constructor(data){assert.ok(data.name);}}}};
const actor={id:'actor1',name:'Test Actor',isOwner:true,items:{contents:[]},async createEmbeddedDocuments(type,docs){assert.equal(type,'Item');state.created.push(...structuredClone(docs));}};
globalThis.game={settings:{get:()=>""},packs:{contents:[]},user:{isGM:true},system:{id:'dnd5e',version:'5.2.5'},actors:{contents:[actor],get:()=>actor},folders:[{id:'folder1',type:'Item',name:'Coast Forge Imports',folder:null}],items:{contents:[]}};
globalThis.Item={implementation:{async createDocuments(docs){state.created.push(...structuredClone(docs));}}};
const {openImporter}=await import('../scripts/main.mjs');
const choose=async (row,path)=>{
  await row.elements['.coast-forge-pick-icon'].onclick(event);
  const picker=state.pickers.at(-1);
  assert.equal(picker.options.type,'image');
  picker.options.callback(path);
  assert.equal(row.elements['.coast-forge-item-icon'].src,path);
};
function setup(interact,approved=true,destination='world'){
  state={interact,approved,destination,pickers:[],created:[],mode:"skip"};
  game.items.contents=[];actor.items.contents=[];
}
test('world import uses four different selected icons',async()=>{
  const paths=['one.png','two.webp','three.jpg','four.png'];
  setup(async rows=>{for(let i=0;i<rows.length;i++) await choose(rows[i],paths[i]);});
  const result=await openImporter();
  assert.equal(result.successes.length,4);
  assert.deepEqual(state.created.map(x=>x.img),paths);
  assert.ok(state.created.every(x=>x.folder==='folder1'));
  assert.ok(state.pickers.every(p=>!p.rendered));
});
test('actor import supports independent choices and reset',async()=>{
  setup(async rows=>{
    const original=rows[1].elements['.coast-forge-item-icon'].src;
    await choose(rows[0],'first.png');await choose(rows[1],'second.png');
    rows[1].elements['.coast-forge-reset-icon'].onclick(event);
    assert.equal(rows[1].elements['.coast-forge-item-icon'].src,original);
  },true,'actor1');
  const result=await openImporter();
  assert.equal(result.successes.length,4);
  assert.equal(state.created[0].img,'first.png');
  assert.notEqual(state.created[1].img,'second.png');
  assert.ok(state.created.every(x=>!x.folder));
});
test('cancelling preview prevents any item creation',async()=>{
  setup(async rows=>choose(rows[0],'cancelled.png'),false);
  assert.equal(await openImporter(),undefined);
  assert.equal(state.created.length,0);
});
test('existing items remain skipped, not overwritten by chosen image',async()=>{
  setup(async rows=>choose(rows[0],'new.png'));
  game.items.contents=[{name:'Cinder Snap',type:'spell',folder:{id:'folder1'},img:'old.png'}];
  const result=await openImporter();
  assert.deepEqual(result.skipped,['Cinder Snap']);
  assert.equal(state.created.length,3);
  assert.equal(game.items.contents[0].img,'old.png');
});

test('icon-only mode updates matched document and leaves new items importable',async()=>{
  setup(async rows=>choose(rows[0],'new.png')); state.mode='icons';
  const doc={id:'existing1',name:'Cinder Snap',type:'spell',folder:{id:'folder1'},img:'old.png',async update(p){assert.deepEqual(Object.keys(p),['img']);this.img=p.img;}};
  game.items.contents=[doc];const result=await openImporter();
  assert.deepEqual(result.updated,['Cinder Snap']);assert.equal(doc.img,'new.png');assert.equal(state.created.length,3);
});
test('icon-only mode without selection keeps current icon',async()=>{
  setup(async()=>{});state.mode='icons';const doc={id:'existing1',name:'Cinder Snap',type:'spell',folder:{id:'folder1'},img:'old.png',async update(){throw Error('unexpected update');}};game.items.contents=[doc];
  const result=await openImporter();assert.deepEqual(result.skipped,['Cinder Snap']);assert.equal(doc.img,'old.png');
});

test('custom world folder is used for creations and duplicate checks',async()=>{
 setup(async rows=>choose(rows[0],'custom.png'),true,'folder:folder2');
 game.folders.push({id:'folder2',name:'Subclasses',type:'Item'});
 game.items.contents=[{name:'Cinder Snap',type:'spell',folder:{id:'folder1'},img:'old.png'},{name:'Grave Pinch',type:'spell',folder:{id:'folder2'},img:'there.png'}];
 try {const result=await openImporter();assert.deepEqual(result.skipped,['Grave Pinch']);assert.equal(state.created.length,3);assert.ok(state.created.every(x=>x.folder==='folder2'));assert.equal(state.created[0].img,'custom.png');} finally{game.folders.pop();}
});

test('dialog reads all preferred packs and saves settings only after confirmation',async()=>{
 setup(async()=>{},true,'world'); const original=game.settings, oldPacks=game.packs;
 const saved=new Map([['itemPack','world.official']]);
 game.settings={get:(_m,k)=>saved.get(k)??'',async set(_m,k,v){saved.set(k,v);}};
 game.packs={contents:[{collection:'world.official',documentName:'Item',title:'Official'},{collection:'world.custom',documentName:'Item',title:'Custom'}]};
 state.form=async opts=>{assert.match(opts.content,/type="checkbox" name="itemPack"/);assert.match(opts.content,/value="world.official" checked/);assert.match(opts.content,/value="folder:folder1"/);const fields={sourceText:{value:fixture},destination:{value:'world'},mode:{value:'skip'},effectPack:{value:''},journalPack:{value:''},itemPack:{value:'world.official'}};return opts.ok.callback({}, {form:{elements:{namedItem:k=>fields[k]},querySelectorAll:()=>[{value:'world.official'},{value:'world.custom'}]}});};
 try {const r=await openImporter();assert.equal(r.successes.length,4);assert.deepEqual(JSON.parse(saved.get('itemPack')),['world.official','world.custom']);} finally {game.settings=original;game.packs=oldPacks;}
});
test('icon update stays in explicitly selected folder and preserves same-named item elsewhere',async()=>{
 setup(async rows=>choose(rows[0],'new.png'),true,'folder:folder2');state.mode='icons';game.folders.push({id:'folder2',name:'Subclasses',type:'Item'});
 const other={id:'other',name:'Cinder Snap',type:'spell',folder:{id:'folder1'},img:'other.png'};
 const selected={id:'selected',name:'Cinder Snap',type:'spell',folder:{id:'folder2'},img:'old.png',async update(p){this.img=p.img;}};
 game.items.contents=[other,selected];try {const r=await openImporter();assert.deepEqual(r.updated,['Cinder Snap']);assert.equal(selected.img,'new.png');assert.equal(other.img,'other.png');assert.ok(state.created.every(x=>x.folder==='folder2'));}finally{game.folders.pop();}
});
