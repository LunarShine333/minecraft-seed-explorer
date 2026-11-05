import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLD_SEED, validateBundle, biomeAt, nearestBiome} from '../world-data.mjs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const target = {seed: WORLD_SEED, version: '26.60'};
const local = validateBundle(read('../data/bedrock-26.60-checked-area.json'), target);
const wide = validateBundle(read('../data/bedrock-26.60-wide-area.json'), target);
const references = read('../research/bds/wide-area-api-reference.json');
const cells = bundle => bundle.biomes.reduce((n, tile) => n + tile.samples.length, 0);
const nativeName = name => name === 'minecraft:stone_beach' ? 'minecraft:stony_shore' : name;

test('checked bundles preserve exact world identity and bounded observed coverage', () => {
  for (const bundle of [local, wide]) {
    assert.equal(bundle.seed, '3022187552114785111');
    assert.equal(bundle.version, '26.60');
    assert.equal(bundle.source.kind, 'observed');
    assert.equal(cells(bundle), 262144);
    assert.equal(bundle.structures.length, 36);
  }
  assert.deepEqual(local.biomes.map(t => t.y), [-48, 0, 64, 128]);
  assert.deepEqual(wide.biomes.map(t => [t.x, t.z, t.width, t.height, t.step, t.y]),
    [[-256, -256, 512, 512, 1, 64]]);
});

test('all 1024 native chunk-center biome references match the wider dataset', () => {
  assert.equal(references.length, 1024);
  const coordinates = new Set();
  for (const p of references) {
    assert.equal(p.y, 64);
    assert.equal((p.x + 248) % 16, 0);
    assert.equal((p.z + 248) % 16, 0);
    coordinates.add(`${p.x},${p.z}`);
    assert.equal(biomeAt(wide, p.x, p.z, p.y)?.name, nativeName(p.biome),
      `native biome mismatch at ${p.x},${p.y},${p.z}`);
  }
  assert.equal(coordinates.size, 1024);
});

test('all 65536 overlapping surface cells retain their biome names and colors', () => {
  for (let z = -128; z < 128; z++) for (let x = -128; x < 128; x++) {
    const a = biomeAt(local, x, z, 64), b = biomeAt(wide, x, z, 64);
    assert.equal(a?.name, b?.name, `name changed at ${x},${z}`);
    assert.equal(a?.color, b?.color, `color changed at ${x},${z}`);
  }
});

test('dataset edges and missing heights stay unknown; biome finder stays inside coverage', () => {
  for (const [bundle, min, max, ys] of [[local, -128, 127, [-48, 0, 64, 128]], [wide, -256, 255, [64]]]) {
    for (const y of ys) {
      assert.ok(biomeAt(bundle, min, min, y));
      assert.ok(biomeAt(bundle, max, max, y));
      assert.equal(biomeAt(bundle, min - 1, min, y), null);
      assert.equal(biomeAt(bundle, max + 1, max, y), null);
      const found = nearestBiome(bundle, biomeAt(bundle, min, min, y).name, -10000, -10000, y);
      assert.ok(found.x >= min && found.x <= max && found.z >= min && found.z <= max);
      assert.equal(found.y, y);
    }
  }
  assert.equal(biomeAt(wide, 0, 0, 128), null);
  assert.equal(nearestBiome(wide, 'minecraft:forest', 0, 0, 128), null);
  assert.equal(nearestBiome(wide, 'minecraft:not_a_known_biome', 0, 0, 64), null);
});
