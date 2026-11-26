import { createExternalResolver } from './references.mjs';
import { escapeHtml } from './schema.mjs';

export const MAX_SCROLLS = 500;
const clone = value => JSON.parse(JSON.stringify(value));
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const integerLevel = x => Number.isInteger(x) && x >= 0 && x <= 9;
const own = (o,k) => Object.hasOwn(o,k);

/** Strictly data-only requests. No arbitrary code or automatic upcast guessing. */
export function validateScrollRequests(requests) {
  if (!Array.isArray(requests) || requests.length > MAX_SCROLLS) throw new Error('scrolls must be a list of at most 500 requests.');
  for (const r of requests) {
    if (!obj(r) || typeof r.spell !== 'string' || !r.spell.trim() || r.spell.length > 150) throw new Error('Scroll request: spell name required.');
    if (r.pack !== undefined && (typeof r.pack !== 'string' || !r.pack.trim())) throw new Error(`${r.spell}: invalid pack.`);
    const levels = r.scrollLevels === undefined ? 'base' : r.scrollLevels;
    if (!['base','all'].includes(levels) && (!Array.isArray(levels) || !levels.length || levels.length > 10 || levels.some(l=>!integerLevel(l)) || new Set(levels).size !== levels.length)) throw new Error(`${r.spell}: scrollLevels must be base, all, or distinct integers 0–9.`);
    if (r.img !== undefined && (typeof r.img !== 'string' || !r.img.trim())) throw new Error(`${r.spell}: invalid image.`);
    if (r.priceByLevel !== undefined && (!obj(r.priceByLevel) || Object.entries(r.priceByLevel).some(([k,v])=>!/^\d$/.test(k) || typeof v!=='number' || !Number.isFinite(v) || v<0))) throw new Error(`${r.spell}: priceByLevel requires nonnegative GP amounts.`);
    if (r.followUpActivities !== undefined && (!Array.isArray(r.followUpActivities) || r.followUpActivities.some(n=>typeof n!=='string' || !n.trim()) || new Set(r.followUpActivities).size!==r.followUpActivities.length)) throw new Error(`${r.spell}: followUpActivities must contain distinct activity names.`);
    if (Object.keys(r).some(k=>!['spell','pack','scrollLevels','img','priceByLevel','followUpActivities'].includes(k))) throw new Error(`${r.spell}: unknown scroll request property.`);
  }
  return requests;
}
export function expandLevels(request,base) {
  if (!integerLevel(base)) throw new Error(`${request.spell}: invalid source spell level.`);
  const selection=request.scrollLevels ?? 'base';
  const levels=selection==='base' || (selection==='all' && base===0) ? [base] : selection==='all' ? Array.from({length:10-base},(_,i)=>i+base) : [...selection].sort((a,b)=>a-b);
  if (levels.some(l=>l<base || (base===0 && l!==0) || (base>0 && l===0))) throw new Error(`${request.spell}: cannot create requested scroll level from a level ${base} spell.`);
  return levels;
}
export function scrollChallenge(level,table) {
  for (let i=level;i>=0;i--) if (table?.[i]) {
    const {dc,bonus}=table[i];
    if (Number.isFinite(dc) && Number.isFinite(bonus)) return {dc,bonus};
  }
  throw new Error('D&D5e spell scroll challenge table unavailable.');
}
function manualDuration(d) {
  if (!obj(d)) return d;
  return ['inst','spec','disp','dstr','perm',''].includes(d.units ?? '') ? {...d} : {...d,units:'spec',value:null};
}
function stripExpiryFlags(flags) {
  if (!obj(flags)) return;
  for (const scope of ['dae','times-up','timesUp','midi-qol']) {
    if (!obj(flags[scope])) continue;
    for (const key of Object.keys(flags[scope])) if (/^(specialDuration|macroRepeat|expire|expiration|duration|deleteOnExpire|removeOnExpire|onUseMacroName|onUseMacroParts)$/i.test(key)) delete flags[scope][key];
  }
  delete flags.itemacro;
  delete flags['item-macro'];
}
function stripEffectTimers(effect) {
  delete effect.duration;
  delete effect.origin;
  delete effect._stats;
  stripExpiryFlags(effect.flags);
  if (Array.isArray(effect.changes)) effect.changes=effect.changes.filter(c=>!/^macro\.|^flags\.midi-qol\.onUseMacroName/i.test(c.key ?? ''));
  if (!effect.img && effect.icon) effect.img=effect.icon;
  delete effect.icon;
}
function substituteLevel(value,level) {
  if (typeof value==='string') return value.replace(/@item\.level(?![\w.])/g,String(level));
  if (Array.isArray(value)) return value.map(v=>substituteLevel(v,level));
  if (obj(value)) return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,substituteLevel(v,level)]));
  return value;
}
function sourceDurationText(duration) {
  if (!duration?.units) return '';
  const special={inst:'Instantaneous',spec:'Special',perm:'Permanent',disp:'Until dispelled',dstr:'Until dispelled or triggered'};
  return special[duration.units] ?? `${duration.value ?? ''} ${duration.units}${Number(duration.value)===1?'':'s'}`.trim();
}
function sourceSnapshot(doc) {
  const raw=clone(doc.toObject());
  for (const k of ['_id','_stats','folder','sort','ownership','pack']) delete raw[k];
  raw.flags ??= {};
  for (const k of ['cachedFor','dependentOn','advancementOrigin','scaling','spellLevel']) if (raw.flags.dnd5e) delete raw.flags.dnd5e[k];
  delete raw.flags['coast-forge-importer'];
  stripExpiryFlags(raw.flags);
  raw.system.duration=manualDuration(raw.system.duration);
  raw.system.activities ??= {};
  for (const [id,a] of Object.entries(raw.system.activities ?? {})) {
    if (!a.name) a.name=doc.system.activities?.get?.(id)?.name ?? a.name;
    a.duration=manualDuration(a.duration);
    stripExpiryFlags(a.flags);
    for (const link of a.effects ?? []) { if (own(link,'concentration')) link.concentration=false; }
  }
  for (const e of raw.effects ?? []) stripEffectTimers(e);
  return raw;
}
/** The factory is the native detached-spell conversion, returning an unsaved Item. */
export async function generateScrolls(requests,{packs,selection,createScroll,challengeTable,limit=MAX_SCROLLS}={}) {
  validateScrollRequests(requests);
  if (!requests.length) return {items:[],warnings:[]};
  if (typeof createScroll!=='function') throw new Error('Native D&D5e scroll conversion unavailable.');
  const resolve=createExternalResolver(packs,selection), plan=[], seen=new Set();
  // Resolve all sources and expand first; no creation or preview on missing/ambiguous source.
  for (const request of requests) {
    const doc=await resolve(request.spell,'spell',request.pack);
    const base=Number(doc.system.level);
    for (const level of expandLevels(request,base)) {
      const name=`Spell Scroll: ${doc.name} (${level===0?'Cantrip':`Level ${level}`})`;
      if (seen.has(name)) throw new Error(`${name}: duplicate generated scroll; select one source.`);
      seen.add(name); plan.push({request,doc,base,level,name});
      if (plan.length>limit) throw new Error(`Maximum ${limit} generated scrolls per import. Split the file.`);
    }
  }
  const items=[], warnings=[];
  const complex=new Set();
  for (const {request,doc,base,level,name} of plan) {
    const challenge=scrollChallenge(level,challengeTable);
    const source=sourceSnapshot(doc);
    const original=doc.toObject();
    const sourceActs=Object.values(source.system.activities ?? {});
    const followups=new Set(request.followUpActivities ?? []);
    if ([...followups].some(n=>!sourceActs.some(a=>a.name===n))) throw new Error(`${name}: unknown follow-up activity name.`);
    if (sourceActs.length && sourceActs.every(a=>followups.has(a.name))) throw new Error(`${name}: at least one casting activity is required.`);
    // Follow-ups must be explicitly identified. No inference from names or spellSlot flags.
    const generated=await createScroll(source,{}, {dialog:false,explanation:'reference',level,values:{...challenge}});
    if (!generated?.toObject) throw new Error(`${name}: native conversion returned no scroll. Check source and system scroll templates.`);
    const raw=clone(generated.toObject());
    if (raw.type!=='consumable' || raw.system?.type?.value!=='scroll') throw new Error(`${name}: native conversion did not return a scroll.`);
    const system=raw.system;
    system.quantity=1;
    system.uses={...system.uses,max:'1',spent:0,recovery:[],autoDestroy:!followups.size};
    if (request.priceByLevel && own(request.priceByLevel,String(level))) system.price={value:request.priceByLevel[level],denomination:'gp'};
    const originalDuration=sourceDurationText(original.system.duration);
    const requiresConcentration=original.system.properties?.includes?.("concentration") ?? false;
    const oldDesc=system.description?.value ?? '';
    const link=typeof doc.uuid==='string' && !/[\[\]{}<>\s]/.test(doc.uuid) ? `@UUID[${doc.uuid}]{${escapeHtml(doc.name)}}` : escapeHtml(doc.name);
    system.description={...system.description,value:`<p><strong>${escapeHtml(name)}</strong> — ${link}${originalDuration?`<br>Spell duration: ${escapeHtml(originalDuration)}`:''}</p>${oldDesc}`};
    system.activities=substituteLevel(system.activities ?? {},level);
    for (const [id,activity] of Object.entries(system.activities)) {
      const follow=followups.has(activity.name);
      const initial=source.system.activities[id];
      activity.consumption={...activity.consumption,spellSlot:false,targets:follow?[]:[{type:'itemUses',target:'',value:'1'}],scaling:{allowed:false,max:''}};
      activity.duration=manualDuration(activity.duration);
      if (follow) activity.duration={...activity.duration,concentration:false};
      else if (requiresConcentration && initial?.duration?.override!==true) activity.duration={...activity.duration,concentration:true};
      stripExpiryFlags(activity.flags);
      if (activity.type==='attack') activity.attack={...activity.attack,flat:true,bonus:String(challenge.bonus)};
      if (activity.type==='save') activity.save={...activity.save,dc:{...activity.save?.dc,calculation:'',formula:String(challenge.dc)}};
      for (const link of activity.effects ?? []) if (own(link,'concentration')) link.concentration=false;
    }
    const sourceIds=Object.keys(source.system.activities);
    if (sourceIds.some(id=>!own(system.activities,id))) throw new Error(`${name}: native conversion lost a source activity.`);
    const effectIds=new Set((raw.effects ?? []).map(e=>e._id));
    for (const a of Object.values(system.activities)) if ((a.effects ?? []).some(e=>!effectIds.has(e._id))) throw new Error(`${name}: missing embedded effect reference.`);
    if (!Object.keys(system.activities).length) complex.add(`${doc.name}: source has no Activities; use its rules manually.`);
    if (sourceActs.length>1 && !followups.size) complex.add(`${doc.name}: multiple Activities; each is treated as an alternative initial cast. Specify followUpActivities for recurring actions.`);
    if (followups.size) complex.add(`${doc.name}: follow-ups are free; spent scroll remains in inventory until you manually remove it after the spell. Do not stack these scrolls.`);
    if (base===0) complex.add(`${doc.name}: cantrip scroll uses the source's base scaling; verify minimum caster-level behavior.`);
    if (sourceActs.some(a=>['summon','cast','enchant','transform'].includes(a.type))) complex.add(`${doc.name}: complex linked Activity; check dependencies and any automation in linked documents.`);
    if (Number(system.price?.value ?? 0)===0 && !(request.priceByLevel && own(request.priceByLevel,String(level)))) complex.add(`${doc.name}: native scroll template has no nonzero price; set priceByLevel if desired.`);
    for (const e of raw.effects ?? []) stripEffectTimers(e);
    const flags=raw.flags ?? {};
    stripExpiryFlags(flags);
    flags.dnd5e={...flags.dnd5e,scaling:level-base,spellLevel:{value:level,base}};
    delete flags['coast-forge-importer'];
    items.push({name,kind:'consumable',img:request.img || raw.img,system,effects:raw.effects ?? [],flags,automation:'partial'});
  }
  warnings.push(`${items.length} Spell Scrolls generated from source spells. Level-specific native templates and fixed scroll DC/attack; original compendiums unchanged. Known duration and macro hooks removed from copies; macro-dependent effects need manual review. External modules may still manage concentration or linked effects. Check source automation and upcasting live.`);
  warnings.push(...complex);
  return {items,warnings};
}
