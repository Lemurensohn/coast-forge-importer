/** Declarative adapter for Aura Effects 1.5.2 (Foundry v13). No runtime hooks. */
export const AURA_TYPE = 'auraeffects.aura';
const dispositions = Object.freeze({allies:1,enemies:-1,any:0});
const allowed = new Set(['radius','targets','includeSelf','color','opacity','showRadius','evaluateSource','stack','bestFormula','collisionTypes','disableOnHidden']);
const bool = (v,k,d) => {if(v===undefined)return d;if(typeof v!=='boolean')throw Error(`Aura: ${k} must be boolean.`);return v;};
function formula(value,key){
  if(typeof value==='number' && Number.isFinite(value))value=String(value);
  if(typeof value!=='string'||!value.trim()||value.length>240)throw Error(`Aura: invalid ${key}.`);
  const rest=value.replace(/@[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)*/g,'1').replace(/\b(?:min|max|floor|ceil|round|abs)\s*(?=\()/g,'');
  if(!/^[\d.\s()+*/,-]+$/.test(rest))throw Error(`Aura: ${key} must be a deterministic roll formula (no dice or scripts).`);
  return value;
}
export function auraConfig(a){
  if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Aura: configuration object required.');
  for(const k of Object.keys(a))if(!allowed.has(k))throw Error(`Aura: unsupported field ${k}.`);
  const distanceFormula=formula(a.radius,'radius');
  if(!Number.isNaN(Number(distanceFormula))&&Number(distanceFormula)<=0)throw Error('Aura: radius must be positive.');
  if(!Object.hasOwn(dispositions,a.targets))throw Error('Aura: targets must be allies, enemies or any.');
  const color=a.color??(a.targets==='enemies'?'#FF3B30':a.targets==='allies'?'#4DA3FF':'#D4AF37');
  if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))throw Error('Aura: color must be #RRGGBB.');
  const opacity=a.opacity??0.25;
  if(typeof opacity!=='number'||!Number.isFinite(opacity)||opacity<0||opacity>1)throw Error('Aura: opacity must be 0–1.');
  const collisionTypes=a.collisionTypes??['move'];
  if(!Array.isArray(collisionTypes)||new Set(collisionTypes).size!==collisionTypes.length||collisionTypes.some(x=>!['move','sight','light','sound'].includes(x)))throw Error('Aura: invalid collisionTypes.');
  const applyToSelf=bool(a.includeSelf,'includeSelf',a.targets==='allies');
  if(a.targets==='enemies'&&applyToSelf)throw Error('Aura: enemies-only cannot include self; use a separate self effect.');
  return {distanceFormula,disposition:dispositions[a.targets],applyToSelf,color,opacity,showRadius:bool(a.showRadius,'showRadius',true),evaluatePreApply:bool(a.evaluateSource,'evaluateSource',true),canStack:bool(a.stack,'stack',false),bestFormula:a.bestFormula===undefined?'':formula(a.bestFormula,'bestFormula'),collisionTypes:[...collisionTypes],disableOnHidden:bool(a.disableOnHidden,'disableOnHidden',true),combatOnly:false};
}
export function validateAuraEffect(e){
  if(e.aura===undefined&&e.type!==AURA_TYPE)return;
  if(e.aura!==undefined){
    auraConfig(e.aura);
    if((e.type&&e.type!=='base')||e.system!==undefined||e.flags?.auraeffects)throw Error('Aura: do not combine aura shorthand with native type/system/auraeffects flags.');
  }else if(e.system?.script?.trim?.()||e.system?.combatOnly)throw Error('Aura: imported native aura scripts or combat-only activation are not supported.');
  if(e.duration&&Object.values(e.duration).some(v=>v!==null&&v!==undefined))throw Error('Aura: automatic duration forbidden.');
  if(e.flags?.dae?.specialDuration?.length||(e.flags?.dae?.macroRepeat&&e.flags.dae.macroRepeat!=='none')||e.flags?.dae?.durationExpression||e.flags?.['times-up'])throw Error('Aura: timer or repeat flags forbidden.');
  if(!Array.isArray(e.changes)||[...e.changes,...(e.system?.stashedChanges??[])].some(c=>typeof c?.key!=='string'||/macro|script/i.test(c.key)))throw Error('Aura: ordinary Active Effect changes only; no macros or scripts.');
}
export function compileAuraEffect(e){
  validateAuraEffect(e);
  if(e.aura===undefined)return e;
  const {aura,...data}=e;
  return {...data,type:AURA_TYPE,system:auraConfig(aura),flags:{...data.flags,auraeffects:{originalType:'base'}}};
}
export function auraEffectsIn(specs){
  return specs.flatMap(s=>[...(s.effects??[]).filter(e=>e.aura!==undefined||e.type===AURA_TYPE),...auraEffectsIn(s.items??[])]);
}
/** Block only batches that actually require the optional dependency, before any writes. */
export function checkAuraDependency(specs,modules,models){
  const auras=auraEffectsIn(specs);
  if(!auras.length)return [];
  for(const effect of auras)validateAuraEffect(effect);
  const mod=modules?.get?.('auraeffects');
  if(!mod?.active||!models?.[AURA_TYPE])throw Error('Aura-Import benötigt das aktive Modul Aura Effects 1.5.2 (Foundry v13). Normale Imports sind weiterhin möglich.');
  if(mod.version!=='1.5.2')throw Error(`Aura Effects ${mod.version??'unknown'} ist nicht für diesen Adapter geprüft. Erwartet: 1.5.2.`);
  return [`${auras.length} Aura Effect(s): Aura Effects 1.5.2 übernimmt Radius, Zielgruppen und Anwendung. Aktiver GM erforderlich; Dauer manuell. Quellwert-Änderungen bei bereits angewandten Buffs ggf. durch erneutes Aktivieren aktualisieren.`];
}

/** Check that the real Foundry model did not silently drop the custom type. */
export function verifyAuraTypes(expected,actual){
  const hasAura=auraEffectsIn([expected]);
  if(!hasAura.length)return;
  if(!actual)throw Error('Aura: Foundry model did not return data.');
  const effects=actual.effects??[];
  for(const e of expected.effects??[]){
    if(e.type!==AURA_TYPE)continue;
    const saved=effects.find(x=>x._id===e._id);
    if(saved?.type!==AURA_TYPE)throw Error(`Aura ${e.name}: custom effect type was lost.`);
    for(const k of ['distanceFormula','disposition','applyToSelf','showRadius','evaluatePreApply','canStack','opacity']){
      if(e.system?.[k]!==undefined&&saved.system?.[k]!==e.system[k])throw Error(`Aura ${e.name}: field ${k} was lost or changed.`);
    }
    if(e.system?.color&&String(saved.system?.color).toLowerCase()!==String(e.system.color).toLowerCase())throw Error(`Aura ${e.name}: color was lost or changed.`);
  }
  for(const item of expected.items??[]){
    if(!auraEffectsIn([item]).length)continue;
    const matches=(actual.items??[]).filter(i=>i.name===item.name&&i.type===item.type);
    if(matches.length!==1)throw Error(`Aura: embedded item ${item.name} missing or ambiguous.`);
    verifyAuraTypes(item,matches[0]);
  }
}
