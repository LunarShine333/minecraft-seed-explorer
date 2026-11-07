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
