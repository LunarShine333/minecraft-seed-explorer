import {world,system} from '@minecraft/server';
// Disposable native test world only. Read-only API samples; no block edits.
const jobs=[{"x": -256, "z": -256, "y": 64, "control": true, "reference": "research/bds/home-area-control.json"}, {"x": 768, "z": 384, "y": 64}, {"x": 896, "z": 384, "y": 64}, {"x": 1024, "z": 384, "y": 64}, {"x": 768, "z": 512, "y": 64}, {"x": 896, "z": 512, "y": 64}, {"x": 1024, "z": 512, "y": 64}, {"x": 768, "z": 640, "y": 64}, {"x": 896, "z": 640, "y": 64}, {"x": 1024, "z": 640, "y": 64}, {"x": 768, "z": 768, "y": 64}, {"x": 896, "z": 768, "y": 64}, {"x": 1024, "z": 768, "y": 64}];
let current=null,wait=0;
system.runTimeout(()=>{
 const d=world.getDimension('overworld');
 console.warn('MSE_ROUTE_START '+JSON.stringify({planId:'eastern-temple',seed:'3022187552114785111',jobs:jobs.length,width:128,height:128}));
 const timer=system.runInterval(()=>{
  if(!current){
   const next=jobs.shift();
   if(!next){console.warn('MSE_ROUTE_DONE');system.clearRun(timer);return}
   current={...next,row:0,palette:[],indices:new Map(),ready:false};wait=0;
   try{d.runCommand('tickingarea add '+next.x+' 0 '+next.z+' '+(next.x+127)+' 0 '+(next.z+127)+' mse_route true')}
   catch(e){console.warn('MSE_ROUTE_ABORT '+String(e));system.clearRun(timer)}
   return;
  }
  if(!current.ready){
   try{
    for(let x=current.x+8;x<current.x+128;x+=16)for(let z=current.z+8;z<current.z+128;z+=16)
     if(!d.getBlock({x,y:current.y,z}))throw Error('Chunk pending');
    current.ready=true;
   }catch(e){
    if(++wait>2400){console.warn('MSE_ROUTE_ABORT '+JSON.stringify({...current,indices:undefined,error:String(e)}));system.clearRun(timer)}
    return;
   }
  }
  try{
   for(let batch=0;batch<4&&current.row<128;batch++,current.row++){
    const samples=[];
    for(let col=0;col<128;col++){
     const name=d.getBiome({x:current.x+col,y:current.y,z:current.z+current.row}).id;
     if(!current.indices.has(name)){current.indices.set(name,current.palette.length);current.palette.push(name)}
     samples.push(current.indices.get(name));
    }
    console.warn('MSE_ROUTE_ROW '+JSON.stringify({x:current.x,z:current.z,y:current.y,row:current.row,samples}));
   }
   if(current.row===128){
    console.warn('MSE_ROUTE_TILE '+JSON.stringify({x:current.x,z:current.z,y:current.y,width:128,height:128,control:!!current.control,palette:current.palette}));
    d.runCommand('tickingarea remove mse_route');current=null;
   }
  }catch(e){console.warn('MSE_ROUTE_ABORT '+String(e));system.clearRun(timer)}
 },1);
},100);
