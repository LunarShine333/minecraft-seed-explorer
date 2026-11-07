import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('wider east native strip streams across tile seams and keeps unsampled edges unknown',async()=>{
 const store=new CheckedTileStore(read('data/checked-tiles.json'),async p=>read(p));
 for(const x of [1792,1919,1920,2047])for(const z of [-1536,-1409,-1408,-513]){
  const cell=await store.cell(x,z,64);assert.ok(cell);assert.equal(cell.source.kind,'observed');assert.match(cell.source.evidence,/wider-east/);
 }
 assert.equal(await store.cell(2048,-1024,64),null);
 assert.equal(await store.cell(1920,-1024,66),null);
 const view=await store.view({minX:1792,minZ:-1536,maxX:2048,maxZ:-512},64);
 assert.equal(view.completed,16);assert.equal(view.failed,0);
 assert.equal(view.bundle.biomes.reduce((n,t)=>n+t.samples.length,0),262144);
});
