import {world,system} from '@minecraft/server';
system.runTimeout(()=>{const d=world.getDimension('overworld');
try{d.runCommand('tickingarea add circle 0 64 0 2 probe true')}catch(e){console.warn('PROBE_LOAD '+e)}
system.runTimeout(()=>{let ok=0,fail=0;
for(const y of [-48,0,64,128])for(let z=-16;z<=16;z+=16)for(let x=-16;x<=16;x+=16){
try{const biome=d.getBiome({x,y,z});console.warn('MSE_BIOME '+JSON.stringify({x,y,z,biome:biome.id}));ok++}catch(e){console.warn('MSE_FAIL '+JSON.stringify({x,y,z,error:String(e)}));fail++}}
console.warn('MSE_DONE '+JSON.stringify({ok,fail}));},200);
},100);
