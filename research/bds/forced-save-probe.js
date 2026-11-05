import {world,system} from '@minecraft/server';
system.runTimeout(()=>{const d=world.getDimension('overworld');
try{d.runCommand('tickingarea add -32 -64 -32 31 319 31 full_reference true')}catch(e){console.warn('PROBE_LOAD '+e)}
system.runTimeout(()=>{let ok=0,fail=0;
for(let cx=-2;cx<2;cx++)for(let cz=-2;cz<2;cz++){try{const b=d.getBlock({x:cx*16,y:319,z:cz*16});const original=b.permutation;b.setType('minecraft:barrier');b.setPermutation(original);console.warn('MSE_DIRTY '+cx+','+cz)}catch(e){console.warn('MSE_DIRTY_FAIL '+e)}}
for(const y of [-48,0,64,128])for(const z of [-31,-17,-16,-15,-5,-4,-3,-1,0,1,3,4,5,15,16,17,31])for(const x of [-31,-17,-16,-15,-5,-4,-3,-1,0,1,3,4,5,15,16,17,31]){
try{const block=d.getBlock({x,y,z});if(!block)throw Error('Chunk not loaded');const biome=d.getBiome({x,y,z});console.warn('MSE_STORED_BIOME '+JSON.stringify({x,y,z,biome:biome.id}));ok++}catch(e){console.warn('MSE_FAIL '+JSON.stringify({x,y,z,error:String(e)}));fail++}}
console.warn('MSE_DONE '+JSON.stringify({ok,fail}));},400);
},100);
