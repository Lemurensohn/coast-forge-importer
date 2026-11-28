import {SCOPE,configOf,tokenLink,ownedSummons,remainingSlots,snapshot,validateAdvancedSummon,applyScaling} from './advanced-summoning.mjs';
import {escapeHtml} from './schema.mjs';
const esc=escapeHtml;
const sessions=new Map(), busy=new Set();
const asArray=x=>x?.contents??(Array.isArray(x)?x:[...(x?.values?.()??[])]);
const notifyError=e=>{console.error('Coast Forge | Advanced Summoning',e);ui.notifications.error(`Coast Forge: ${e.message??e}`,{permanent:true});};
function itemFor(activity){return activity.actor?.items?.get(activity.item.id)??activity.item;}
function managed(activity){return activity.type==='summon'&&configOf(activity.item);}
function actualActivity(item,activityId){const a=item.system.activities.get(activityId);if(!a||!managed(a))throw Error('Managed summon activity was removed.');return a;}
function currentUses(item){const max=Number(item.system.uses?.max),spent=Number(item.system.uses?.spent??0);if(!Number.isInteger(max)||!Number.isInteger(spent)||max<1||spent<0)throw Error('Invalid item use pool.');return {max,spent};}
function activeEntries(actor,c){return ownedSummons(game.scenes,actor.uuid,c.group);}
function checkScene(actor,scene){if(!canvas.ready||canvas.scene?.id!==scene.id||!actor.isOwner)throw Error('The active scene or actor permissions changed.');}
function profileChoices(activity){return Array.from(activity.availableProfiles??[]);}
function selectOptions(items){return items.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join('');}
function nativeSizes(activity){return Array.from(activity.creatureSizes??[]);}
function dialog(){return foundry.applications.api.DialogV2;}
async function ask(activity,c,actor,scene,s,entries,uses){
  const profiles=profileChoices(activity),sizes=nativeSizes(activity),slots=remainingSlots(s,entries);
  const canSpawn=activity.canUse!==false&&activity.canSummon&&uses.spent<uses.max&&slots>0&&profiles.length&&sizes.length;
  const content=`<div class="coast-forge-dialog coast-forge-summon-manager"><p><strong>${esc(actor.name)}</strong> · ${esc(c.classIdentifier)} ${s.level} · ${entries.filter(e=>e.active).length}/${s.maxActive} active · ${uses.max-uses.spent}/${uses.max} uses</p>
  <p>HP ${s.stats.hp} · AC ${s.stats.ac} · Speed ${s.stats.walk} ft. · Stats are captured when summoned.</p>
  <h3>Active / dismissed-at-0-HP tokens</h3>${entries.length?entries.map((e,i)=>`<label class="coast-forge-summon-existing"><input type="checkbox" name="dismiss" value="${i}"> ${esc(e.token.name)} (${esc(e.scene.name)})${e.active?'':' — 0 HP'}</label>`).join(''):'<p>No tracked units.</p>'}
  ${canSpawn?`<h3>New units (one use total)</h3><p>Choose one or more units; empty rows are ignored. Place each token within the feature's permitted range. This manager does not spend a spell slot or enforce the bonus action.</p>${Array.from({length:slots},(_,i)=>`<fieldset><legend>Unit ${i+1}</legend><div class="form-group"><label>Profile</label><select name="profile${i}">${selectOptions([...(i?[['','— None —']]:[]),...profiles.map(p=>[p._id,p.name])])}</select></div><div class="form-group"><label>Size</label><select name="size${i}">${selectOptions(sizes.map(x=>[x,game.i18n.localize(CONFIG.DND5E.actorSizes[x]?.label??x)]))}</select></div><div class="form-group"><label>Damage type</label><select name="damage${i}">${selectOptions(c.damageTypes.map(x=>[x,game.i18n.localize(CONFIG.DND5E.damageTypes[x]?.label??x)]))}</select></div></fieldset>`).join('')}`:'<p>No new units available: check capacity, remaining uses and native summon permission.</p>'}</div>`;
  const buttons=[];
  if(canSpawn)buttons.push({action:'summon',label:'Place summons',default:true,callback:(_e,b)=>({action:'summon',choices:Array.from({length:slots},(_,i)=>({profile:b.form.elements.namedItem(`profile${i}`)?.value,size:b.form.elements.namedItem(`size${i}`)?.value,damage:b.form.elements.namedItem(`damage${i}`)?.value})).filter(x=>x.profile)})});
  if(entries.length)buttons.push({action:'dismiss',label:'Dismiss selected',callback:(_e,b)=>({action:'dismiss',indices:[...b.form.querySelectorAll('input[name="dismiss"]:checked')].map(e=>Number(e.value))})});
  buttons.push({action:'close',label:'Close',callback:()=>null});
  return dialog().wait({window:{title:`Coast Forge — ${activity.item.name}`,resizable:true},position:{width:520},content,buttons,rejectClose:false});
}
/** Local transaction: sequential native placements; rollback only tokens tagged by this batch. */
export async function executeBatch({choices,getState,place,consume,rollback}){
  if(!choices.length)throw Error('No summons selected.');
  const initial=getState();if(initial.slots<choices.length||initial.spent>=initial.max)throw Error('Not enough summon slots or uses.');
  try{
    for(const choice of choices){const now=getState();if(now.slots<1||now.spent!==initial.spent||now.max!==initial.max)throw Error('Summon limit or uses changed during placement.');
      const created=await place(choice);if(!Array.isArray(created)||created.length!==1)throw Error('Placement canceled or did not create exactly one token.');}
    const final=getState();if(final.spent!==initial.spent||final.max!==initial.max||final.overLimit)throw Error('Summon limit or uses changed.');
    await consume(initial.spent+1);
  }catch(e){try{await rollback();}catch(r){throw Error(`${e.message} Rollback failed: ${r.message}. GM must check tokens and uses manually.`);}throw e;}
}
async function dismissEntries(entries,indices,actor,c){
  const selected=[...new Set(indices)].map(i=>entries[i]).filter(Boolean);if(!selected.length)return;
  const ok=await dialog().confirm({window:{title:'Dismiss Tactical Units'},content:`<p>Delete ${selected.length} selected summoned token(s)? No uses are restored.</p>`,rejectClose:false});if(!ok)return;
  for(const {scene,token} of selected){const current=scene.tokens.get(token.id),f=tokenLink(current);if(f?.owner!==actor.uuid||f?.group!==c.group)throw Error('Summon changed before dismissal.');if(!current.canUserModify(game.user,'delete'))throw Error(`No permission to dismiss ${current.name}. Ask GM.`);}
  for(const {scene,token} of selected)await scene.deleteEmbeddedDocuments('Token',[token.id]);
}
async function run(activity){
  const item=itemFor(activity),actor=item.actor;if(!actor||!actor.isOwner||!item.isOwner)throw Error('Only the actor owner may manage summons.');
  const c=configOf(item);validateAdvancedSummon(c);const key=`${actor.uuid}:${c.group}`;
  if(busy.has(key))throw Error('A summon manager for this actor is already open.');busy.add(key);
  try{
    const scene=canvas.scene;if(!scene||!canvas.ready)throw Error('Open a scene first.');
    const casterTokens=canvas.tokens?.controlled?.filter(t=>t.actor?.uuid===actor.uuid)??[];
    if(casterTokens.length!==1)throw Error('Select exactly one token of the summoning character.');
    const a=actualActivity(item,activity.id),s=snapshot(c,actor),entries=activeEntries(actor,c),uses=currentUses(item);
    const result=await ask(a,c,actor,scene,s,entries,uses);if(!result)return;
    checkScene(actor,scene);
    if(result.action==='dismiss'){await dismissEntries(entries,result.indices,actor,c);return;}
    if(result.action!=='summon'||!a.canSummon||a.canUse===false)throw Error('Native summoning permission required.');
    const batch=foundry.utils.randomID(),owner=actor.uuid;
    // Capture caster stats once, before placing the first token. Never rewrite a world Actor.
    const snap=snapshot(c,actor);
    const getState=()=>{checkScene(actor,scene);const current=activeEntries(actor,c),now=snapshot(c,actor),u=currentUses(item);return {...u,slots:remainingSlots(now,current),overLimit:current.filter(x=>x.active).length>now.maxActive};};
    const rollback=async()=>{const mine=ownedSummons(game.scenes,owner,c.group).filter(e=>tokenLink(e.token)?.batch===batch);for(const {scene:sc,token} of mine)await sc.deleteEmbeddedDocuments('Token',[token.id]);if(ownedSummons(game.scenes,owner,c.group).some(e=>tokenLink(e.token)?.batch===batch))throw Error('Batch tokens remain.');};
    await executeBatch({choices:result.choices,getState,rollback,place:async choice=>{
      checkScene(actor,scene);const current=actualActivity(item,a.id);
      if(!profileChoices(current).some(p=>p._id===choice.profile)||!nativeSizes(current).includes(choice.size)||!c.damageTypes.includes(choice.damage))throw Error('Invalid profile, size or damage selection.');
      const options={profile:choice.profile,creatureSize:choice.size};
      const pending={activityUuid:current.uuid,choice:{...choice,owner,batch},config:c,snap,scene:scene.id,error:null};sessions.set(options,pending);
      try{const tokens=await current.placeSummons(options);if(pending.error)throw pending.error;if(tokens?.some(t=>tokenLink(t)?.batch!==batch)){
        // A missing flag is a compatibility failure; delete only the returned tokens from this scene.
        for(const token of tokens){const parent=token.parent??scene;await parent.deleteEmbeddedDocuments('Token',[token.id]);if(parent.tokens.get(token.id))throw Error('Untracked token remains; GM must remove it manually.');}throw Error('Summon metadata did not persist.');}
        return tokens;
      }finally{sessions.delete(options);}
    },consume:async spent=>{await item.update({'system.uses.spent':spent});if(currentUses(item).spent!==spent)throw Error('Use update was not saved.');}});
    ui.notifications.info(`Coast Forge: ${result.choices.length} summoned, 1 use consumed.`);
    try{await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p><strong>${esc(item.name)}</strong>: ${result.choices.length} unit(s) manifested. 1 use consumed; no spell slot. Remember the feature's Bonus Action and manual duration.</p>`});}catch(e){console.warn('Coast Forge: summon succeeded; chat message failed.',e);}
  }finally{busy.delete(key);}
}
function addManagerButton(app,html){
  const actor=app.document??app.actor;
  if(actor?.documentName!=='Actor'||!actor.isOwner||!actor.items)return;
  const root=html instanceof HTMLElement?html:app.element;
  if(!(root instanceof HTMLElement)||root.querySelector('[data-coast-forge-summon-manager]'))return;
  const activities=asArray(actor.items).filter(i=>configOf(i)).map(i=>{
    const summons=asArray(i.system.activities).filter(a=>managed(a));
    return summons.sort((a,b)=>profileChoices(b).length-profileChoices(a).length)[0];
  }).filter(Boolean);
  if(!activities.length)return;
  const target=root.querySelector('.window-header')??root.querySelector('.window-content')??root;
  const button=document.createElement('button');button.type='button';button.dataset.coastForgeSummonManager='1';button.title='Manage / dismiss Coast Forge summons';button.textContent='Summons';
  button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();try{
    let activity=activities[0];if(activities.length>1){const choice=await dialog().prompt({window:{title:'Choose summon feature'},content:`<select name="group">${selectOptions(activities.map((a,i)=>[String(i),a.item.name]))}</select>`,ok:{label:'Open',callback:(_e,b)=>b.form.elements.namedItem('group').value},rejectClose:false});if(choice===null||choice===undefined)return;activity=activities[Number(choice)];}
    await run(activity);
  }catch(error){notifyError(error);}});
  target.prepend(button);
}
export function registerSummonManager(){
  Hooks.on('renderApplicationV2',addManagerButton);
  // Hooks.call is synchronous. Cancel the ordinary workflow and open the manager asynchronously.
  Hooks.on('dnd5e.preUseActivity',activity=>{if(!managed(activity))return;void run(activity).catch(notifyError);return false;});
  // Prevent a stale chat button from creating free additional managed units.
  Hooks.on('dnd5e.preSummon',(activity,profile,options)=>{if(!managed(activity))return;const p=sessions.get(options);if(!p||p.activityUuid!==activity.uuid||canvas.scene?.id!==p.scene){ui.notifications.warn('Coast Forge: use the managed Summon Activity instead.');return false;}});
  Hooks.on('dnd5e.preSummonToken',(activity,profile,data,options)=>{if(!managed(activity))return;const p=sessions.get(options);if(!p||p.activityUuid!==activity.uuid||canvas.scene?.id!==p.scene)return false;try{applyScaling(p.config,profile,p.choice,p.snap,data);}catch(e){p.error=e;return false;}});
}
export const openSummonManager=activity=>run(activity);
