import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VALIDATED_ENGINES, WORLD_SEED, validateBundle} from '../world-data.mjs';

test('the candidate that disagrees with native wide-area samples stays unapproved', () => {
  const report = JSON.parse(readFileSync(new URL('../research/bds/wide-prediction-26.60-quart.json', import.meta.url)));
  assert.equal(report.checked, 1024);
  assert.equal(report.matched, 929);
  assert.equal(report.mismatches.length, 95);
  assert.equal(report.approvedForMap, false);
  const id = 'cubiomes-bedrock';
  const revision = '294c72ab0392dd818a91d293dbd5774d4874d64b';
  assert.ok(!VALIDATED_ENGINES.some(e => e.id === id && e.revision === revision && e.version === '26.60'));
  assert.throws(() => validateBundle({schemaVersion: 1, edition: 'bedrock', dimension: 'overworld',
    seed: WORLD_SEED, version: '26.60', source: {kind: 'predicted', name: id,
      engineId: id, engineRevision: revision, evidence: 'Candidate failed 95 of 1024 native samples.'},
    structures: [], biomes: []}, {seed: WORLD_SEED, version: '26.60'}), /not passed validation/);
});
