"""Guard the pending acquisition against duplicate collection and probe drift."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_native_probe import render_probe
class NorthWestwardOuternorthreachPlanTests(unittest.TestCase):
    def test_plan_excludes_existing_coverage_and_probe_matches(self):
        plan=json.loads((ROOT/'research/bds/north-westward-northreach-infill-plan.json').read_text())
        candidates=json.loads(subprocess.check_output([sys.executable,'scripts/plan-native-extension.py','--bounds','-6400','-2048','-6144','-1536','--y','64'],cwd=ROOT,text=True))
        self.assertEqual([],candidates['jobs'])
        self.assertEqual(plan['expectedNewCells'],131072)
        self.assertEqual(len(plan['jobs']),9)
        template=(ROOT/'research/bds/east-gap-probe.js').read_text()
        self.assertEqual(render_probe(plan,template),(ROOT/'research/bds/north-westward-northreach-infill-probe.js').read_text())
