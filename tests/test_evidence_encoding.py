import base64
import gzip
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_native_area import read_evidence
class EncodingTests(unittest.TestCase):
    def test_supported_encodings_preserve_exact_json(self):
        text='{"seed":"3022187552114785111"}'
        with tempfile.TemporaryDirectory() as d:
            for name,data in [('a.json',text.encode()),('a.json.gz',gzip.compress(text.encode())),('a.json.gz.b64',base64.b64encode(gzip.compress(text.encode())))]:
                p=Path(d)/name;p.write_bytes(data)
                self.assertEqual(read_evidence(p),text)
    def test_invalid_base64_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'a.gz.b64';p.write_text('%%%')
            with self.assertRaises(ValueError):read_evidence(p)
