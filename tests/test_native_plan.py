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
