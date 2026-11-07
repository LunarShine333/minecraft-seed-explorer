import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFirst} from '../checked-tiles.mjs';
test('map requests prioritize viewport center without mutating catalog order',()=>{
 const entries=[{id:'edge',x:-512,z:-512,width:128,height:128},{id:'center',x:0,z:0,width:128,height:128},{id:'other',x:128,z:128,width:128,height:128}];
 assert.deepEqual(centerFirst(entries,{minX:-512,minZ:-512,maxX:640,maxZ:640}).map(t=>t.id),['center','other','edge']);
 assert.deepEqual(entries.map(t=>t.id),['edge','center','other']);
 assert.deepEqual(centerFirst(entries,{minX:-512,minZ:-512,maxX:-384,maxZ:-384}).map(t=>t.id),['edge','center','other']);
 assert.deepEqual(centerFirst([],{minX:0,minZ:0,maxX:1,maxZ:1}),[]);
});

import {readFileSync} from 'node:fs';
import {CheckedTileStore,TileRequestPool,visibleTiles} from '../checked-tiles.mjs';
test('detail streaming starts central native tiles first and keeps all visible coverage',async()=>{
 const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
 const catalog=read('data/checked-tiles.json'),calls=[];
 const store=new CheckedTileStore(catalog,async path=>{calls.push(path);return read(path)},{requestPool:new TileRequestPool(1)});
 for(const bounds of [{minX:-256,minZ:-256,maxX:256,maxZ:256},{minX:0,minZ:0,maxX:512,maxZ:512}]){
   store.cache.clear();calls.length=0;
   const expected=centerFirst(visibleTiles(catalog,bounds,64),bounds);
   const result=await store.view(bounds,64);
   assert.deepEqual(calls,expected.map(t=>t.path));
   assert.equal(result.completed,expected.length);assert.equal(result.failed,0);
   assert.equal(result.bundle.biomes.length,expected.length);
 }
});
