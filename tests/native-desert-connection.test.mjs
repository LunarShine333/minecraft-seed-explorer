import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report=read('research/bds/desert-connection-manifest.json'),catalog=read('data/checked-tiles.json');
test('desert connection has exactly seventy-four directly native tiles adjoining existing coverage',()=>{
 assert.equal(report.tiles.length,74);assert.equal(report.addedDistinctHeightCells,1212416);assert.equal(report.controlCells,16384*report.runReports.length);
 assert.ok(report.runReports.length>=2);assert.equal(report.runReports[0].runComplete,false);assert.equal(report.runReports[0].discardedPartialRows,68);assert.equal(report.runReports.at(-1).runComplete,true);
 const expected=new Set();for(let z=-2048;z<640;z+=128)for(let x=1536;x<1792;x+=128)expected.add(`64_${x}_${z}`);for(let z=-2048;z<-1792;z+=128)for(let x=1792;x<3840;x+=128)expected.add(`64_${x}_${z}`);
 assert.deepEqual(new Set(report.tiles.map(t=>t.id)),expected);
 for(const e of report.tiles){const b=validateBundle(read(e.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0);assert.ok(catalog.tiles.some(t=>t.id===e.id))}
});
test('continuous checked biome path joins home, outpost and desert without filling the surrounding gaps',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(let x=128;x<=1664;x+=64)assert.ok(await store.cell(x,728,64));
 for(let z=728;z>=-1920;z-=64)assert.ok(await store.cell(1664,z,64));
 for(let x=1664;x<4096;x+=64)assert.ok(await store.cell(x,-1920,64));
 assert.ok(await store.cell(3936,-1992,64));
 for(const [x,z] of [[255,-1000],[2048,-1000],[3000,-1792],[3000,-2049],[4096,-1920]])assert.equal(await store.cell(x,z,64),null);
 assert.equal(await store.cell(1664,-1000,66),null);
});
