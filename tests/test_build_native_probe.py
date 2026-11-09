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

    def test_changed_plan_updates_jobs_and_identity_without_mutating_inputs(self):
        p=copy.deepcopy(self.plan)
        p['id']='north-gap'
        p['jobs']=[p['jobs'][0],dict(x=1280,z=-640,y=64)]
        before=copy.deepcopy(p)
        rendered=render_probe(p,self.template)
        import re
        jobs=json.loads(re.search(r'^const jobs=(.*);$',rendered,re.M).group(1))
        self.assertEqual(jobs,p['jobs'])
        self.assertIn("planId:'north-gap'",rendered)
        self.assertNotIn("planId:'east-gap'",rendered)
        self.assertEqual(p,before)
        # Sampling implementation after its startup marker stays identical.
        self.assertEqual(rendered.split('const timer=')[1],self.template.split('const timer=')[1])

    def test_coordinate_validation_and_unknown_template(self):
        for key,value in [('x',True),('z',0.5),('y',320)]:
            p=copy.deepcopy(self.plan);p['jobs'][1][key]=value
            with self.assertRaises(ValueError):render_probe(p,self.template)
        with self.assertRaises(ValueError):render_probe(self.plan,'const jobs=[];')
