import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fetchCheckedJSON,loadCheckedRaster} from '../checked-network.mjs';
import {CheckedTileStore,TileRequestPool} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));

test('JSON loader passes an abort signal and preserves full decimal seed strings',async()=>{
 let signal;
 const result=await fetchCheckedJSON('native.json',{fetch:async(path,options)=>{assert.equal(path,'native.json');signal=options.signal;return new Response('{"seed":"3022187552114785111"}')}});
 assert.equal(result.seed,'3022187552114785111');assert.equal(signal.aborted,false);
 await assert.rejects(fetchCheckedJSON('bad',{fetch:async()=>new Response('missing',{status:404})}),/unavailable/);
 await assert.rejects(fetchCheckedJSON('bad',{fetch:async()=>new Response('{')}),SyntaxError);
});
test('deadlines cover both response headers and body reads, even if a transport ignores abort',async()=>{
 let signal;
 await assert.rejects(fetchCheckedJSON('stalled',{timeoutMs:10,fetch:(_,{signal:s})=>{signal=s;return new Promise(()=>{})}}),/timed out/);
 assert.equal(signal.aborted,true);
 await assert.rejects(fetchCheckedJSON('stalled body',{timeoutMs:10,fetch:async()=>({ok:true,json:()=>new Promise(()=>{})})}),/timed out/);
});
test('raster loader resolves loaded images and clears event handlers',async()=>{
 let image;
 class FakeImage {constructor(){image=this}set src(value){this.path=value;if(value)queueMicrotask(()=>this.onload?.())}}
 const loaded=await loadCheckedRaster('native.png',{Image:FakeImage});
 assert.equal(loaded,image);assert.equal(image.path,'native.png');assert.equal(image.onload,null);assert.equal(image.onerror,null);
});
test('failed and stalled raster requests release their image handlers and download',async()=>{
 class Failed {set src(value){if(value)queueMicrotask(()=>this.onerror?.())}}
 await assert.rejects(loadCheckedRaster('missing',{Image:Failed}),/unavailable/);
 let image;
 class Stalled {constructor(){image=this}set src(value){this.path=value}}
 await assert.rejects(loadCheckedRaster('stalled',{Image:Stalled,timeoutMs:10}),/timed out/);
 assert.equal(image.path,'');assert.equal(image.onload,null);assert.equal(image.onerror,null);
});
test('a timed-out native tile frees the shared request slot and can later retry without discarding cached neighbors',async()=>{
 const catalog=read('data/checked-tiles.json'),entries=catalog.tiles.filter(t=>t.y===64).slice(0,2);
 const pool=new TileRequestPool(1),calls=[];let fail=true;
 const fetchJSON=p=>fetchCheckedJSON(p,{timeoutMs:10,fetch:async()=>{calls.push(p);if(p===entries[0].path&&fail)return new Promise(()=>{});return new Response(JSON.stringify(read(p)))}});
 const store=new CheckedTileStore(catalog,fetchJSON,{requestPool:pool});
 const first=store.tile(entries[0]),second=store.tile(entries[1]);
 await assert.rejects(first,/timed out/);const neighbor=await second;
 assert.equal(store.cache.has(entries[0].id),false);assert.equal(store.cache.get(entries[1].id),neighbor);
 fail=false;await store.tile(entries[0]);await store.tile(entries[1]);
 assert.deepEqual(calls,[entries[0].path,entries[1].path,entries[0].path]);
});

test('raster decoding failures reject and a stalled decode remains bounded',async()=>{
 class Broken {set src(v){if(v)queueMicrotask(()=>this.onload?.())}decode(){return Promise.reject(Error('bad pixels'))}}
 await assert.rejects(loadCheckedRaster('broken',{Image:Broken}),/decoded/);
 let image;
 class Slow {constructor(){image=this}set src(v){this.path=v;if(v)queueMicrotask(()=>this.onload?.())}decode(){return new Promise(()=>{})}}
 await assert.rejects(loadCheckedRaster('slow',{Image:Slow,timeoutMs:10}),/timed out/);
 assert.equal(image.path,'');assert.equal(image.onload,null);
});
