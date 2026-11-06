"""Exercise release verification through real HTTP responses, without external access."""
import importlib.util
import json
import tempfile
import threading
import unittest
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

spec=importlib.util.spec_from_file_location('release_verifier',Path(__file__).resolve().parents[1]/'scripts/verify-live-release.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

class LiveReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)/'local';self.remote=Path(self.temp.name)/'remote'
        self.root.mkdir();self.remote.mkdir()
        catalog={'seed':'3022187552114785111','tiles':[
            {'y':64,'path':'./data/64.json'},{'y':103,'path':'./data/103.json'},
            {'y':64,'path':'./data/new.json'}]}
        index={'revision':'checked-revision','pages':[
            {'y':64,'path':'./data/64.png'},{'y':103,'path':'./data/103.png'}]}
        files={'index.html':b'homepage','sw.js':b'worker','core.mjs':b'export const seed="3022187552114785111";',
               'data/checked-tiles.json':json.dumps(catalog).encode(),'data/overview/index.json':json.dumps(index).encode(),
               'data/64.json':b'slice64','data/103.json':b'slice103','data/new.json':b'newest',
               'data/64.png':b'png64','data/103.png':b'png103'}
        for directory in [self.root,self.remote]:
            for path,content in files.items():
                p=directory/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(content)
        self.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(self.remote)))
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.base=f'http://127.0.0.1:{self.server.server_port}/'
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.temp.cleanup()
    def test_verified_release_preserves_seed_and_checks_all_heights_and_last_tile(self):
        report=module.verify(self.base,self.root)
        self.assertTrue(report['verified']);self.assertEqual(report['seed'],'3022187552114785111')
        self.assertEqual(len(report['files']),10)
        self.assertTrue(all(r['expectedSha256']==r['receivedSha256'] for r in report['files']))
    def test_stale_missing_truncated_and_extra_bytes_fail_closed(self):
        for path,body in [('sw.js',b'old-worker'),('core.mjs',b''),('data/64.png',b'png64-extra')]:
            (self.remote/path).write_bytes(body)
        (self.remote/'data/new.json').unlink()
        report=module.verify(self.base,self.root)
        self.assertFalse(report['verified'])
        self.assertEqual({r['path'] for r in report['files'] if not r['matches']},
                         {'sw.js','core.mjs','data/64.png','data/new.json'})
        self.assertIn('404',next(r['error'] for r in report['files'] if r['path']=='data/new.json'))
    def test_recovery_requires_no_local_release_change(self):
        p=self.remote/'index.html';p.write_bytes(b'old-page')
        self.assertFalse(module.verify(self.base,self.root)['verified'])
        p.write_bytes((self.root/'index.html').read_bytes())
        self.assertTrue(module.verify(self.base,self.root)['verified'])
