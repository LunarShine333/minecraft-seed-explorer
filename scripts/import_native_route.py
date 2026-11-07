"""Validate a complete read-only BDS route probe and export observed 128-block tiles.

Uses native API names, never candidate climate predictions. All rows and world
settings must pass before any output is written. Run from the repository root.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

SEED = '3022187552114785111'
VERSION = '1.26.61.1'
BUILD = '53069370'
ALIAS = {'minecraft:stone_beach': 'minecraft:stony_shore'}


def parse_native(text, settings, *, allow_partial=False):
    # Partial mode returns only tiles with a real native completion record and
    # all 128 rows; callers must retain each run's incomplete status.
    allow_partial = allow_partial and text.count('MSE_ROUTE_DONE') == 0
    world = settings.get('settings', {})
    if world.get('RandomSeed') != SEED or world.get('Generator') != 1:
        raise ValueError('Wrong native seed or world generator')
    experiments = world.get('experiments')
    if not isinstance(experiments, dict) or not experiments or any(experiments.values()):
        raise ValueError('Experiments must be explicitly off')
    if world.get('lastOpenedWithVersion') != [1, 26, 61, 1, 0]:
        raise ValueError('Unexpected native world version')
    if f'Version: {VERSION}' not in text or f'Build ID: {BUILD}' not in text:
        raise ValueError('Native startup version/build evidence missing')
    if 'MSE_ROUTE_ABORT' in text or text.count('MSE_ROUTE_DONE') > 1 or (not allow_partial and text.count('MSE_ROUTE_DONE') != 1):
        raise ValueError('Incomplete or aborted native run')
    starts, rows, tiles = [], {}, {}
    for line in text.splitlines():
        for marker in ['MSE_ROUTE_START ', 'MSE_ROUTE_ROW ', 'MSE_ROUTE_TILE ']:
            if marker not in line:
                continue
            item = json.loads(line.split(marker, 1)[1])
            if marker == 'MSE_ROUTE_START ':
                starts.append(item)
                continue
            key = (item['x'], item['z'], item['y'])
            if not all(type(n) is int for n in key) or any(abs(n) > 30000000 for n in key):
                raise ValueError('Invalid native coordinate')
            if marker == 'MSE_ROUTE_ROW ':
                row = item['row']
                if type(row) is not int or not 0 <= row < 128:
                    raise ValueError('Invalid native row')
                samples = item['samples']
                if len(samples) != 128 or any(type(n) is not int or n < 0 for n in samples):
                    raise ValueError('Invalid native row samples')
                group = rows.setdefault(key, {})
                if row in group:
                    raise ValueError('Duplicate native row')
                group[row] = samples
            else:
                if key in tiles or item.get('width') != 128 or item.get('height') != 128:
                    raise ValueError('Invalid or duplicate native tile')
                palette = item['palette']
                if not palette or len(set(palette)) != len(palette) or any(not isinstance(n, str) or not n.startswith('minecraft:') for n in palette):
                    raise ValueError('Invalid native biome palette')
                tiles[key] = {**item, 'palette': [ALIAS.get(n, n) for n in palette]}
    if len(starts) != 1 or starts[0].get('seed') != SEED or (starts[0].get('jobs', 0) < len(tiles) if allow_partial else starts[0].get('jobs') != len(tiles)) or (not set(tiles).issubset(rows) if allow_partial else set(rows) != set(tiles)):
        raise ValueError('Native job identity or completion count mismatch')
    for key, tile in tiles.items():
        if set(rows[key]) != set(range(128)):
            raise ValueError('Missing native rows')
        tile['samples'] = [value for row in range(128) for value in rows[key][row]]
        if any(value >= len(tile['palette']) for value in tile['samples']):
            raise ValueError('Native palette index out of range')
    return list(tiles.values())


def color(name, colors):
    # Colors are presentation only; all biome identities come from the game.
    return colors.get(name, {'minecraft:desert': '#ead49a'}.get(name, '#' + hashlib.sha256(name.encode()).hexdigest()[:6]))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--log', required=True, type=Path)
    parser.add_argument('--settings', required=True, type=Path)
    args = parser.parse_args()
    text = gzip.decompress(args.log.read_bytes()).decode() if args.log.suffix == '.gz' else args.log.read_text()
    settings = json.loads(args.settings.read_text())
    tiles = parse_native(text, settings)
    if len(tiles) != 36 or sum(t.get('control', False) for t in tiles) != 1:
        raise ValueError('Expected exactly 36 route probe tiles, including one control')
    expected = {(x, z, 64) for x in range(-384, -2433, -128) for z in [-256, -384]}
    expected.add((-2432, -384, 103))
    if {(t['x'], t['z'], t['y']) for t in tiles if not t.get('control')} != expected:
        raise ValueError('Unexpected native route footprint')
    # Independent prior native fixtures must agree before accepting this run.
    controls = [t for t in tiles if t.get('control')]
    fixtures = [(controls[0], 'data/bedrock-26.60-wide-area.json'),
                (next(t for t in tiles if t['y'] == 103), 'data/bedrock-26.60-cherry-grove.json')]
    overlap_cells = 0
    for tile, path in fixtures:
        compared = 0
        for prior in json.loads(Path(path).read_text())['biomes']:
            if prior['y'] != tile['y']:
                continue
            for z in range(max(tile['z'], prior['z']), min(tile['z']+128, prior['z']+prior['height'])):
                for x in range(max(tile['x'], prior['x']), min(tile['x']+128, prior['x']+prior['width'])):
                    observed = tile['palette'][tile['samples'][(z-tile['z'])*128+x-tile['x']]]
                    expected = prior['palette'][prior['samples'][(z-prior['z'])*prior['width']+x-prior['x']]]['name']
                    if observed != expected:
                        raise ValueError(f'Prior native fixture mismatch at {x},{tile["y"]},{z}')
                    compared += 1
        expected_count = 16384 if tile.get('control') else 4096
        if compared != expected_count:
            raise ValueError('Incomplete independent native comparison')
        if not tile.get('control'):
            overlap_cells += compared
    evidence = '\n'.join(line for line in text.splitlines() if any(marker in line for marker in ['Version:', 'Build ID:', 'Commit ID:', 'MSE_ROUTE_'])) + '\n'
    digest = hashlib.sha256(evidence.encode()).hexdigest()
    colors = {}
    for path in Path('data').glob('bedrock-26.60-*.json'):
        for t in json.loads(path.read_text()).get('biomes', []):
            for p in t['palette']:
                colors[p['name']] = p['color']
    outputs, entries = [], []
    for t in tiles:
        key = f"{t['y']}_{t['x']}_{t['z']}"
        tile = {k: t[k] for k in ['x', 'z', 'y', 'width', 'height', 'samples']}
        tile['step'] = 1
        tile['palette'] = [{'name': n, 'color': color(n, colors)} for n in t['palette']]
        bundle = dict(schemaVersion=1, edition='bedrock', dimension='overworld', seed=SEED, version='26.60',
                      source=dict(kind='observed', name='Official Bedrock server: native Cherry Grove route',
                                  evidence=f'BDS {VERSION} build {BUILD}, fresh disposable exact-seed world, experiments off verified from level.dat. Every one of these 16384 cells read directly using stable Script API getBiome at its stated Y. No block modifications. Probe evidence SHA256 {digest}; see research/bds/cherry-route-native.log.gz and cherry-route-settings.json. stone_beach is normalized to the documented stony_shore alias. Xbox target 26.60; native source is 1.26.61.1. Older Xbox chunks may differ. No global prediction or exhaustive structure claim.'),
                      structures=[], biomes=[tile])
        path = f"research/bds/cherry-route-control.json" if t.get('control') else f'data/tiles/{key}.json'
        outputs.append((Path(path), json.dumps(bundle, separators=(',', ':')) + '\n'))
        if not t.get('control'):
            entries.append(dict(id=key, path='./'+path, **{k: t[k] for k in ['x', 'z', 'y', 'width', 'height']}))
    # All validation succeeded: commit complete evidence and outputs atomically by file.
    for path, content in outputs:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    Path('research/bds/cherry-route-native.log.gz').write_bytes(gzip.compress(evidence.encode(), mtime=0))
    Path('research/bds/cherry-route-settings.json').write_text(json.dumps(settings, indent=2)+'\n')
    report = dict(schemaVersion=1, seed=SEED, version='26.60', nativeVersion=VERSION, build=BUILD,
                  experiments=False, evidenceSha256=digest, tiles=entries, sampledRouteCells=len(entries)*16384, addedDistinctHeightCells=len(entries)*16384-overlap_cells, overlapCells=overlap_cells,
                  controlCells=16384, olderXboxChunksMayDiffer=True)
    Path('research/bds/cherry-route-manifest.json').write_text(json.dumps(report, indent=2)+'\n')
    print(f'Exported {len(entries)} native tiles ({report["sampledRouteCells"]} sampled height cells) and one independent control')


if __name__ == '__main__':
    main()
