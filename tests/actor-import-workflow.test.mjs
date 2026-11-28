import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../examples/71-tactician-summons-TEST.json',import.meta.url),'utf8'));
let state;let n=0;
class ItemMock {constructor(data){this.data=structuredClone(data);} toObject(){return structuredClone(this.data);}}
class ActorMock {constructor(data){assert.equal(data.type,'npc');assert.ok(data.items.length);this.data=structuredClone(data);} static async create(data,opts){assert.equal(opts.keepId,true);state.events.push('actor');const doc={...structuredClone(data),id:data._id,uuid:`Actor.${data._id}`,folder:{id:data.folder}};game.actors.contents.push(doc);return doc;}}
globalThis.CONFIG={Actor:{documentClass:ActorMock},Item:{documentClass:ItemMock}};
globalThis.foundry={applications:{api:{DialogV2:{async prompt(opts){return opts.ok.label==='Vorschau prüfen'?{text:JSON.stringify(state.fixture),destination:'world',actorDestination:'folder:actors',mode:'skip'}:true;},async confirm(opts){state.previews.push(opts.content);return state.approvals.shift()??true;}}}},utils:{randomID:()=>String(++n).padStart(16,'0')}};
globalThis.Hooks={once(){},on(){}};
globalThis.ui={notifications:{error(s){state.errors.push(s);},warn(){},info(){}}};
globalThis.game={user:{isGM:true},system:{id:'dnd5e',version:'5.2.5'},actors:{contents:[]},items:{contents:[]},folders:[{id:'actors',type:'Actor',name:'Summons'},{id:'items',type:'Item',name:'Coast Forge Imports'}],settings:{get:()=>''},packs:{contents:[]}};
globalThis.Item={implementation:{async createDocuments(docs){state.events.push('item');for(const d of docs)game.items.contents.push({...structuredClone(d),id:'item1',folder:{id:d.folder},toObject:()=>structuredClone(d)});return game.items.contents.slice(-docs.length);}}};
const {openImporter}=await import('../scripts/main.mjs');
function start(approvals=[true,true]){state={fixture:structuredClone(fixture),approvals,previews:[],events:[],errors:[]};game.actors.contents=[];game.items.contents=[];}
test('actual importer creates NPCs first and then one world feature with real actor UUIDs',async()=>{start();const r=await openImporter();assert.deepEqual(state.errors,[]);assert.equal(r.actors.created.length,3);assert.deepEqual(state.events,['actor','actor','actor','item']);assert.equal(state.previews.length,2);assert.match(state.previews[0],/Summons/);assert.match(state.previews[0],/Vanguard Strike/);const a=Object.values(game.items.contents[0].system.activities);assert.deepEqual(a[3].profiles.map(p=>p.uuid),game.actors.contents.map(a=>a.uuid));assert.ok(game.actors.contents.every(a=>a.folder.id==='actors'));});
test('cancelled second preview writes neither actors nor items',async()=>{start([true,false]);await openImporter();assert.deepEqual(state.events,[]);assert.equal(game.actors.contents.length,0);});
test('actor-only actual import skips item preview and world Item creation',async()=>{start([true]);delete state.fixture.items;const r=await openImporter();assert.equal(r.actors.created.length,3);assert.deepEqual(state.events,['actor','actor','actor']);assert.equal(state.previews.length,1);});
test('reimport reuses actors and skips correctly linked Item',async()=>{start();await openImporter();const ids=game.actors.contents.map(a=>a.id);state.events=[];state.approvals=[true,true];const r=await openImporter();assert.deepEqual(state.errors,[]);assert.equal(r.actors.reused.length,3);assert.equal(r.skipped.length,1);assert.deepEqual(state.events,[]);assert.deepEqual(game.actors.contents.map(a=>a.id),ids);});
test('bad local reference blocks both previews and all writes',async()=>{start();state.fixture.items[0].activities[0].profiles[0].actorRef='missing';await openImporter();assert.deepEqual(state.events,[]);assert.equal(state.previews.length,0);assert.match(state.errors[0],/unresolved/);});
