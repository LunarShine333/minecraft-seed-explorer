import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('planner',Path(__file__).parents[1]/'scripts/plan-native-extension.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PlanTests(unittest.TestCase):
 def test_overlap_heights_and_negative_edges(self):
  c={'seed':m.SEED,'tiles':[dict(x=-128,z=0,y=64,width=64,height=64)]}
  self.assertEqual(m.missing_jobs(c,-128,0,128,128,64),[dict(x=0,z=0,y=64)])
  self.assertEqual(len(m.missing_jobs(c,-128,0,128,128,103)),2)
 def test_invalid_inputs(self):
  c={'seed':m.SEED,'tiles':[]}
  for bounds in [(1,0,128,128),(0,0,0,128),(0,0,128*4097,128)]:
   with self.assertRaises(ValueError):m.missing_jobs(c,*bounds,64)
  with self.assertRaises(ValueError):m.missing_jobs({'seed':int(m.SEED)},0,0,128,128,64)
  with self.assertRaises(ValueError):m.missing_jobs(c,0,0,128,128,320)
 def test_saved_candidates_reproduce_against_real_atlas(self):
  import json
  root=Path(__file__).parents[1]
  catalog=json.loads((root/'data/checked-tiles.json').read_text())
  saved=json.loads((root/'research/bds/eastern-corridor-candidates.json').read_text())
  baseline={**catalog,'tiles':[t for t in catalog['tiles'] if not (t['x']==1792 and t['z'] in (-1792,-1664) and t['y']==64)]}
  jobs=m.missing_jobs(baseline,1792,-1792,1920,-1536,64)
  self.assertEqual(saved['jobs'],jobs)
  self.assertEqual(saved['candidateCells'],len(jobs)*16384)
  self.assertEqual(len(jobs),2)
  self.assertEqual(m.missing_jobs(catalog,1536,-2048,1792,640,64),[])
  expanded={**catalog,'tiles':catalog['tiles']+[{**job,'width':128,'height':128} for job in jobs]}
  self.assertEqual(m.missing_jobs(expanded,1792,-1792,1920,-1536,64),[])
