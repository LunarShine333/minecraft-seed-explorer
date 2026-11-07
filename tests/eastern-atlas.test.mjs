import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('eastern native extension loads through catalog and preserves unknown border and height',async()=>{
 const store=new CheckedTileStore(read('data/checked-tiles.json'),async p=>read(p));
 for(const z of [-1792,-1664,-1537]){
  const cell=await store.cell(1792,z,64);
  assert.ok(cell);assert.equal(cell.source.kind,'observed');
  assert.match(cell.source.evidence,/eastern-candidates/);
 }
 assert.equal(await store.cell(2048,-1024,64),null);
 assert.equal(await store.cell(1792,-1664,103),null);
});
