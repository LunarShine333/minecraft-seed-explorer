import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report=read('research/bds/desert-destination-manifest.json'),catalog=read('data/checked-tiles.json');
test('desert destination has exactly eight directly native tiles adjoining existing coverage',()=>{
 assert.equal(report.tiles.length,8);assert.equal(report.addedDistinctHeightCells,131072);assert.equal(report.controlCells,16384);
 assert.equal(report.runReports.length,1);assert.equal(report.runReports[0].runComplete,true);assert.equal(report.runReports[0].discardedPartialRows,0);
 const expected=new Set();for(const y of [64,66])for(let z=-2048;z<-1792;z+=128)for(let x=3840;x<4096;x+=128)expected.add(`${y}_${x}_${z}`);
 assert.deepEqual(new Set(report.tiles.map(t=>t.id)),expected);
 for(const e of report.tiles){const b=validateBundle(read(e.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0);assert.ok(catalog.tiles.some(t=>t.id===e.id))}
});
test('native desert destination is discoverable and unsampled travel gap remains unknown',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p),{fetchRaster:async()=>null});
 const cell=await store.cell(3936,-1992,66);assert.equal(cell.name,'minecraft:desert');
 for(const [x,z] of [[3839,-1992],[4096,-1992],[3936,-2049],[3936,-1792],[3000,-1500]])assert.equal(await store.cell(x,z,66),null);
 assert.equal(await store.cell(3936,-1992,103),null);
 const {checkedDestinations,checkedDestination}=await import('../biome-destinations.mjs');
 assert.ok((await checkedDestinations(store,66)).includes('minecraft:desert'));
 const sample=await checkedDestination(store,'minecraft:desert',128,24,66);assert.equal(sample.name,'minecraft:desert');assert.equal(sample.y,66);
});
