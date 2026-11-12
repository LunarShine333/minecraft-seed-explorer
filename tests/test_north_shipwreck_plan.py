"""Guard the pending acquisition against duplicate collection and probe drift."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_native_probe import render_probe
class NorthShipwreckPlanTests(unittest.TestCase):
    def test_plan_excludes_existing_coverage_and_probe_matches(self):
        plan=json.loads((ROOT/'research/bds/north-shipwreck-infill-plan.json').read_text())
        candidates=json.loads(subprocess.check_output([sys.executable,'scripts/plan-native-extension.py','--bounds','-1280','-1024','-1024','-512','--y','64'],cwd=ROOT,text=True))
        self.assertEqual(candidates['jobs'],[])  # Registered after native validation.
        self.assertEqual(plan['expectedNewCells'],32768)
        self.assertEqual(len(plan['jobs']),3)
        template=(ROOT/'research/bds/east-gap-probe.js').read_text()
        self.assertEqual(render_probe(plan,template),(ROOT/'research/bds/north-shipwreck-infill-probe.js').read_text())
