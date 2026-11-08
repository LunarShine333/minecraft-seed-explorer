"""Acquisition preparation only; these tests provide no native readings."""
import importlib.util
import json
from pathlib import Path
import re
import unittest
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('planner', ROOT/'scripts/plan-native-extension.py')
planner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(planner)

class EastGapPlanTests(unittest.TestCase):
    def test_probe_exactly_matches_nonoverlapping_plan_and_control(self):
        plan = json.loads((ROOT/'research/bds/east-gap-plan.json').read_text())
        catalog = json.loads((ROOT/'data/checked-tiles.json').read_text())
        probe = (ROOT/'research/bds/east-gap-probe.js').read_text()
        jobs = json.loads(re.search(r'const jobs=(.*?);',probe).group(1))
        self.assertEqual(jobs,plan['jobs'])
        self.assertEqual(plan['seed'],'3022187552114785111')
        self.assertIn("seed:'3022187552114785111'",probe)
        self.assertIn("planId:'east-gap'",probe)
        self.assertEqual(plan['version'],'26.60')
        self.assertEqual(plan['sourceVersion'],'1.26.61.1')
        self.assertIs(plan['experiments'],False)
        self.assertEqual(jobs[0],dict(x=-256,z=-256,y=64,control=True,reference='research/bds/home-area-control.json'))
        expected = planner.missing_jobs(catalog,1280,-512,1536,512,64)
        self.assertEqual(jobs[1:],expected)
        self.assertEqual(len(expected),16)
        self.assertEqual(plan['expectedNewCells'],len(expected)*16384)
        simulated = dict(catalog,tiles=catalog['tiles']+[dict(j,width=128,height=128) for j in expected])
        self.assertEqual(planner.missing_jobs(simulated,1280,-512,1536,512,64),[])
