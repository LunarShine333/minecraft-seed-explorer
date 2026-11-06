import gzip
import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from import_native_route import parse_native
from import_native_area import export_area_runs


class NativeAreaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.archive = json.loads(gzip.decompress((ROOT/'research/bds/west-area-native-runs.json.gz').read_bytes()).decode())
        cls.runs = cls.archive['runs']
        cls.plan = json.loads((ROOT/'research/bds/west-area-plan.json').read_text())

    def test_every_exported_cell_matches_native_evidence(self):
        tiles = [t for r in self.runs for t in parse_native(r['log'],r['settings'],allow_partial=True)]
        report = json.loads((ROOT/'research/bds/west-area-manifest.json').read_text())
        self.assertEqual(hashlib.sha256((json.dumps(self.archive,sort_keys=True,separators=(',',':'))+'\n').encode()).hexdigest(), report['evidenceSha256'])
        self.assertEqual(len(tiles), 142)
        total = 0
        for t in tiles:
            key = f"{t['y']}_{t['x']}_{t['z']}"
            path = f'research/bds/west-area-control-{key}.json' if t['control'] else f'data/tiles/{key}.json'
            b = json.loads((ROOT/path).read_text())
            self.assertEqual(b['seed'], '3022187552114785111')
            actual=b['biomes'][0]
            self.assertEqual([actual['palette'][i]['name'] for i in actual['samples']], [t['palette'][i] for i in t['samples']])
            total += len(t['samples'])
        self.assertEqual(total, 2326528)

    def test_plan_reexport_is_reproducible(self):
        outputs, evidence, report = export_area_runs(self.runs, self.plan)
        for path, content in outputs:
            self.assertEqual(path.read_text(), content)
        self.assertEqual(json.loads((ROOT/'research/bds/west-area-manifest.json').read_text()), report)
        self.assertEqual(hashlib.sha256(evidence.encode()).hexdigest(), report['evidenceSha256'])

    def test_wrong_plan_identity_duplicate_jobs_and_footprint_fail(self):
        for mutate in [lambda p: p.update(seed='1'), lambda p: p['jobs'].append(p['jobs'][0]), lambda p: p['jobs'].pop()]:
            plan = json.loads(json.dumps(self.plan))
            mutate(plan)
            with self.assertRaises(ValueError):
                export_area_runs(self.runs, plan)

    def test_overlapping_native_runs_must_agree_on_every_cell(self):
        text = self.runs[0]['log']
        tiles = parse_native(text, self.runs[0]['settings'], allow_partial=True)
        tile = next(t for t in tiles if not t['control'] and len(set(t['palette'])) > 1)
        line = next(s for s in text.splitlines() if 'MSE_ROUTE_ROW ' in s
                    and (lambda r: (r['x'],r['z'],r['y'],r['row']) == (tile['x'],tile['z'],tile['y'],0))(json.loads(s.split('MSE_ROUTE_ROW ',1)[1])))
        prefix, raw = line.split('MSE_ROUTE_ROW ',1)
        row = json.loads(raw)
        old = row['samples'][0]
        row['samples'][0] = next(i for i,n in enumerate(tile['palette']) if n != tile['palette'][old])
        changed = prefix+'MSE_ROUTE_ROW '+json.dumps(row,separators=(',',':'))
        altered = [{**self.runs[0], 'log':text.replace(line,changed,1)}, *self.runs[1:]]
        with self.assertRaisesRegex(ValueError, 'overlapping'):
            export_area_runs(altered,self.plan)

    def test_changed_native_control_and_unsafe_reference_fail(self):
        text=self.runs[0]['log']
        line = next(s for s in text.splitlines() if 'MSE_ROUTE_ROW ' in s)
        prefix, raw = line.split('MSE_ROUTE_ROW ', 1)
        row = json.loads(raw)
        row['samples'][0] = (row['samples'][0]+1) % 5
        altered = prefix+'MSE_ROUTE_ROW '+json.dumps(row, separators=(',', ':'))
        with self.assertRaises(ValueError):
            export_area_runs([{**self.runs[0],'log':text.replace(line,altered,1)},*self.runs[1:]],self.plan)
        plan = json.loads(json.dumps(self.plan))
        plan['jobs'][0]['reference'] = '../outside.json'
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            export_area_runs(self.runs, plan)


if __name__ == '__main__':
    unittest.main()
