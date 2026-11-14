import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCatalog} from '../checked-tiles.mjs';
const original=JSON.parse(readFileSync(new URL('../data/checked-tiles.json',import.meta.url)));
const tile=(id,x,z,y=64,width=128,height=128)=>({id,path:`./data/tiles/${id}.json`,x,z,y,width,height});
const catalog=tiles=>({...original,overview:undefined,tiles});
test('catalog rejects duplicate footprints, partial overlap and negative bucket crossings',()=>{
 for(const [a,b] of [[tile('a',0,0),tile('b',0,0)],[tile('a',-65,-65),tile('b',-1,-1)],[tile('a',127,127),tile('b',128,128)]])assert.throws(()=>validateCatalog(catalog([a,b])),/Overlapping/);
});
test('catalog permits touching edges, disjoint small tiles in one bucket and separate heights',()=>{
 const tiles=[tile('a',-128,0),tile('b',0,0),tile('c',0,128),tile('d',0,0,103),tile('e',256,0,64,16,16),tile('f',272,0,64,16,16)];
 assert.deepEqual(validateCatalog(catalog(tiles)).tiles,tiles);
 assert.equal(validateCatalog(original).tiles.length,620);
});
