import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore,validateCatalog,visibleTiles} from '../checked-tiles.mjs';
import {validateRasterIndex,visibleRasterPages,checkedBiomeWitness,rasterPageBounds} from '../raster-overview.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=validateCatalog(read('data/checked-tiles.json')),raw=read(catalog.overview.path);
const whole={minX:-3000,minZ:-3000,maxX:5000,maxZ:3000};
const image=async()=>({width:512,height:512});
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('lossless raster index accounts for all checked tiles and preserves seed/height identity',()=>{
 const index=validateRasterIndex(raw,catalog);assert.equal(index.seed,'3022187552114785111');assert.equal(index.pages.length,45);
 assert.equal(index.pages.reduce((n,p)=>n+p.coverage.length,0),324);
 assert.equal(visibleRasterPages(index,whole,64).length,31);
 assert.equal(visibleRasterPages(index,whole,103).length,1);
 assert.equal(visibleRasterPages(index,whole,104).length,0);
});
test('reject stale overviews, wrong worlds, unsafe paths, missing coverage and invented witnesses',()=>{
 for(const mutate of [r=>r.seed='1',r=>r.seed=3022187552114785111,r=>r.revision='0'.repeat(64),r=>r.pages[0].path='https://example.com/map.png',r=>r.pages.pop(),r=>r.pages[0].witnesses[0].x=999999]){
  const r=structuredClone(raw);mutate(r);assert.throws(()=>validateRasterIndex(r,catalog));
 }
});
test('wide view uses one index and 31 raster pages, then exact inspection fetches only one native tile',async()=>{
 const json=[],images=[];
 const store=new CheckedTileStore(catalog,async path=>{json.push(path);return read(path)},{fetchRaster:async path=>{images.push(path);return image()}});
 const result=await store.view(whole,64,{overview:true});
 assert.equal(result.mode,'raster');assert.equal(result.failed,0);assert.equal(result.rasters.length,31);assert.equal(result.bundle.biomes.length,0);
 assert.deepEqual(json,[catalog.overview.path]);assert.equal(images.length,31);
 const cell=await store.cell(128,24,64);assert.ok(cell.name);assert.equal(cell.source.kind,'observed');assert.equal(json.length,2);
 await store.cell(128,24,64);assert.equal(json.length,2);
 assert.equal(await store.cell(-1400,-450,64),null);assert.equal(json.length,2);
 const cherry=await store.view(whole,103,{overview:true});
 const sample=checkedBiomeWitness(cherry.rasters,'minecraft:cherry_grove',128,24,103);
 assert.ok(sample);assert.equal((await store.cell(sample.x,sample.z,103)).name,'minecraft:cherry_grove');
 assert.equal(checkedBiomeWitness(cherry.rasters,'minecraft:not_present',0,0,103),null);
 assert.equal(json.filter(p=>p===catalog.overview.path).length,1);
});
test('missing overview safely falls back to validated native cells',async()=>{
 const store=new CheckedTileStore(catalog,async path=>{if(path===catalog.overview.path)throw Error('offline');return read(path)},{fetchRaster:image});
 const result=await store.view({minX:128,minZ:24,maxX:129,maxZ:25},64,{overview:true});
 assert.equal(result.mode,'detail');assert.equal(result.overviewUnavailable,true);assert.equal(result.bundle.biomes.length,1);assert.equal(result.failed,0);
});
test('cancelled overview views stop new pages and do not publish stale progress',async()=>{
 const aborted=new AbortController();aborted.abort();
 const idle=new CheckedTileStore(catalog,async()=>assert.fail('cancelled index fetch'),{fetchRaster:async()=>assert.fail('cancelled raster fetch')});
 assert.equal((await idle.view(whole,64,{overview:true,signal:aborted.signal})).cancelled,true);
 const release=[],updates=[];
 const store=new CheckedTileStore(catalog,async p=>read(p),{fetchRaster:()=>new Promise(resolve=>release.push(()=>resolve({width:512,height:512})))});
 const controller=new AbortController(),view=store.view(whole,64,{overview:true,signal:controller.signal,onProgress:r=>updates.push(r)});
 await settle();assert.equal(release.length,4);controller.abort();for(const r of release)r();
 const result=await view;assert.equal(result.cancelled,true);assert.equal(release.length,4);assert.equal(updates.length,0);
});
test('wrong image dimensions never enter the raster cache',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p),{fetchRaster:async()=>({width:1,height:1})});
 const result=await store.view(whole,103,{overview:true});assert.equal(result.failed,1);assert.equal(result.rasters.length,0);assert.equal(store.rasterCache.size,0);
});

test('overview page selection stays stable when a pan crosses native tile edges',()=>{
 const a={minX:10,minZ:10,maxX:200,maxZ:100},b={minX:140,minZ:10,maxX:330,maxZ:100};
 assert.notDeepEqual(visibleTiles(catalog,a,64).map(t=>t.id),visibleTiles(catalog,b,64).map(t=>t.id));
 assert.deepEqual(rasterPageBounds(catalog,a,64),rasterPageBounds(catalog,b,64));
});
test('current visible pages remain reusable when they exceed the background image cache',async()=>{
 let fetches=0;
 const store=new CheckedTileStore(catalog,async p=>read(p),{maxRasterCached:2,fetchRaster:async()=>{fetches++;return image()}});
 const first=await store.view(whole,64,{overview:true}),count=first.rasters.length;
 assert.ok(count>2);assert.equal(store.rasterCache.size,2);assert.equal(store.liveRasters.size,count);
 await store.view(whole,64,{overview:true});assert.equal(fetches,count);
 await store.view({minX:128,minZ:24,maxX:129,maxZ:25},64);assert.equal(store.liveRasters.size,0);
});
