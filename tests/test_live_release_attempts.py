import unittest
from unittest.mock import patch
from test_live_release import module

class AttemptTests(unittest.TestCase):
 def test_complete_snapshot_required(self):
  reports=[{'verified':False,'files':[{'path':'a','matches':True},{'path':'b','matches':False}]},{'verified':False,'files':[{'path':'a','matches':False},{'path':'b','matches':True}]}]
  with patch.object(module,'verify',side_effect=reports):
   r=module.verify_attempts('url',None,2)
  self.assertFalse(r['verified']);self.assertEqual(r['attempts'],reports)
 def test_stops_after_complete_success(self):
  with patch.object(module,'verify',side_effect=[{'verified':False},{'verified':True}]) as f:
   r=module.verify_attempts('url',None,3)
  self.assertTrue(r['verified']);self.assertEqual(f.call_count,2)
 def test_bounds(self):
  for n in [0,4,True]:
   with self.assertRaises(ValueError):module.verify_attempts('url',None,n)
