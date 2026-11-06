import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report=read('research/bds/south-home-manifest.json'),catalog=read('data/checked-tiles.json');
test('southern extension has exactly eight directly native tiles adjoining existing coverage',()=>{
 assert.equal(report.tiles.length,8);assert.equal(report.addedDistinctHeightCells,131072);assert.equal(report.controlCells,16384);
 assert.equal(report.runReports.length,1);assert.equal(report.runReports[0].runComplete,true);assert.equal(report.runReports[0].discardedPartialRows,0);
 const expected=new Set();for(let x=-256;x<768;x+=128)expected.add(`64_${x}_768`);
 assert.deepEqual(new Set(report.tiles.map(t=>t.id)),expected);
 for(const e of report.tiles){const b=validateBundle(read(e.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0);assert.ok(catalog.tiles.some(t=>t.id===e.id))}
});
test('south row connects home and eastern coverage while the new southern border remains unknown',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(let x=-256;x<1792;x+=64)assert.ok(await store.cell(x,800,64));
 for(let z=24;z<896;z+=32)assert.ok(await store.cell(128,z,64));
 assert.equal(await store.cell(128,896,64),null);
 assert.equal(await store.cell(-257,800,64),null);
 assert.equal(await store.cell(128,800,103),null);
});
