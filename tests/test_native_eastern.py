import gzip
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_native_area import export_area_runs
from import_native_route import parse_native

class NativeEasternTempleTests(unittest.TestCase):
    def test_all_native_readings_and_world_settings_match_exported_cells(self):
        archive=json.loads(gzip.decompress(Path('research/bds/eastern-temple-native-runs.json.gz').read_bytes()))
        self.assertEqual(len(archive['runs']),1)
        run=archive['runs'][0]
        tiles=parse_native(run['log'],run['settings'])
        self.assertEqual(len(tiles),13)
        self.assertEqual(run['settings']['settings']['RandomSeed'],'3022187552114785111')
        for t in tiles:
            key=f"{t['y']}_{t['x']}_{t['z']}"
            path=f'research/bds/eastern-temple-control-{key}.json' if t['control'] else f'data/tiles/{key}.json'
            b=json.loads(Path(path).read_text())['biomes'][0]
            self.assertEqual([b['palette'][i]['name'] for i in b['samples']],[t['palette'][i] for i in t['samples']])
        self.assertEqual(sum(len(t['samples']) for t in tiles),212992)

    def test_archive_reexports_identical_tiles_manifest_and_control(self):
        raw=gzip.decompress(Path('research/bds/eastern-temple-native-runs.json.gz').read_bytes()).decode()
        archive=json.loads(raw)
        plan=json.loads(Path('research/bds/eastern-temple-plan.json').read_text())
        outputs,evidence,report=export_area_runs(archive['runs'],plan)
        self.assertEqual(evidence,raw)
        self.assertEqual(report,json.loads(Path('research/bds/eastern-temple-manifest.json').read_text()))
        for path,content in outputs:self.assertEqual(path.read_text(),content)

    def test_footprint_adjoins_home_and_contains_known_temple_slice(self):
        plan=json.loads(Path('research/bds/eastern-temple-plan.json').read_text())
        jobs=[j for j in plan['jobs'] if not j.get('control')]
        self.assertEqual({(j['x'],j['z'],j['y']) for j in jobs},{(x,z,64) for x in range(768,1152,128) for z in range(384,896,128)})
        self.assertTrue(any(j['x']<=872<j['x']+128 and j['z']<=632<j['z']+128 for j in jobs))
