import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from export_stored_biomes import raster


class StoredExportTests(unittest.TestCase):
    def test_negative_chunks_north_first_and_y_layout(self):
        calls = []
        def read(cx, cz):
            calls.append((cx, cz))
            return [[(cx * 16 + x) * 10000 + (cz * 16 + z) * 100 + y
                     for x in range(16) for z in range(16) for y in range(16)]] * 24
        values = [-1 * 10000 - 100 + 15, -100 + 15, -10000 + 15, 15]
        palette = {str(v): {'name': str(v), 'color': '#112233'} for v in values}
        tile = raster(read, palette, -1, -1, 2, 2, 1, [-49])[0]
        actual = [tile['palette'][i]['name'] for i in tile['samples']]
        self.assertEqual(actual, list(map(str, values)))
        self.assertEqual(set(calls), {(-1, -1), (0, -1), (-1, 0), (0, 0)})

    def test_unknown_ids_and_missing_chunks_fail(self):
        with self.assertRaisesRegex(ValueError, 'Unknown biome ID'):
            raster(lambda x, z: [[999] * 4096] * 24, {}, 0, 0, 1, 1, 1, [64])
        def missing(x, z):
            raise KeyError('missing')
        with self.assertRaises(KeyError):
            raster(missing, {}, 0, 0, 1, 1, 1, [64])

    def test_limits_and_heights(self):
        for ys in [[320], [-65], [0, 0], []]:
            with self.assertRaises(ValueError):
                raster(None, {}, 0, 0, 1, 1, 1, ys)
        with self.assertRaises(ValueError):
            raster(None, {}, 0, 0, 512, 512, 1, [0, 64])


if __name__ == '__main__':
    unittest.main()
