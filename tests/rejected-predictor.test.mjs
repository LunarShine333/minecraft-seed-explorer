import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VALIDATED_ENGINES, WORLD_SEED, validateBundle} from '../world-data.mjs';

test('the candidate that disagrees with native wide-area samples stays unapproved', () => {
  const summary = JSON.parse(readFileSync(new URL('../research/bds/corrected-wide-predictor-summary.json', import.meta.url)));
  const report = summary.results.find(r => r.version === '26.60' && r.lookup === 'quart');
  assert.equal(report.checked, 1024);
  assert.equal(report.matched, 1023);
  assert.equal(report.mismatches, 1);
  assert.equal(report.approvedForMap, false);
  const id = 'cubiomes-bedrock';
  const revision = '294c72ab0392dd818a91d293dbd5774d4874d64b';
  assert.ok(!VALIDATED_ENGINES.some(e => e.id === id && e.revision === revision && e.version === '26.60'));
  assert.throws(() => validateBundle({schemaVersion: 1, edition: 'bedrock', dimension: 'overworld',
    seed: WORLD_SEED, version: '26.60', source: {kind: 'predicted', name: id,
      engineId: id, engineRevision: revision, evidence: 'Corrected candidate still differs at one of 1024 native samples; global accuracy is unvalidated.'},
    structures: [], biomes: []}, {seed: WORLD_SEED, version: '26.60'}), /not passed validation/);
});
