import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareReference} from '../scripts/validate-engine.mjs';
function inputs(){
 const world={seed:'3022187552114785111',version:'26.60',edition:'bedrock',dimension:'overworld',experiments:false};
 const biomes=[{x:-32,y:64,z:0,biome:'minecraft:plains'}];
 return [{...world,schema:'bedrock-game-reference-v1',source:{type:'xbox',evidence:'SYNTHETIC unit test only'},biomes},
 {...world,schema:'bedrock-engine-output-v1',engine:{id:'test-only',revision:'abc'},biomes}];
}
test('matching bounded references never approve the generator',()=>{const r=compareReference(...inputs());assert.equal(r.passed,1);assert.equal(r.approvedForMap,false)});
test('missing point and incorrect Y are mismatches, not successful skips',()=>{const [r,p]=inputs();p.biomes=[{x:-32,y:0,z:0,biome:'minecraft:plains'}];assert.equal(compareReference(r,p).mismatches[0].actual,null)});
test('wrong seed/version, experiments, duplicates and absent evidence fail',()=>{
 for(const patch of [{seed:'3022187552114785112'},{version:'26.50'},{experiments:true}]){const [r,p]=inputs();Object.assign(p,patch);assert.throws(()=>compareReference(r,p))}
 const [r,p]=inputs();r.source.evidence='';assert.throws(()=>compareReference(r,p));
 const [a,b]=inputs();b.biomes=[...b.biomes,...b.biomes];assert.throws(()=>compareReference(a,b));
});
