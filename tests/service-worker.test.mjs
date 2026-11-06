import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const base='https://example.test/minecraft-seed-explorer/';
const DATA='minecraft-seed-explorer-checked-data-v1',CURRENT='minecraft-seed-explorer-v16-preserve-checked-data';
const tile=base+'data/tiles/64_-1024_0.json',png=base+'data/overview/64_-1536_0-2d0b48ab5334063d.png';
function harness(){
  const stores=new Map(),handlers={},calls=[];let network=async()=>new Response('online'),storageFails=false,claimed=false;
  const caches={async open(name){
    if(storageFails)throw Error('storage unavailable');
    if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);
    return {async match(req){return data.get(typeof req==='string'?req:req.url)?.clone()},async put(req,res){if(storageFails)throw Error('quota');data.set(typeof req==='string'?req:req.url,res.clone())},async keys(){return [...data.keys()].map(url=>new Request(url))},async addAll(){}};
  },async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)}};
  vm.runInNewContext(source,{URL,Response,caches,fetch:async req=>{calls.push(req.url);return network(req)},self:{registration:{scope:base},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true}}}});
  return {stores,calls,caches,setNetwork(fn){network=fn},failStorage(){storageFails=true},get claimed(){return claimed},async seed(name,url,body){await (await caches.open(name)).put(new Request(url),new Response(body))},async activate(){let job;handlers.activate({waitUntil:p=>job=p});await job},async request(url,method='GET'){
    const lifetimes=[];let result,dispatching=true;
    handlers.fetch({request:new Request(url,{method}),respondWith:p=>result=p,waitUntil:p=>{assert.ok(dispatching,'waitUntil must be registered during dispatch');lifetimes.push(p)}});dispatching=false;
    if(!result)return null;const response=await result;await Promise.all(lifetimes);return response;
  }};
}
test('update migrates checked cells and revision PNGs, discards old shells only',async()=>{
  const h=harness(),old='minecraft-seed-explorer-v15-native-west-rectangle';
  await h.seed(old,tile,'native');await h.seed(old,png,'pixels');await h.seed(old,base+'index.html','old shell');
  await h.seed('other-site-cache',base+'unrelated','keep');
  await h.activate();assert.equal(h.claimed,true);assert.equal(h.stores.has(old),false);assert.equal(h.stores.has('other-site-cache'),true);
  assert.deepEqual([...h.stores.get(DATA).keys()].sort(),[tile,png].sort());
  h.setNetwork(async()=>{throw Error('offline')});
  assert.equal(await (await h.request(tile)).text(),'native');assert.equal(await (await h.request(png)).text(),'pixels');
  assert.equal((await h.request(base+'data/tiles/64_999_999.json')).status,503);
});
test('revision images reuse stored bytes without network; native JSON revalidates',async()=>{
  const h=harness();await h.seed(DATA,png,'pixels');await h.seed(DATA,tile,'old');
  assert.equal(await (await h.request(png)).text(),'pixels');assert.equal(h.calls.length,0);
  h.setNetwork(async()=>new Response('corrected native'));
  assert.equal(await (await h.request(tile)).text(),'corrected native');assert.equal(h.calls.length,1);
  h.setNetwork(async()=>{throw Error('offline')});assert.equal(await (await h.request(tile)).text(),'corrected native');
});
test('server failures use cached data without replacing it with an error',async()=>{
  const h=harness();await h.seed(DATA,tile,'native');h.setNetwork(async()=>new Response('error',{status:503}));
  assert.equal(await (await h.request(tile)).text(),'native');assert.equal(await h.stores.get(DATA).get(tile).text(),'native');
  assert.equal((await h.request(base+'data/tiles/64_999_999.json')).status,503);
});
test('metadata stays network first and in the current shell cache',async()=>{
  const h=harness(),url=base+'data/checked-tiles.json';await h.seed(CURRENT,url,'prior catalog');h.setNetwork(async()=>new Response('new catalog'));
  assert.equal(await (await h.request(url)).text(),'new catalog');assert.equal(h.stores.get(DATA)?.has(url)??false,false);
  h.setNetwork(async()=>{throw Error('offline')});assert.equal(await (await h.request(url)).text(),'new catalog');
});
test('storage failure does not block a successful online response',async()=>{
  const h=harness();h.failStorage();assert.equal(await (await h.request(tile)).text(),'online');
});
test('scope and method boundaries are respected during fetch and migration',async()=>{
  const h=harness();assert.equal(await h.request('https://other.test/data/tiles/a.json'),null);assert.equal(await h.request('https://example.test/other/data/tiles/a.json'),null);assert.equal(await h.request(tile,'POST'),null);
  await h.seed('minecraft-seed-explorer-old','https://other.test/data/tiles/a.json','unrelated');await h.seed('minecraft-seed-explorer-old',base+'data/overview/index.json','stale metadata');await h.activate();assert.equal(h.stores.get(DATA).size,0);
});
test('migration does not overwrite an existing newer data response',async()=>{
  const h=harness();await h.seed(DATA,tile,'current');await h.seed('minecraft-seed-explorer-old',tile,'old');await h.activate();assert.equal(await h.stores.get(DATA).get(tile).text(),'current');
});
test('failed migration retains the old cache for recovery',async()=>{
  const h=harness(),old='minecraft-seed-explorer-old';await h.seed(old,tile,'native');h.failStorage();await assert.rejects(h.activate(),/storage unavailable/);assert.equal(h.stores.has(old),true);assert.equal(h.claimed,false);
});
