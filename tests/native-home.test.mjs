import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore,visibleTiles} from '../checked-tiles.mjs';
import {biomeAt} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('data/checked-tiles.json'),manifest=read('research/bds/home-area-manifest.json');
test('new home extension has the exact native footprint and repeats its independent control',()=>{
 assert.equal(manifest.tiles.length,48);assert.equal(manifest.addedDistinctHeightCells,786432);assert.equal(manifest.experiments,false);
 const a=read('research/bds/home-area-control.json'),b=read('research/bds/cherry-route-control.json');
 for(let z=-256;z<-128;z++)for(let x=-256;x<-128;x++)assert.equal(biomeAt(a,x,z,64).name,biomeAt(b,x,z,64).name);
 assert.equal(catalog.tiles.length,440);
 const indices=new Set(catalog.tiles.filter(t=>t.y===64).map(t=>`${t.x},${t.z}`));
 for(let z=-256;z<768;z+=128)for(let x=-256;x<768;x+=128)assert.ok(indices.has(`${x},${z}`));
});
test('home-area and landmark coordinates load measured cells while outside cells stay unknown',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(const [x,z] of [[128,24],[264,152],[184,712],[760,680],[-256,-256],[767,767]]){
  const result=await store.view({minX:x,minZ:z,maxX:x+1,maxZ:z+1},64);
  assert.equal(result.failed,0);assert.ok(biomeAt(result.bundle,x,z,64));
 }
 assert.equal(visibleTiles(store.catalog,{minX:1792,minZ:767,maxX:1793,maxZ:768},64).length,0);
 assert.equal(visibleTiles(store.catalog,{minX:767,minZ:2432,maxX:768,maxZ:2433},64).length,0);
 const destination=await store.view({minX:-2336,minZ:-288,maxX:-2335,maxZ:-287},103);
 assert.equal(biomeAt(destination.bundle,-2336,-288,103).name,'minecraft:cherry_grove');
});
