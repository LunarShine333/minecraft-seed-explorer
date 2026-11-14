import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore,visibleTiles,validateCatalog,HOME} from '../checked-tiles.mjs';
import {biomeAt} from '../world-data.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const catalog=read('data/checked-tiles.json');
const whole={minX:-3000,minZ:-3000,maxX:5000,maxZ:3000};
const native={64:read('data/bedrock-26.60-wide-area.json'),103:read('data/bedrock-26.60-cherry-grove.json')};
for(const t of read('data/bedrock-26.60-checked-area.json').biomes)if(t.y!==64)native[t.y]={biomes:[t]};
test('the expanded atlas retains every original native cell, palette and provenance',async()=>{
  const store=new CheckedTileStore(catalog,async path=>read(path));
  assert.equal(catalog.tiles.length,620);
  let cells=0;
  for(const entry of store.catalog.tiles){
    const tile=await store.tile(entry);
    assert.equal(tile.source.kind,'observed');assert.match(tile.source.evidence,/1.26.61.1/);
    for(let j=0;j<tile.height;j++)for(let i=0;i<tile.width;i++){
      const got=tile.palette[tile.samples[j*tile.width+i]],expected=biomeAt(native[tile.y],tile.x+i,tile.z+j,tile.y);
      if(expected){assert.equal(got.name,expected.name);assert.equal(got.color,expected.color);cells++;}
    }
  }
  assert.equal(cells,462848);
  assert.deepEqual(HOME,{x:128,z:24,name:'Home property (approximate)'});
});
test('adjoining tile boundaries, negative coordinates and unknown regions',()=>{
  const c=validateCatalog(catalog);
  assert.equal(visibleTiles(c,{minX:-256,minZ:-256,maxX:-128,maxZ:-128},64).length,1);
  assert.equal(visibleTiles(c,{minX:-129,minZ:-256,maxX:-127,maxZ:-128},64).length,2);
  assert.equal(visibleTiles(c,{minX:1152,minZ:896,maxX:1280,maxZ:1024},64).length,0);
  assert.equal(visibleTiles(c,whole,103).length,1);
  assert.equal(visibleTiles(c,whole,104).length,0);
});
test('pan and height changes request only needed tiles; returning uses cache',async()=>{
  const paths=[];const store=new CheckedTileStore(catalog,async path=>{paths.push(path);return read(path)});
  const left={minX:-256,minZ:-256,maxX:-128,maxZ:-128},right={...left,minX:-128,maxX:0};
  assert.equal((await store.view(left,64)).bundle.biomes.length,1);
  assert.equal((await store.view(right,64)).bundle.biomes.length,1);
  await store.view(left,64);assert.equal(paths.length,2);
  assert.equal((await store.view(left,103)).bundle.biomes.length,0);assert.equal(paths.length,2);
  const result=await store.view(whole,103);
  assert.equal(biomeAt(result.bundle,-2336,-288,103).name,'minecraft:cherry_grove');
  assert.equal(biomeAt(result.bundle,0,0,103),null);
});
test('network failures stay unknown and can retry; cache bounds and request deduplication',async()=>{
  let fail=true,calls=0;
  const store=new CheckedTileStore(catalog,async path=>{calls++;if(fail)throw Error('offline');return read(path)},{maxCached:2});
  const first=catalog.tiles[0];const bounds={minX:first.x,minZ:first.z,maxX:first.x+1,maxZ:first.z+1};
  const result=await store.view(bounds,64);assert.equal(result.failed,1);assert.equal(result.bundle.biomes.length,0);
  fail=false;await Promise.all([store.tile(first),store.tile(first)]);assert.equal(calls,2);
  await store.tile(catalog.tiles[1]);await store.tile(catalog.tiles[2]);assert.equal(store.cache.size,2);
  assert.equal(store.cache.has(first.id),false);
});
test('reject swapped world, height, predictions, duplicate identities and unsafe paths',async()=>{
  for(const mutate of [c=>c.seed='3022187552114785112',c=>c.tiles[0].path='https://example.com/tile',c=>c.tiles.push(c.tiles[0])]){
    const c=structuredClone(catalog);mutate(c);assert.throws(()=>validateCatalog(c));
  }
  for(const mutate of [b=>b.biomes[0].y++,b=>b.seed='1',b=>b.source.kind='predicted']){
    const store=new CheckedTileStore(catalog,async path=>{const b=read(path);mutate(b);return b});
    await assert.rejects(store.tile(catalog.tiles[0]));assert.equal(store.cache.size,0);
  }
});
test('concurrent viewport snapshots remain independent even when responses finish out of order',async()=>{
  const releases=new Map();const store=new CheckedTileStore(catalog,path=>new Promise(resolve=>releases.set(path,()=>resolve(read(path)))));
  const a=catalog.tiles[0],b=catalog.tiles[1],bounds=t=>({minX:t.x,minZ:t.z,maxX:t.x+1,maxZ:t.z+1});
  const early=store.view(bounds(a),64),later=store.view(bounds(b),64);
  await new Promise(resolve=>setImmediate(resolve));
  releases.get(b.path)();const result=await later;assert.equal(result.bundle.biomes[0].x,b.x);
  releases.get(a.path)();assert.equal((await early).bundle.biomes[0].x,a.x);
});
