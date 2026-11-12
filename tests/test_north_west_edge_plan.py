"""Guard the pending acquisition against duplicate collection and probe drift."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_native_probe import render_probe
class NorthWestEdgePlanTests(unittest.TestCase):
    def test_plan_excludes_existing_coverage_and_probe_matches(self):
        plan=json.loads((ROOT/'research/bds/north-west-edge-infill-plan.json').read_text())
        candidates=json.loads(subprocess.check_output([sys.executable,'scripts/plan-native-extension.py','--bounds','-1024','-1024','-768','-512','--y','64'],cwd=ROOT,text=True))
        self.assertEqual(plan['jobs'][1:],candidates['jobs'])
        self.assertEqual(plan['expectedNewCells'],81920)
        self.assertEqual(len(plan['jobs']),6)
        template=(ROOT/'research/bds/east-gap-probe.js').read_text()
        self.assertEqual(render_probe(plan,template),(ROOT/'research/bds/north-west-edge-infill-probe.js').read_text())
