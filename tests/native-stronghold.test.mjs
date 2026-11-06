import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report=read('research/bds/stronghold-approach-manifest.json'),catalog=read('data/checked-tiles.json');
test('southern stronghold extension has exactly twenty-four directly native tiles adjoining existing coverage',()=>{
 assert.equal(report.tiles.length,24);assert.equal(report.addedDistinctHeightCells,393216);assert.equal(report.controlCells,16384);
 assert.equal(report.runReports.length,1);assert.equal(report.runReports[0].runComplete,true);assert.equal(report.runReports[0].discardedPartialRows,0);
 const expected=new Set();for(let z=896;z<2432;z+=128)for(let x=512;x<768;x+=128)expected.add(`64_${x}_${z}`);
 assert.deepEqual(new Set(report.tiles.map(t=>t.id)),expected);
 for(const e of report.tiles){const b=validateBundle(read(e.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0);assert.ok(catalog.tiles.some(t=>t.id===e.id))}
});
test('pan south reaches the prior stronghold slice; side and end borders remain unknown',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(let z=24;z<2432;z+=64)assert.ok(await store.cell(658,z,64));
 assert.ok(await store.cell(658,2338,64));
 for(const [x,z] of [[511,2338],[768,2338],[658,2432]])assert.equal(await store.cell(x,z,64),null);
 assert.equal(await store.cell(658,2338,103),null);
});
