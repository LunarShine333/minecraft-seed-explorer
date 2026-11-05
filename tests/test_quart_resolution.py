import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from audit_quart_resolution import audit_tile


class QuartResolutionTests(unittest.TestCase):
    def tile(self, samples):
        return dict(x=-4, z=-8, y=64, width=4, height=4, step=1,
                    palette=[{'name': 'plains'}, {'name': 'forest'}, {'name': 'forest'}],
                    samples=samples)

    def test_uniform_square_has_no_resolution_loss(self):
        report = audit_tile(self.tile([0]*16))
        self.assertEqual(report['minimumErrorsForConstantFourByFourLookup'], 0)
        self.assertEqual(report['mixedSquares'], 0)
        self.assertIsNone(report['firstMixedSquare'])

    def test_majority_bound_uses_names_and_retains_negative_coordinates(self):
        report = audit_tile(self.tile([0]*6+[1]*5+[2]*5))
        self.assertEqual(report['minimumErrorsForConstantFourByFourLookup'], 6)
        self.assertEqual(report['firstMixedSquare']['counts'], {'plains': 6, 'forest': 10})
        self.assertEqual(report['firstMixedSquare']['x'], -4)
        self.assertEqual(report['firstMixedSquare']['z'], -8)

    def test_coarse_unaligned_and_incomplete_rasters_are_rejected(self):
        for changes in [dict(step=2), dict(x=-3), dict(width=3), dict(samples=[0])]:
            tile = self.tile([0]*16)
            tile.update(changes)
            with self.assertRaises(ValueError):
                audit_tile(tile)


if __name__ == '__main__':
    unittest.main()
