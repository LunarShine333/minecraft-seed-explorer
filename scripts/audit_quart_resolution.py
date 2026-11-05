"""Measure the error floor for any constant, aligned 4x4 biome lookup."""
import json
import sys
from collections import Counter
from pathlib import Path


def audit_tile(tile):
    width, height = tile['width'], tile['height']
    if (tile['step'] != 1 or tile['x'] % 4 or tile['z'] % 4 or
            width <= 0 or height <= 0 or width % 4 or height % 4 or
            len(tile['samples']) != width * height):
        raise ValueError('Expected a complete, aligned block-resolution raster')
    mixed = minimum = 0
    example = None
    for z in range(0, height, 4):
        for x in range(0, width, 4):
            counts = Counter(tile['palette'][tile['samples'][(z+dz)*width+x+dx]]['name']
                             for dz in range(4) for dx in range(4))
            minimum += 16 - max(counts.values())
            if len(counts) > 1:
                mixed += 1
                if example is None:
                    example = dict(x=tile['x']+x, z=tile['z']+z, y=tile['y'], counts=dict(counts))
    return dict(y=tile['y'], fourByFourSquares=width*height//16, mixedSquares=mixed,
                minimumErrorsForConstantFourByFourLookup=minimum, firstMixedSquare=example)


def audit(bundle):
    rows = [audit_tile(tile) for tile in bundle['biomes']]
    return dict(schema='bedrock-quart-resolution-audit-v1',
                checkedCells=sum(len(t['samples']) for t in bundle['biomes']), perHeight=rows,
                minimumErrorsForConstantFourByFourLookup=sum(
                    r['minimumErrorsForConstantFourByFourLookup'] for r in rows),
                limits='Lower bound applies only to an aligned, horizontally constant 4x4 block '
                       'lookup at each selected Y. It does not establish the correct Bedrock '
                       'sampling algorithm or approval for another predictor.')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: audit_quart_resolution.py bundle.json report.json')
    bundle = json.loads(Path(sys.argv[1]).read_text())
    Path(sys.argv[2]).write_text(json.dumps(audit(bundle), indent=2)+'\n')
