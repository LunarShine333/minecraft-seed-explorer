import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore,visibleTiles} from '../checked-tiles.mjs';
import {biomeAt,validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const target={seed:WORLD_SEED,version:'26.60'},catalog=read('data/checked-tiles.json');
const report=read('research/bds/cherry-route-manifest.json');
test('fresh native control reproduces all 16384 older stored Y64 reference cells',()=>{
 const control=validateBundle(read('research/bds/cherry-route-control.json'),target),wide=read('data/bedrock-26.60-wide-area.json');
 for(let z=-256;z<-128;z++)for(let x=-256;x<-128;x++)assert.equal(biomeAt(control,x,z,64).name,biomeAt(wide,x,z,64).name);
 assert.equal(report.nativeVersion,'1.26.61.1');assert.equal(report.experiments,false);assert.equal(report.tiles.length,35);
});
test('extended Y103 destination preserves the full old 64x64 Cherry Grove patch',()=>{
 const patch=read('data/bedrock-26.60-cherry-grove.json'),tile=validateBundle(read('data/tiles/103_-2432_-384.json'),target);
 for(let z=-320;z<-256;z++)for(let x=-2368;x<-2304;x++)assert.equal(biomeAt(tile,x,z,103).name,biomeAt(patch,x,z,103).name);
 assert.equal(biomeAt(tile,-2336,-288,103).name,'minecraft:cherry_grove');
 assert.equal(biomeAt(tile,-2433,-384,103),null);assert.equal(biomeAt(tile,-2336,-288,64),null);
 assert.equal(catalog.tiles.some(t=>t.id==='103_-2368_-320'),false);
});
test('native route joins the home-area map continuously at Y64 without filling other regions',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(let x=-2432;x<256;x+=64){
  const b=(await store.view({minX:x,minZ:-250,maxX:x+1,maxZ:-249},64)).bundle;
  assert.ok(biomeAt(b,x,-250,64),`missing route cell at ${x},-250`);
 }
 assert.equal(visibleTiles(store.catalog,{minX:-2433,minZ:-250,maxX:-2432,maxZ:-249},64).length,0);
 assert.equal(visibleTiles(store.catalog,{minX:-1000,minZ:768,maxX:-999,maxZ:769},64).length,0);
 const all=await store.view({minX:-3000,minZ:-3000,maxX:5000,maxZ:3000},64);
 assert.equal(all.failed,0);assert.equal(all.bundle.biomes.length,381);
 assert.equal(all.bundle.biomes.reduce((n,t)=>n+t.samples.length,0),6242304);
});
