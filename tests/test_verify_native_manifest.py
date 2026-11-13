import importlib.util
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('manifest_verify',Path(__file__).resolve().parents[1]/'scripts/verify-native-manifest.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ManifestVerificationTests(unittest.TestCase):
    def test_all_tiles_and_corruption(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            for name in ['a','b']: (root/name).write_bytes(name.encode())
            manifest={'tiles':[{'path':'a'},{'path':'b'}]}
            seen=[]
            def fetch(p): seen.append(p);return p.encode()
            self.assertTrue(m.verify(root,manifest,'unused',fetch)['verified'])
            self.assertCountEqual(seen,['a','b'])
            self.assertFalse(m.verify(root,manifest,'unused',lambda p:b'corrupt')['verified'])
            def failure(p): raise OSError('offline')
            self.assertFalse(m.verify(root,manifest,'unused',failure)['verified'])
    def test_rejects_escaping_duplicate_and_empty_paths(self):
        for tiles in [[{'path':'../outside'}],[{'path':'a'},{'path':'a'}],[]]:
            with self.assertRaises(ValueError): m.verify('.',{'tiles':tiles},'unused')

    def test_missing_local_tile_returns_failed_report(self):
        with tempfile.TemporaryDirectory() as d:
            report=m.verify(d,{'tiles':[{'path':'missing'}]},'unused',lambda p:b'')
            self.assertFalse(report['verified'])
            self.assertIn('error',report['files'][0])
