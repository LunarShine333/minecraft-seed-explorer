import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('home infill streams all sixteen footprints and preserves new native provenance',async()=>{
 const store=new CheckedTileStore(read('data/checked-tiles.json'),async p=>read(p));
 const manifest=read('research/bds/home-east-fill-manifest.json');
 for(const t of manifest.tiles)for(const [x,z] of [[t.x,t.z],[t.x+127,t.z+127]]){
  const cell=await store.cell(x,z,64);assert.ok(cell);assert.equal(cell.source.kind,'observed');assert.match(cell.source.evidence,/home-east-fill/);
 }
 const view=await store.view({minX:768,minZ:-512,maxX:1024,maxZ:512},64);
 assert.equal(view.completed,16);assert.equal(view.failed,0);
 assert.equal(view.bundle.biomes.reduce((n,t)=>n+t.samples.length,0),262144);
 assert.equal(await store.cell(1280,-1025,64),null);
 assert.equal(await store.cell(768,0,103),null);
});
