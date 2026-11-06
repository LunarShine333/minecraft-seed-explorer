import gzip
import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from import_native_route import parse_native
from import_native_home import export_home


class NativeHomeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = gzip.decompress((ROOT / 'research/bds/home-area-native.log.gz').read_bytes()).decode()
        cls.settings = json.loads((ROOT / 'research/bds/home-area-settings.json').read_text())

    def test_all_home_cells_match_complete_native_evidence(self):
        tiles = parse_native(self.text, self.settings)
        manifest = json.loads((ROOT / 'research/bds/home-area-manifest.json').read_text())
        self.assertEqual(hashlib.sha256(self.text.encode()).hexdigest(), manifest['evidenceSha256'])
        self.assertEqual(len(tiles), 49)
        cells = 0
        for tile in tiles:
            key = f"{tile['y']}_{tile['x']}_{tile['z']}"
            path = 'research/bds/home-area-control.json' if tile['control'] else f'data/tiles/{key}.json'
            actual = json.loads((ROOT / path).read_text())
            self.assertEqual(actual['seed'], '3022187552114785111')
            self.assertIn(manifest['evidenceSha256'], actual['source']['evidence'])
            raster = actual['biomes'][0]
            self.assertEqual(raster['samples'], tile['samples'])
            self.assertEqual([p['name'] for p in raster['palette']], tile['palette'])
            cells += len(tile['samples'])
        self.assertEqual(cells, 802816)

    def test_reexport_reproduces_committed_bundles_and_manifest(self):
        outputs, evidence, manifest = export_home(self.text, self.settings)
        for path, content in outputs:
            self.assertEqual(path.read_text(), content)
        self.assertEqual(json.loads((ROOT / 'research/bds/home-area-manifest.json').read_text()), manifest)
        self.assertEqual(hashlib.sha256(evidence.encode()).hexdigest(), manifest['evidenceSha256'])

    def test_control_mismatch_is_rejected_before_export(self):
        line = next(line for line in self.text.splitlines() if 'MSE_ROUTE_ROW ' in line)
        prefix, raw = line.split('MSE_ROUTE_ROW ', 1)
        row = json.loads(raw)
        row['samples'][0] = (row['samples'][0] + 1) % 5
        changed = prefix+'MSE_ROUTE_ROW '+json.dumps(row, separators=(',', ':'))
        with self.assertRaises(ValueError):
            export_home(self.text.replace(line, changed, 1), self.settings)

    def test_unexpected_complete_footprint_is_rejected(self):
        changed = self.text.replace('"x":256,"z":-256', '"x":9000,"z":-256')
        with self.assertRaisesRegex(ValueError, 'footprint'):
            export_home(changed, self.settings)


if __name__ == '__main__':
    unittest.main()
