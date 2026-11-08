import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('panning crosses older infill, native gap and eastern tiles without a seam',async()=>{
 const fetched=[];
 const store=new CheckedTileStore(read('data/checked-tiles.json'),async p=>{fetched.push(p);return read(p)});
 for(const x of [1152,1216,1280,1344,1408,1472,1536]){
  const view=await store.view({minX:x,minZ:0,maxX:x+128,maxZ:128},64);
  assert.equal(view.failed,0);
  assert.equal(view.completed,x%128===0?1:2,'all intersecting tiles must load');
  assert.equal(view.bundle.biomes.reduce((n,t)=>n+t.samples.length,0),view.completed*16384);
  for(const edge of [x,x+127]){
   const cell=await store.cell(edge,64,64);
   assert.ok(cell);assert.equal(cell.source.kind,'observed');
  }
 }
 const count=fetched.length;
 await store.view({minX:1280,minZ:0,maxX:1408,maxZ:128},64);
 assert.equal(fetched.length,count,'returning to checked gap reuses cached tiles');
 assert.equal(await store.cell(1280,64,103),null);
});
