import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {checkedDestinations,checkedDestination} from '../biome-destinations.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('data/checked-tiles.json');
function fixture(){
 const requests=[];
 const store=new CheckedTileStore(catalog,async p=>{requests.push(p);return read(p)},{fetchRaster:async()=>{throw Error('Discovery must not download images')}});
 return {store,requests};
}
test('atlas discovery lists every unique native witness at selected Y using only the compact index',async()=>{
 const {store,requests}=fixture();
 const names=await checkedDestinations(store,64);
 const expected=[...new Set(read(catalog.overview.path).pages.filter(p=>p.y===64).flatMap(p=>p.witnesses.map(w=>w.name)))].sort();
 assert.deepEqual(names,expected);assert.ok(names.length>5);
 assert.deepEqual(requests,[catalog.overview.path]);
 assert.deepEqual(await checkedDestinations(store,319),[]);assert.equal(requests.length,1);
});
test('Cherry Grove can be found from home without first loading the destination viewport',async()=>{
 const {store,requests}=fixture();
 assert.ok((await checkedDestinations(store,103)).includes('minecraft:cherry_grove'));
 const cell=await checkedDestination(store,'minecraft:cherry_grove',128,24,103);
 assert.equal(cell.name,'minecraft:cherry_grove');assert.equal(cell.y,103);assert.ok(cell.x<-2000);
 assert.equal(cell.source.kind,'observed');assert.equal(requests.length,2);
 assert.equal(await checkedDestination(store,'minecraft:nonexistent',128,24,103),null);assert.equal(requests.length,2);
});
test('every listed destination resolves to the original native biome name',async()=>{
 const {store}=fixture();
 for(const y of [-48,0,64,103,128])for(const name of await checkedDestinations(store,y)){
  const cell=await checkedDestination(store,name,128,24,y);assert.equal(cell.name,name);assert.equal(cell.y,y);
 }
});
test('a mismatching witness fails closed and a failed index fetch can retry',async()=>{
 const {store}=fixture();store.cell=async()=>({name:'minecraft:wrong'});
 await assert.rejects(checkedDestination(store,'minecraft:cherry_grove',128,24,103),/differs/);
 let calls=0;const retry=new CheckedTileStore(catalog,async p=>{if(!calls++)throw Error('offline');return read(p)},{fetchRaster:async()=>null});
 await assert.rejects(checkedDestinations(retry,103),/offline/);assert.ok((await checkedDestinations(retry,103)).length);
});
