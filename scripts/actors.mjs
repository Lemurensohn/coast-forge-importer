/** Native world NPC imports. No arbitrary code, runtime hooks, or automatic timers. */
import {buildItemData, escapeHtml} from './schema.mjs';
const SCOPE='coast-forge-importer';
export const DEFAULT_ACTOR_FOLDER='Coast Forge Actors';
const copy=x=>JSON.parse(JSON.stringify(x));
const contents=x=>x?.contents ?? (Array.isArray(x)?x:[...(x?.values?.()??[])]);
const validId=x=>typeof x==='string' && /^[A-Za-z0-9]{16}$/.test(x);
export function findActorFolder(destination,folders){
  const all=contents(folders);
  if(destination==='world') return all.find(f=>f.type==='Actor'&&f.name===DEFAULT_ACTOR_FOLDER&&!f.folder)??null;
  if(!destination?.startsWith('folder:')) throw new Error('Invalid Actor folder.');
  const folder=all.find(f=>f.type==='Actor'&&f.id===destination.slice(7));
  if(!folder) throw new Error('Selected Actor folder no longer exists.');
  return folder;
}
function matchActor(spec,actors,folder){
  if(!folder) return null;
  const matches=contents(actors).filter(a=>(a.folder?.id??a.folder)===folder.id && (a.name===spec.name.trim()||a.flags?.[SCOPE]?.localRef===spec.ref));
  if(matches.length>1) throw new Error(`${spec.name}: ambiguous Actor match.`);
  const existing=matches[0];
  if(existing&&(existing.type!=='npc'||existing.flags?.[SCOPE]?.localRef!==spec.ref||existing.name!==spec.name.trim())) throw new Error(`${spec.name}: existing Actor does not match local reference/name; resolve manually.`);
  return existing??null;
}
export function planActors(specs,actors,folder,makeId){
  const ids=new Set(contents(actors).map(a=>a.id));
  return specs.map(spec=>{
    const existing=matchActor(spec,actors,folder);
    const id=existing?.id??makeId();
    if(!validId(id)||(!existing&&ids.has(id))) throw new Error(`${spec.name}: invalid or colliding Actor ID.`);
    ids.add(id);
    return {spec,existing,id,uuid:`Actor.${id}`};
  });
}
/** Local actorRef is accepted only in native summon profiles, never stored in Foundry. */
export function resolveSummonRefs(items,plans){
  const refs=new Map(plans.map(p=>[p.spec.ref,p.uuid]));
  return copy(items).map(item=>{
    const activities=item.activities??Object.values(item.system?.activities??{});
    for(const activity of activities){
      if(activity.profiles===undefined) continue;
      if(!Array.isArray(activity.profiles)) throw new Error(`${item.name}: profiles must be an array.`);
      if(activity.type!=='summon'){
        if(activity.profiles.some(p=>p?.actorRef!==undefined)) throw new Error(`${item.name}: actorRef requires a summon activity.`);
        continue;
      }
      for(const profile of activity.profiles){
        if(!profile||typeof profile!=='object'||Array.isArray(profile)) throw new Error(`${item.name}: invalid summon profile.`);
        if(profile.actorRef===undefined) continue;
        if(profile.uuid || !refs.has(profile.actorRef) || activity.summon?.mode==='cr') throw new Error(`${item.name}: unresolved or conflicting summon actorRef '${profile.actorRef}'.`);
        profile.uuid=refs.get(profile.actorRef);
        delete profile.actorRef;
      }
    }
    return item;
  });
}
export function buildActorData(spec,makeId){
  const system=copy(spec.system??{});
  if(spec.description!==undefined){
    system.details??={};
    system.details.biography??={};
    system.details.biography.value=escapeHtml(spec.description).split(/\n\s*\n/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('\n');
  }
  system.source??={}; system.source.rules??='2024';
  const img=spec.img||'icons/svg/mystery-man.svg';
  const prototypeToken=copy(spec.prototypeToken??{});
  prototypeToken.name??=spec.name.trim();
  prototypeToken.actorLink??=false;
  prototypeToken.texture??={}; prototypeToken.texture.src??=img;
  // Reuse the item builder's effect normalization, without embedding a fake item.
  const effects=buildItemData({name:spec.name,kind:'feature',effects:spec.effects??[]},makeId).effects;
  const flags=copy(spec.flags??{});
  flags[SCOPE]={schemaVersion:1,localRef:spec.ref,originalKind:'npc'};
  return {name:spec.name.trim(),type:'npc',img,system,prototypeToken,effects,flags,items:(spec.items??[]).map(i=>buildItemData(i,makeId))};
}
export function actorPreview(plans,makeId,validate){
  return plans.map(plan=>{
    const spec={...plan.spec,items:resolveSummonRefs(plan.spec.items??[],plans)};
    const data={...buildActorData(spec,makeId),_id:plan.id};
    validate?.(copy(data));
    return {...plan,item:{...spec,kind:'npc'},data,error:null};
  });
}
export function verifyExistingSummons(existing,data){
  const extract=activities=>Object.values(activities??{}).filter(a=>a.type==='summon').map(a=>[a.name,(a.profiles??[]).map(p=>p.uuid??'').sort()]).sort((a,b)=>a[0].localeCompare(b[0]));
  const expected=extract(data.system?.activities);
  if(expected.length&&JSON.stringify(expected)!==JSON.stringify(extract(existing.toObject().system?.activities))) throw new Error(`${data.name}: existing summon links differ. Use Update Existing Items.`);
}
export async function createPlannedActors(rows,{getActors,getFolders,destination,createFolder,createActor}){
  let folder=findActorFolder(destination,getFolders());
  for(const row of rows){
    const current=matchActor(row.spec,getActors(),folder);
    if((current?.id??null)!==(row.existing?.id??null)||(!current&&contents(getActors()).some(a=>a.id===row.id))) throw new Error(`${row.spec.name}: Actor target changed after preview. Restart import.`);
  }
  if(!folder) folder=await createFolder({name:DEFAULT_ACTOR_FOLDER,type:'Actor'});
  const created=[],reused=[];
  for(const row of rows){
    if(row.existing){reused.push(row.spec.name);continue;}
    const data=copy(row.data);
    if(!row.spec.prototypeToken?.texture?.src) data.prototypeToken.texture.src=data.img;
    try{
      const doc=await createActor({...data,folder:folder.id});
      if(doc?.uuid!==row.uuid) throw new Error(`expected ${row.uuid}, got ${doc?.uuid??'no UUID'}`);
      created.push(row.spec.name);
    }catch(error){throw new Error(`Actor ${row.spec.name}: ${error.message}. Already created: ${created.join(', ')||'none'}. No automatic rollback; Items not imported.`);}
  }
  return {created,reused};
}
