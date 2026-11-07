import gzip
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_native_area import export_area_runs
from import_native_route import parse_native

class NativeDesertConnectionTests(unittest.TestCase):
    def test_all_native_readings_and_world_settings_match_exported_cells(self):
        archive=json.loads(gzip.decompress(Path('research/bds/desert-connection-native-runs.json.gz').read_bytes()))
        self.assertGreaterEqual(len(archive['runs']),2)
        count=0
        for run in archive['runs']:
            tiles=parse_native(run['log'],run['settings'],allow_partial=True)
            self.assertEqual(run['settings']['settings']['RandomSeed'],'3022187552114785111')
            for t in tiles:
                key=f"{t['y']}_{t['x']}_{t['z']}"
                path=f'research/bds/desert-connection-control-{key}.json' if t['control'] else f'data/tiles/{key}.json'
                b=json.loads(Path(path).read_text())['biomes'][0]
                self.assertEqual([b['palette'][i]['name'] for i in b['samples']],[t['palette'][i] for i in t['samples']])
                count+=len(t['samples'])
        report=json.loads(Path('research/bds/desert-connection-manifest.json').read_text())
        self.assertEqual(count,report['completeNativeCellReadings'])
        self.assertEqual(count,1212416+len(archive['runs'])*16384)

    def test_archive_reexports_identical_tiles_manifest_and_control(self):
        raw=gzip.decompress(Path('research/bds/desert-connection-native-runs.json.gz').read_bytes()).decode()
        archive=json.loads(raw)
        plan=json.loads(Path('research/bds/desert-connection-plan.json').read_text())
        outputs,evidence,report=export_area_runs(archive['runs'],plan)
        self.assertEqual(evidence,raw)
        self.assertEqual(report,json.loads(Path('research/bds/desert-connection-manifest.json').read_text()))
        for path,content in outputs:self.assertEqual(path.read_text(),content)
