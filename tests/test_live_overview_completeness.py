import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('live',Path(__file__).resolve().parents[1]/'scripts/verify-live-release.py')
live=importlib.util.module_from_spec(spec);spec.loader.exec_module(live)

class LiveOverviewTests(unittest.TestCase):
    def test_missing_second_page_at_same_height_fails_release(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            files={
                'index.html':b'app','sw.js':b'worker',
                'data/tile.json':b'tile','data/first.png':b'first','data/new.png':b'new',
                'data/checked-tiles.json':json.dumps(dict(seed='3022187552114785111',tiles=[dict(y=64,path='./data/tile.json')])).encode(),
                'data/overview/index.json':json.dumps(dict(revision='test',pages=[dict(y=64,path='./data/first.png'),dict(y=64,path='./data/new.png')])).encode()
            }
            for p,data in files.items():
                path=root/p;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            def fetch(url,timeout):
                name=url.removeprefix('https://test/')
                if name=='data/new.png':raise OSError('missing newly added page')
                return io.BytesIO(files[name])
            with patch.object(live,'urlopen',side_effect=fetch):
                report=live.verify('https://test/',root)
            self.assertFalse(report['verified'])
            self.assertTrue(any(f['path']=='data/new.png' and not f['matches'] for f in report['files']))
            with patch.object(live,'urlopen',side_effect=lambda url,timeout:io.BytesIO(files[url.removeprefix('https://test/')])):
                self.assertTrue(live.verify('https://test/',root)['verified'])
