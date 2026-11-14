import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CheckedTileStore} from '../checked-tiles.mjs';
import {biomeAt,validateBundle,WORLD_SEED} from '../world-data.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('data/checked-tiles.json'),manifest=read('research/bds/west-area-manifest.json');
test('west acquisition fills the precise continuous Y64 rectangle and repeats native control',()=>{
 assert.equal(manifest.tiles.length,127);assert.equal(manifest.addedDistinctHeightCells,2080768);assert.equal(manifest.controlCells,49152);
 assert.equal(manifest.seed,'3022187552114785111');assert.equal(manifest.experiments,false);assert.equal(catalog.tiles.length,620);
 const cells=new Set(catalog.tiles.filter(t=>t.y===64).map(t=>`${t.x},${t.z}`));assert.equal(cells.size,603);
 for(let z=-384;z<768;z+=128)for(let x=-2432;x<768;x+=128)assert.ok(cells.has(`${x},${z}`),`missing ${x},${z}`);
 const a=read('research/bds/west-area-control-64_-256_-256.json'),b=read('research/bds/home-area-control.json');
 for(let z=-256;z<-128;z++)for(let x=-256;x<-128;x++)assert.equal(biomeAt(a,x,z,64).name,biomeAt(b,x,z,64).name);
 for(const entry of manifest.tiles){const b=validateBundle(read(entry.path),{seed:WORLD_SEED,version:'26.60'});assert.equal(b.source.kind,'observed');assert.match(b.source.evidence,/1.26.61.1/);assert.equal(b.structures.length,0)}
});
test('new gap cells load native data and all four outside edges remain unknown',async()=>{
 const store=new CheckedTileStore(catalog,async p=>read(p));
 for(const [x,z] of [[-1000,0],[-2000,700],[0,-350],[-2432,-384],[767,767]])assert.ok(await store.cell(x,z,64));
 for(const [x,z] of [[-2433,0],[1280,-1025],[0,-385],[0,896]])assert.equal(await store.cell(x,z,64),null);
 assert.equal(await store.cell(-1000,0,103),null);
 assert.equal((await store.cell(-2336,-288,103)).name,'minecraft:cherry_grove');
});
