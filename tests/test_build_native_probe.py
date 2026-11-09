import copy
import json
from pathlib import Path
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_native_probe import render_probe

class ProbeBuildTests(unittest.TestCase):
    def setUp(self):
        self.plan=json.loads((ROOT/'research/bds/east-gap-plan.json').read_text())
        self.template=(ROOT/'research/bds/east-gap-probe.js').read_text()
    def test_reproduces_native_probe(self):
        self.assertEqual(render_probe(self.plan,self.template),self.template)
    def test_rejects_wrong_identity_duplicates_and_missing_control(self):
        for key,value in [('seed',3022187552114785111),('experiments',True),('id',"bad'")]:
            p=copy.deepcopy(self.plan);p[key]=value
            with self.assertRaises(ValueError):render_probe(p,self.template)
        p=copy.deepcopy(self.plan);p['jobs'].append(p['jobs'][1])
        with self.assertRaises(ValueError):render_probe(p,self.template)
        p=copy.deepcopy(self.plan);p['jobs']=p['jobs'][1:]
        with self.assertRaises(ValueError):render_probe(p,self.template)
