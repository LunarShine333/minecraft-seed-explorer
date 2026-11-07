import gzip
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_native_area import export_area_runs
from import_native_route import parse_native

class NativeDesertTests(unittest.TestCase):
    def test_all_native_readings_and_world_settings_match_exported_cells(self):
        archive=json.loads(gzip.decompress(Path('research/bds/desert-destination-native-runs.json.gz').read_bytes()))
        self.assertEqual(len(archive['runs']),1)
        run=archive['runs'][0]
        tiles=parse_native(run['log'],run['settings'])
        self.assertEqual(len(tiles),9)
        self.assertEqual(run['settings']['settings']['RandomSeed'],'3022187552114785111')
        for t in tiles:
            key=f"{t['y']}_{t['x']}_{t['z']}"
            path=f'research/bds/desert-destination-control-{key}.json' if t['control'] else f'data/tiles/{key}.json'
            b=json.loads(Path(path).read_text())['biomes'][0]
            self.assertEqual([b['palette'][i]['name'] for i in b['samples']],[t['palette'][i] for i in t['samples']])
        self.assertEqual(sum(len(t['samples']) for t in tiles),147456)

    def test_archive_reexports_identical_tiles_manifest_and_control(self):
        raw=gzip.decompress(Path('research/bds/desert-destination-native-runs.json.gz').read_bytes()).decode()
        archive=json.loads(raw)
        plan=json.loads(Path('research/bds/desert-destination-plan.json').read_text())
        outputs,evidence,report=export_area_runs(archive['runs'],plan)
        self.assertEqual(evidence,raw)
        self.assertEqual(report,json.loads(Path('research/bds/desert-destination-manifest.json').read_text()))
        for path,content in outputs:self.assertEqual(path.read_text(),content)

    def test_locator_point_is_directly_native_desert_at_exact_height(self):
        manifest=json.loads(Path('research/bds/desert-locator-manifest.json').read_text())
        self.assertEqual(manifest['point'],{'x':3936,'y':66,'z':-1992})
        settings=json.loads(Path('research/bds/desert-locator-settings.json').read_text())['settings']
        self.assertEqual(settings['RandomSeed'],'3022187552114785111')
        self.assertEqual(settings['Generator'],1)
        self.assertEqual(settings['lastOpenedWithVersion'],[1,26,61,1,0])
        self.assertFalse(any(settings['experiments'].values()))
        tile=json.loads(Path('data/tiles/66_3840_-2048.json').read_text())['biomes'][0]
        i=(3936-tile['x'])+(-1992-tile['z'])*tile['width']
        self.assertEqual(tile['palette'][tile['samples'][i]]['name'],'minecraft:desert')
        raw=gzip.decompress(Path('research/bds/desert-locator-native.log.gz').read_bytes())
        import hashlib
        self.assertEqual(hashlib.sha256(raw).hexdigest(),manifest['logSha256'])
        self.assertIn(b'The nearest minecraft:desert is at block 3936, 66, -1992',raw)
