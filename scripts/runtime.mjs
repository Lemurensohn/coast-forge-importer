/** Runtime modules are optional; importer registration must not depend on them. */
export async function startSummonRuntime({enabled,load=()=>import('./summon-manager.mjs'),report=()=>{}}){
  if(!enabled)return {status:'disabled',manage:null};
  try{
    const engine=await load();
    if(typeof engine.registerSummonManager!=="function"||typeof engine.openSummonManager!=="function")throw Error("Invalid Summon runtime interface.");
    engine.registerSummonManager();
    return {status:'ready',manage:engine.openSummonManager};
  }catch(error){report(error);return {status:'failed',manage:null};}
}
