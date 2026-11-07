import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore,TileRequestPool,centerFirst,visibleTiles} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('data/checked-tiles.json'),settle=()=>new Promise(resolve=>setImmediate(resolve));
const bounds=t=>({minX:t.x,minZ:t.z,maxX:t.x+1,maxZ:t.z+1});

test('one shared default pool limits concurrent HTTP loads across views and stores',async()=>{
 let active=0,peak=0;
 const fetchJSON=async path=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return read(path)};
 const stores=[new CheckedTileStore(catalog,fetchJSON),new CheckedTileStore(catalog,fetchJSON)];
 await Promise.all(catalog.tiles.slice(0,12).map((entry,i)=>stores[i%2].tile(entry)));
 assert.equal(peak,4);assert.equal(active,0);
});
test('validated tiles are delivered before the slowest visible request completes',async()=>{
 const release=new Map(),updates=[];
 const store=new CheckedTileStore(catalog,path=>new Promise(resolve=>release.set(path,()=>resolve(read(path)))));
 const [a,b]=catalog.tiles,view=store.view({minX:a.x,minZ:a.z,maxX:b.x+b.width,maxZ:b.z+b.height},64,{onProgress:r=>updates.push(r)});
 await settle();release.get(a.path)();await settle();
 assert.equal(updates.length,1);assert.equal(updates[0].completed,1);assert.equal(updates[0].bundle.biomes.length,1);assert.equal(updates[0].expected,2);
 release.get(b.path)();const result=await view;assert.equal(result.completed,2);assert.equal(result.failed,0);
});
test('cancelled queued work is skipped while a newer view can share a wanted queued tile',async()=>{
 const release=new Map(),calls=[],updates=[];
 const store=new CheckedTileStore(catalog,path=>{calls.push(path);return new Promise(resolve=>release.set(path,()=>resolve(read(path))))},{requestPool:new TileRequestPool(1)});
 const controller=new AbortController();
 const old=store.view({minX:-256,minZ:-256,maxX:256,maxZ:256},64,{signal:controller.signal,onProgress:r=>updates.push(r)});
 await settle();assert.equal(calls.length,1);
 controller.abort();
 const firstPath=calls[0],wanted=centerFirst(visibleTiles(catalog,{minX:-256,minZ:-256,maxX:256,maxZ:256},64),{minX:-256,minZ:-256,maxX:256,maxZ:256})[1],fresh=store.view(bounds(wanted),64);
 release.get(firstPath)();await settle();
 assert.deepEqual(calls,[firstPath,wanted.path]);
 release.get(wanted.path)();
 assert.equal((await fresh).bundle.biomes[0].x,wanted.x);
 const result=await old;assert.equal(result.cancelled,true);assert.equal(updates.length,0);
 assert.equal(calls.length,2);assert.equal(store.pending.size,0);
});
test('already cancelled views do not fetch or report stale progress',async()=>{
 const c=new AbortController();c.abort();let calls=0;
 const store=new CheckedTileStore(catalog,async p=>{calls++;return read(p)});
 const result=await store.view(bounds(catalog.tiles[0]),64,{signal:c.signal,onProgress:()=>assert.fail('stale update')});
 assert.equal(calls,0);assert.equal(result.cancelled,true);assert.equal(result.completed,0);
});
