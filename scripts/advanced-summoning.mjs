/** Declarative, opt-in advanced summoning. No eval, no timers, no world-template edits. */
export const SCOPE='coast-forge-importer';
const ABILITIES=['str','dex','con','int','wis','cha'];
const DAMAGE_TYPES=['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder'];
const KEYS=['base','level','ability','prof','ac'];
const own=(x,k)=>Object.hasOwn(x??{},k);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const label=x=>typeof x==='string'&&x.trim().length>0&&x.length<=200;
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(x);
const list=x=>x?.contents??(Array.isArray(x)?x:[...(x?.values?.()??[])]);
const clone=x=>JSON.parse(JSON.stringify(x));
const fail=msg=>{throw new Error(`Advanced Summoning: ${msg}`);};
function requireKeys(x,keys){if(!obj(x)||Object.keys(x).some(k=>!keys.includes(k)))fail('Unknown or invalid configuration field.');}
function affine(x){requireKeys(x,KEYS);if(!Object.values(x).every(v=>int(v,-10000,10000)))fail('Invalid scaling coefficient.');}
export function calculate(x,s){return (x.base??0)+(x.level??0)*s.level+(x.ability??0)*s.ability+(x.prof??0)*s.prof+(x.ac??0)*s.ac;}
export function validateAdvancedSummon(c,activities){
  requireKeys(c,['group','classIdentifier','ability','tiers','damageTypes','profiles']);
  if(!id(c.group)||!id(c.classIdentifier)||!ABILITIES.includes(c.ability))fail('Invalid group, class identifier or ability.');
  if(!Array.isArray(c.tiers)||!c.tiers.length||c.tiers.length>20)fail('Expected 1–20 scaling tiers.');
  let last=0;
  for(const t of c.tiers){
    requireKeys(t,['minLevel','maxActive','hp','ac','walk','save']);
    if(!int(t.minLevel,last+1,20)||!int(t.maxActive,1,12))fail('Invalid tier level or summon limit.');
    last=t.minLevel; for(const k of ['hp','ac','walk'])affine(t[k]); if(t.save!==undefined)affine(t.save);
  }
  if(!Array.isArray(c.damageTypes)||!c.damageTypes.length||new Set(c.damageTypes).size!==c.damageTypes.length||c.damageTypes.some(d=>!DAMAGE_TYPES.includes(d)))fail('Invalid damage types.');
  if(!Array.isArray(c.profiles)||!c.profiles.length||c.profiles.length>30)fail('Invalid profiles.');
  const names=new Set();
  for(const p of c.profiles){
    requireKeys(p,['name','rules']);
    if(!label(p.name)||names.has(p.name)||!Array.isArray(p.rules)||p.rules.length>30)fail('Invalid or duplicate scaling profile.');
    names.add(p.name);const targets=new Set();
    for(const r of p.rules){
      requireKeys(r,['item','activity','kind','part','die','dice','bonus','text','replaceType']);
      if(!label(r.item)||!label(r.activity)||!['damage','healing','flavor'].includes(r.kind))fail('Invalid activity scaling rule.');
      if(!Array.isArray(r.bonus)||r.bonus.length!==c.tiers.length)fail('Each rule requires one bonus per tier.');r.bonus.forEach(affine);
      if(r.kind==='damage'){
        if(!int(r.part,0,20)||![4,6,8,10,12,20,100].includes(r.die)||!Array.isArray(r.dice)||r.dice.length!==c.tiers.length||!r.dice.every(n=>int(n,1,100))||typeof r.replaceType!=='boolean')fail('Invalid damage rule.');
      }else if(r.kind==='flavor'&&!label(r.text))fail('Flavor rule requires label.');
      const target=JSON.stringify([r.item,r.activity,r.kind,r.part??null]); if(targets.has(target))fail('Duplicate scaling rule.');targets.add(target);
    }
  }
  if(activities!==undefined){
    const summons=activities.filter(a=>a.type==='summon');
    if(!summons.length)fail('Missing summon activity.');
    const seen=new Set();
    for(const a of summons){
      const targets=a.consumption?.targets??[];
      if(a.consumption?.spellSlot!==false||targets.length!==1||targets[0].type!=='itemUses'||String(targets[0].value)!=='1'||a.summon?.mode==='cr')fail('Managed activities must use exactly one item use, no spell slot or CR search.');
      if(!Array.isArray(a.profiles)||!a.profiles.length||a.profiles.some(p=>!names.has(p.name)||String(p.count)!=='1'))fail('Managed profiles must have a known name and count 1.');
      for(const p of a.profiles)seen.add(p.name);
      if(Object.values(a.bonuses??{}).some(v=>v!==''&&v!==null&&v!==undefined&&v!==0))fail('Managed scaling must not also specify native bonus formulas.');
      if(!Array.isArray(a.creatureSizes)||!a.creatureSizes.length)fail('At least one native creature size required.');
    }
    if([...names].some(n=>!seen.has(n)))fail('Unused scaling profile.');
  }
  return c;
}
export function snapshot(c,actor){
  const level=Number(actor.classes?.[c.classIdentifier]?.system?.levels??actor.getRollData?.().classes?.[c.classIdentifier]?.levels??0);
  const ability=Number(actor.system?.abilities?.[c.ability]?.mod),prof=Number(actor.system?.attributes?.prof),ac=Number(actor.system?.attributes?.ac?.value);
  if(!int(level,1,20)||![ability,prof,ac].every(Number.isFinite))fail(`Missing class '${c.classIdentifier}' or caster statistics.`);
  const index=c.tiers.findLastIndex(t=>t.minLevel<=level); if(index<0)fail('Class level too low.');
  const s={level,ability,prof,ac,index},t=c.tiers[index];
  const stats={hp:calculate(t.hp,s),ac:calculate(t.ac,s),walk:calculate(t.walk,s),...(t.save?{save:calculate(t.save,s)}:{})};
  if(!int(stats.hp,1,100000)||!int(stats.ac,0,1000)||!int(stats.walk,0,1000))fail('Invalid calculated actor statistics.');
  return {...s,stats,maxActive:t.maxActive};
}
export const configOf=item=>item?.flags?.[SCOPE]?.advancedSummon;
export const tokenLink=token=>token?.flags?.[SCOPE]?.summon;
export function ownedSummons(scenes,owner,group){
  return list(scenes).flatMap(scene=>list(scene.tokens).filter(t=>{const f=tokenLink(t);return f?.owner===owner&&f?.group===group;}).map(token=>({scene,token,active:token.actor?.system?.attributes?.hp?.value!==0})));
}
export function remainingSlots(s,entries){return Math.max(0,s.maxActive-entries.filter(e=>e.active).length);}
export function formula(dice,die,bonus){return `${dice}d${die}${bonus<0?' - '+(-bonus):bonus>0?' + '+bonus:''}`;}
/** Mutates only the native hook's not-yet-created synthetic token delta. */
export function applyScaling(c,profile,choice,s,config){
  const {actor,actorUpdates:u,tokenUpdates:t}=config;
  if(!actor||!u||!t||actor.prototypeToken?.actorLink!==false||actor.type!=='npc')fail('Unlinked NPC template required.');
  if(!c.damageTypes.includes(choice.damage))fail('Invalid damage type.');
  const p=c.profiles.find(p=>p.name===profile.name);if(!p)fail('Unknown scaling profile.');
  Object.assign(u,{'system.attributes.ac.calc':'natural','system.attributes.ac.flat':s.stats.ac,'system.attributes.hp.max':s.stats.hp,'system.attributes.hp.value':s.stats.hp,'system.attributes.movement.walk':s.stats.walk});
  if(s.stats.save!==undefined){
    // Use individual save bonuses, not modified ability scores. Future external buffs can still add.
    for(const key of ABILITIES){
      const a=actor.system.abilities[key]; if(!Number.isFinite(a?.mod))fail('NPC ability data missing.');
      u[`system.abilities.${key}.proficient`]=0;
      u[`system.abilities.${key}.bonuses.save`]=String(s.stats.save-a.mod);
    }
  }
  u.items??=[];
  const modified=new Map();
  for(const r of p.rules){
    const matches=list(actor.items).filter(i=>i.name===r.item);if(matches.length!==1)fail(`Missing or ambiguous item '${r.item}'.`);
    const item=matches[0],acts=list(item.system.activities).filter(a=>a.name===r.activity);if(acts.length!==1)fail(`Missing or ambiguous activity '${r.activity}'.`);
    const a=acts[0]; const raw=item.toObject().system.activities[a.id];if(!raw)fail('Activity source missing.');
    let patch=modified.get(item.id);if(!patch){patch=u.items.find(i=>i._id===item.id)??{_id:item.id};if(!u.items.includes(patch))u.items.push(patch);modified.set(item.id,patch);}
    patch.system??=clone(item.toObject().system);patch.system.activities??={};const change=patch.system.activities[a.id]??=clone(raw);
    const bonus=calculate(r.bonus[s.index],s);
    if(r.kind==='damage'){
      if(!['attack','save','damage'].includes(a.type)||!raw.damage?.parts?.[r.part])fail('Invalid damage activity/part.');
      change.damage??={};change.damage.parts??=clone(raw.damage.parts);
      const part=change.damage.parts[r.part];part.custom={enabled:true,formula:formula(r.dice[s.index],r.die,bonus)};
      if(r.replaceType)part.types=[choice.damage];
    }else if(r.kind==='healing'){
      if(a.type!=='heal'||!raw.healing)fail('Invalid healing activity.');
      change.healing={...clone(raw.healing),custom:{enabled:true,formula:String(Math.max(0,bonus))}};
    }else{
      change.description??={...raw.description};change.description.chatFlavor=`${raw.description?.chatFlavor??''} | ${r.text}: ${bonus}`;
    }
  }
  // Native token flag is stable even if feature is later replaced or renamed.
  t.flags??={};t.flags[SCOPE]={...(t.flags[SCOPE]??{}),summon:{owner:choice.owner,group:c.group,profile:p.name,damage:choice.damage,batch:choice.batch,level:s.level}};
  return config;
}
