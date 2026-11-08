import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('planner', Path(__file__).resolve().parents[1] / 'scripts/plan-native-extension.py')
planner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(planner)

class CatalogValidationTests(unittest.TestCase):
    def test_bad_footprints_never_become_new_collection_jobs(self):
        tile = dict(x=0, z=0, y=64, width=128, height=128)
        for key, value in [('width', 0), ('height', -128), ('x', True), ('z', 0.5), ('y', 320)]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                planner.missing_jobs(dict(seed=planner.SEED, tiles=[dict(tile, **{key:value})]), 0, 0, 128, 128, 64)
    def test_missing_tile_list_rejected(self):
        with self.assertRaises(ValueError):
            planner.missing_jobs(dict(seed=planner.SEED), 0, 0, 128, 128, 64)
