import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderPackPicker, bindPackPicker, selectedPacks} from '../scripts/pack-picker.mjs';
const sources = [{value:'official',label:'D&D 2024 Spells'},{value:'custom',label:'Homebrew Spells'},{value:'features',label:'Class Features'}];
test('old selection and multiple saved selections render as checked boxes',()=>{
  assert.match(renderPackPicker(sources,'official'),/value="official" checked/);
  const html=renderPackPicker(sources,'["official","custom"]');
  assert.match(html,/value="custom" checked/); assert.match(html,/2 ausgewählt/); assert.doesNotMatch(html,/value="features" checked/);
});
test('pack names and values are escaped',()=>{const html=renderPackPicker([{value:'a"b',label:'<b>danger</b>'}],'');assert.match(html,/a&quot;b/);assert.match(html,/&lt;b&gt;danger/);});
function fixture(){
  const rows=sources.map((p,i)=>{const input={value:p.value,checked:i===0};return {textContent:p.label,hidden:false,input,querySelector:()=>input};});
  const search={value:''},clear={},count={},empty={};
  const elements={'.coast-forge-pack-search':search,'.coast-forge-pack-clear':clear,'.coast-forge-pack-count':count,'.coast-forge-pack-empty':empty};
  const picker={querySelector:k=>elements[k],querySelectorAll:()=>rows};
  const root={querySelector:()=>picker};
  const form={querySelectorAll:s=>{assert.equal(s,'input[name="itemPack"]:checked');return rows.map(r=>r.input).filter(i=>i.checked);}};
  bindPackPicker(root);return {rows,search,clear,count,empty,form};
}
test('filter preserves hidden selections and allows independent additional selection',()=>{
  const f=fixture(); f.search.value='homebrew';f.search.oninput();assert.equal(f.rows[0].hidden,true);assert.equal(f.rows[0].input.checked,true);f.rows[1].input.checked=true;f.rows[1].input.onchange();assert.deepEqual(selectedPacks(f.form),['official','custom']);assert.match(f.count.textContent,/2 ausgewählt · 1 von 3 sichtbar/);f.search.value='';f.search.oninput();assert.ok(f.rows.every(r=>!r.hidden));
});
test('clear removes all selections even if filtered out',()=>{const f=fixture();f.search.value='nothing';f.search.oninput();assert.equal(f.empty.hidden,false);f.clear.onclick();assert.deepEqual(selectedPacks(f.form),[]);assert.equal(f.clear.disabled,true);});
test('search Enter does not submit form',()=>{const f=fixture();let prevented=false;f.search.onkeydown({key:'Enter',preventDefault(){prevented=true;}});assert.equal(prevented,true);});
