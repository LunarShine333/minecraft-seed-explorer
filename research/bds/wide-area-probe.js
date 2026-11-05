import {world,system} from '@minecraft/server';
const groups=[];for(let z=-16;z<16;z+=8)for(let x=-16;x<16;x+=8)groups.push({x,z});
let current=null,ticks=0,changed=0,failures=0;
system.runTimeout(()=>{
 const d=world.getDimension('overworld');
 d.runCommand('tickingarea remove_all');
 const timer=system.runInterval(()=>{
  if(!current){
   const g=groups.shift();if(!g){console.warn('MSE_EXPAND_DONE '+JSON.stringify({changed,failures}));system.clearRun(timer);return}
   current={...g,cells:[]};for(let z=g.z;z<g.z+8;z++)for(let x=g.x;x<g.x+8;x++)current.cells.push({x:x*16+8,z:z*16+8});
   d.runCommand('tickingarea add '+g.x*16+' 0 '+g.z*16+' '+(g.x*16+127)+' 0 '+(g.z*16+127)+' mse_expand true');ticks=0;return;
  }
  ticks++;
  current.cells=current.cells.filter(p=>{
   try{const block=d.getBlock({...p,y:319});if(!block)return true;const original=block.permutation;block.setType('minecraft:barrier');block.setPermutation(original);
    console.warn('MSE_EXPAND_SAMPLE '+JSON.stringify({...p,y:64,biome:d.getBiome({...p,y:64}).id}));changed++;return false;
   }catch{return true}
  });
  if(!current.cells.length||ticks>40){failures+=current.cells.length;console.warn('MSE_EXPAND_GROUP '+JSON.stringify({x:current.x,z:current.z,remaining:current.cells.length}));d.runCommand('tickingarea remove mse_expand');current=null;}
 },10);
},100);
