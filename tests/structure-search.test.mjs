import test from 'node:test';
import assert from 'node:assert/strict';
import {findStructures} from '../structure-search.mjs';
const entries=[{type:'village',x:-100,z:0},{type:'trial_chambers',x:10,z:20},{type:'village',x:100,z:0}];
test('landmarks sort around the chosen center without changing source records',()=>{
 const result=findStructures(entries,{x:90,z:0});
 assert.equal(result[0].x,100);assert.equal(result[0].distance,10);
 assert.equal(entries[0].x,-100);assert.equal(entries[0].distance,undefined);
});
test('search matches friendly names and coordinates with type filters',()=>{
 assert.equal(findStructures(entries,{query:'TRIAL chambers'}).length,1);
 assert.equal(findStructures(entries,{query:'-100',type:'village'})[0].x,-100);
 assert.deepEqual(findStructures(entries,{query:'trial',type:'village'}),[]);
});
test('empty results stay empty and nonfinite centers fail',()=>{
 assert.deepEqual(findStructures([]),[]);
 assert.throws(()=>findStructures(entries,{x:Infinity}));
});
