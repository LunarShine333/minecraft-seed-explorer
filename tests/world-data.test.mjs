import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SEED, seedString, exactVersion, validateBundle, biomeAt} from '../world-data.mjs';

const target = {seed: WORLD_SEED, version: '26.50'};
function bundle() { return {schemaVersion: 1, edition: 'bedrock', dimension: 'overworld',
  ...target, source: {kind: 'observed', name: 'Test fixture only', evidence: 'Synthetic test, never shipped as world data'},
  structures: [{type: 'village', x: -24, z: 8}],
  biomes: [{x: -32, z: -16, y: 64, width: 2, height: 2, step: 16,
    palette: [{name: 'plains', color: '#88bb44'}, {name: 'ocean', color: '#2266bb'}], samples: [0,1,1,0]}]}; }

test('full signed 64-bit seeds survive round trip with all digits', () => {
  for (const s of [WORLD_SEED, '-9223372036854775808', '9223372036854775807'])
    assert.equal(seedString(JSON.parse(JSON.stringify({seed:s})).seed),s);
  for (const s of [Number(WORLD_SEED), '9223372036854775808', '-9223372036854775809', '1e6'])
    assert.throws(() => seedString(s));
});
test('exact release required; branding prefix accepted without merging patches', () => {
  assert.equal(exactVersion('1.26.50'), '26.50');
  assert.equal(exactVersion('26.50.4'), '26.50.4');
  assert.throws(() => exactVersion('26.x'));
  assert.throws(() => validateBundle(bundle(), {...target, version:'26.50.4'}));
});
test('wrong seed, dimension, edition and unvalidated engines fail closed', () => {
  for (const patch of [{seed:'123'}, {seed:Number(WORLD_SEED)}, {dimension:'nether'}, {edition:'java'},
    {source:{kind:'predicted',name:'Claim',evidence:'A claim',engineId:'anything',engineRevision:'1'}}])
    assert.throws(() => validateBundle({...bundle(),...patch},target));
});
test('registry matches exact engine revision, version, edition and dimension', () => {
  const b = bundle(); b.source = {kind:'predicted',name:'Test',evidence:'Fixture',engineId:'test',engineRevision:'abc'};
  const engine = {id:'test',revision:'abc',version:'26.50',edition:'bedrock',dimension:'overworld'};
  assert.equal(validateBundle(b,target,[engine]).source.kind,'predicted');
  for (const patch of [{revision:'def'},{version:'26.60'},{edition:'java'},{dimension:'nether'}])
    assert.throws(() => validateBundle(b,target,[{...engine,...patch}]));
});
test('negative coordinates, north-first rows and Y selection retain sample identity', () => {
  const b=validateBundle(bundle(),target);
  assert.equal(biomeAt(b,-32,-16,64).name,'plains');
  assert.equal(biomeAt(b,-16,-16,64).name,'ocean');
  assert.equal(biomeAt(b,-32,0,64).name,'ocean');
  assert.equal(biomeAt(b,-24,-8,64),null);
  assert.equal(biomeAt(b,-32,-16,0),null);
});
test('malformed rasters and unbounded coordinates are rejected atomically', () => {
  for (const patch of [{samples:[0]}, {samples:[0,1,2,0]}, {step:0}, {width:999999}, {x:30000000}]) {
    const b=bundle(); Object.assign(b.biomes[0],patch); assert.throws(()=>validateBundle(b,target));
  }
  const b=bundle(); b.structures[0].x=NaN; assert.throws(()=>validateBundle(b,target));
});
