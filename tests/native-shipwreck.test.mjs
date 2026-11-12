import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report=read('research/bds/shipwreck-approach-manifest.json'),catalog=read('data/checked-tiles.json');
test('shipwreck extension has exactly twelve directly native tiles adjoining existing coverage',()=>{
 assert.equal(report.tiles.length,12);assert.equal(report.addedDistinctHeightCells,196608);assert.equal(report.controlCells,32768);
 assert.equal(report.runReports.length,2);assert.equal(report.runReports[0].runComplete,false);assert.equal(report.runReports[0].discardedPartialRows,92);
 const expected=new Set();for(let z=-896;z<-384;z+=128)for(let x=-1280;x<-896;x+=128)expected.add(`64_${x}_${z}`);
 assert.deepEqual(new Set(report.tiles.map(t=>t.id)),expected);
 for(const e of report.tiles){const b=validateBundle(read(e.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0);assert.ok(catalog.tiles.some(t=>t.id===e.id))}
});
test('pan across shipwreck joins loads measured biome slices without extending other heights or edges',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(let z=-896;z<=0;z+=64)assert.ok(await store.cell(-1272,z,64));
 assert.ok(await store.cell(-1272,-840,64));
 for(const [x,z] of [[-1281,-840],[-896,-1025],[-1272,-897]])assert.equal(await store.cell(x,z,64),null);
 assert.equal(await store.cell(-1272,-840,103),null);
});
