import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('southeast native strip streams across tile seams and keeps unsampled edges unknown',async()=>{
 const store=new CheckedTileStore(read('data/checked-tiles.json'),async p=>read(p));
 for(const x of [1792,1919,1920,2047])for(const z of [-512,-385,-384,511]){
  const cell=await store.cell(x,z,64);assert.ok(cell);assert.equal(cell.source.kind,'observed');assert.match(cell.source.evidence,/southeast/);
 }
 assert.equal(await store.cell(2048,-128,64),null);
 assert.equal(await store.cell(1920,-128,66),null);
 const view=await store.view({minX:1792,minZ:-512,maxX:2048,maxZ:512},64);
 assert.equal(view.completed,16);assert.equal(view.failed,0);
 assert.equal(view.bundle.biomes.reduce((n,t)=>n+t.samples.length,0),262144);
});
