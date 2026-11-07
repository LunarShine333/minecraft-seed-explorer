import {world,system} from '@minecraft/server';
// Read-only, bounded lookup in a disposable exact-seed native world.
system.runTimeout(()=>{
 const d=world.getDimension('overworld');
 console.warn('MSE_LOCATOR_START '+JSON.stringify({seed:'3022187552114785111',biome:'minecraft:desert',origin:{x:128,y:64,z:24},bounds:{x:8192,y:384,z:8192}}));
 try{
  const method=typeof d.calculateClosestBiomeFromSeed;
  console.warn('MSE_LOCATOR_API '+method);
  if(method!=='function')throw Error('Stable native biome lookup API unavailable');
  const point=d.calculateClosestBiomeFromSeed({x:128,y:64,z:24},'minecraft:desert',{boundingSize:{x:8192,y:384,z:8192}});
  console.warn('MSE_LOCATOR_RESULT '+JSON.stringify({biome:'minecraft:desert',point:point??null}));
 }catch(e){console.warn('MSE_LOCATOR_ERROR '+String(e));}
 console.warn('MSE_LOCATOR_DONE');
},100);
