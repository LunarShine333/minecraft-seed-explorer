import gzip
import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from import_native_route import parse_native


class NativeRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = gzip.decompress((ROOT / 'research/bds/cherry-route-native.log.gz').read_bytes()).decode()
        cls.settings = json.loads((ROOT / 'research/bds/cherry-route-settings.json').read_text())

    def test_every_exported_cell_matches_complete_native_evidence(self):
        tiles = parse_native(self.text, self.settings)
        manifest = json.loads((ROOT / 'research/bds/cherry-route-manifest.json').read_text())
        self.assertEqual(hashlib.sha256(self.text.encode()).hexdigest(), manifest['evidenceSha256'])
        self.assertEqual(len(tiles), 36)
        total = 0
        for tile in tiles:
            key = f"{tile['y']}_{tile['x']}_{tile['z']}"
            path = 'research/bds/cherry-route-control.json' if tile['control'] else f'data/tiles/{key}.json'
            actual = json.loads((ROOT / path).read_text())
            self.assertEqual(actual['seed'], '3022187552114785111')
            self.assertIn(manifest['evidenceSha256'], actual['source']['evidence'])
            raster = actual['biomes'][0]
            self.assertEqual(raster['samples'], tile['samples'])
            self.assertEqual([p['name'] for p in raster['palette']], tile['palette'])
            total += len(tile['samples'])
        self.assertEqual(total, 589824)

    def test_missing_and_duplicate_rows_fail(self):
        row = next(line for line in self.text.splitlines() if 'MSE_ROUTE_ROW ' in line)
        for bad in [self.text.replace(row+'\n', '', 1), self.text+row+'\n']:
            with self.assertRaises(ValueError):
                parse_native(bad, self.settings)

    def test_abort_incomplete_and_wrong_build_fail(self):
        for bad in [self.text+'MSE_ROUTE_ABORT error', self.text.replace('MSE_ROUTE_DONE', ''), self.text.replace('Build ID: 53069370', 'Build ID: 1')]:
            with self.assertRaises(ValueError):
                parse_native(bad, self.settings)

    def test_wrong_seed_or_experiments_fail(self):
        for key, value in [('RandomSeed', 3022187552114785111), ('RandomSeed', '1'), ('experiments', {'saved_with_toggled_experiments': 1})]:
            settings = json.loads(json.dumps(self.settings))
            settings['settings'][key] = value
            with self.assertRaises(ValueError):
                parse_native(self.text, settings)


if __name__ == '__main__':
    unittest.main()
