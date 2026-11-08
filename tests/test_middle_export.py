import gzip,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/'scripts'))
from import_native_area import export_area_runs
class MiddleExportTests(unittest.TestCase):
 def test_every_export_reproduces_from_native_evidence(self):
  plan=json.loads(Path('research/bds/middle-east-plan.json').read_text())
  archive=json.loads(gzip.decompress(Path('research/bds/middle-east-native-runs.json.gz').read_bytes()))
  outputs,evidence,report=export_area_runs(archive['runs'],plan)
  for path,content in outputs:self.assertEqual(path.read_text(),content,str(path))
  self.assertEqual(gzip.decompress(Path('research/bds/middle-east-native-runs.json.gz').read_bytes()).decode(),evidence)
  self.assertEqual(json.loads(Path('research/bds/middle-east-manifest.json').read_text()),report)
  self.assertEqual(report['addedDistinctHeightCells'],245760)
  self.assertEqual(report['controlCells'],16384)
  self.assertTrue(all(t['y']==64 for t in report['tiles']))
