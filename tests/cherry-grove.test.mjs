import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateBundle,biomeAt,nearestBiome,WORLD_SEED} from '../world-data.mjs';
const raw=JSON.parse(readFileSync(new URL('../data/bedrock-26.60-cherry-grove.json',import.meta.url),'utf8'));
test('native Cherry Grove point and sampled patch preserve exact coverage',()=>{
 const b=validateBundle(raw,{seed:WORLD_SEED,version:'26.60'});
 assert.equal(b.biomes[0].samples.length,4096);
 assert.equal(biomeAt(b,-2336,-288,103).name,'minecraft:cherry_grove');
 assert.equal(nearestBiome(b,'minecraft:cherry_grove',-2336,-288,103).distance,0);
 assert.equal(biomeAt(b,-2369,-320,103),null);
 assert.equal(biomeAt(b,-2304,-257,103),null);
 assert.equal(biomeAt(b,-2336,-288,64),null);
 assert.equal(b.biomes[0].samples.filter(i=>b.biomes[0].palette[i].name==='minecraft:cherry_grove').length,1667);
});
