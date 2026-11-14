"""Validate actual native evidence; atlas publication is a separate step."""
import base64
import gzip
import json
from pathlib import Path
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from import_native_area import export_area_runs

class NorthWestwardBridgeEvidenceTests(unittest.TestCase):
    def test_complete_native_evidence_reproduces_exports(self):
        raw=base64.b64decode((ROOT/'research/bds/north-westward-bridge-infill-native-runs.json.gz.b64').read_text(),validate=True)
        archive=json.loads(gzip.decompress(raw))
        plan=json.loads((ROOT/'research/bds/north-westward-bridge-infill-plan.json').read_text())
        outputs,evidence,report=export_area_runs(archive['runs'],plan)
        self.assertEqual(report['addedDistinctHeightCells'],131072)
        self.assertEqual(report['controlCells'],16384)
        self.assertEqual(len(report['tiles']),8)
        self.assertEqual(json.loads(evidence),archive)
        self.assertEqual(export_area_runs(archive['runs'],plan),(outputs,evidence,report))
        for path, text in outputs:
            self.assertEqual((ROOT/path).read_bytes(),text.encode('utf-8'))
        self.assertEqual(plan['seed'],'3022187552114785111')
        # A settings mismatch must prevent exports, even with complete records.
        bad=json.loads(json.dumps(archive['runs']))
        bad[0]['settings']['settings']['RandomSeed']='3022187552114785112'
        with self.assertRaises(ValueError):
            export_area_runs(bad,plan)
