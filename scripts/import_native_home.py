"""Export the native 1024 × 1024 home-area extension from a complete API probe.

Shares strict row/settings validation with the retained Cherry Grove importer.
Only the 48 new tiles are published; the independent control must match first.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
from import_native_route import parse_native, color, SEED, VERSION, BUILD


def export_home(text, settings):
    tiles = parse_native(text, settings)
    expected = {(x, z, 64) for z in range(-256, 768, 128) for x in range(-256, 768, 128)
                if not (x < 256 and z < 256)}
    controls = [t for t in tiles if t.get('control')]
    if len(tiles) != 49 or len(controls) != 1 or {(t['x'], t['z'], t['y']) for t in tiles if not t.get('control')} != expected:
        raise ValueError('Unexpected home-area footprint or control count')
    control = controls[0]
    if (control['x'], control['z'], control['y']) != (-256, -256, 64):
        raise ValueError('Wrong home-area control coordinates')
    prior = json.loads(Path('research/bds/cherry-route-control.json').read_text())['biomes'][0]
    for i, value in enumerate(control['samples']):
        if control['palette'][value] != prior['palette'][prior['samples'][i]]['name']:
            raise ValueError('Independent native control mismatch')
    evidence = '\n'.join(line for line in text.splitlines() if any(marker in line for marker in ['Version:', 'Build ID:', 'Commit ID:', 'MSE_ROUTE_']))+'\n'
    digest = hashlib.sha256(evidence.encode()).hexdigest()
    colors = {}
    for path in Path('data/tiles').glob('*.json'):
        for tile in json.loads(path.read_text())['biomes']:
            for p in tile['palette']:
                colors[p['name']] = p['color']
    entries, outputs = [], []
    for t in tiles:
        key = f"{t['y']}_{t['x']}_{t['z']}"
        tile = {k: t[k] for k in ['x', 'z', 'y', 'width', 'height', 'samples']}
        tile['step'] = 1
        tile['palette'] = [{'name': n, 'color': color(n, colors)} for n in t['palette']]
        bundle = dict(schemaVersion=1, edition='bedrock', dimension='overworld', seed=SEED, version='26.60',
                      source=dict(kind='observed', name='Official Bedrock server: native home-area extension',
                                  evidence=f'BDS {VERSION} build {BUILD}, fresh disposable exact-seed world. Default generator and experiments off verified from level.dat. All 16384 cells read directly using stable Script API getBiome at Y64; no block edits. Native evidence SHA256 {digest}; see research/bds/home-area-native.log.gz and home-area-settings.json. Independent 16384-cell control matches prior native observations. stone_beach/stony_shore alias normalized. Xbox target 26.60, source 1.26.61.1; older Xbox chunks may differ. Biome slice, not elevation data; no global predictions or new structure claims.'),
                      structures=[], biomes=[tile])
        path = 'research/bds/home-area-control.json' if t.get('control') else f'data/tiles/{key}.json'
        outputs.append((Path(path), json.dumps(bundle, separators=(',', ':'))+'\n'))
        if not t.get('control'):
            entries.append(dict(id=key, path='./'+path, **{k: t[k] for k in ['x', 'z', 'y', 'width', 'height']}))
    return outputs, evidence, dict(schemaVersion=1, seed=SEED, version='26.60', nativeVersion=VERSION, build=BUILD,
                                   experiments=False, evidenceSha256=digest, tiles=entries,
                                   addedDistinctHeightCells=786432, controlCells=16384, olderXboxChunksMayDiffer=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--log', type=Path, required=True)
    parser.add_argument('--settings', type=Path, required=True)
    args = parser.parse_args()
    text = gzip.decompress(args.log.read_bytes()).decode() if args.log.suffix == '.gz' else args.log.read_text()
    settings = json.loads(args.settings.read_text())
    outputs, evidence, manifest = export_home(text, settings)
    # No files are written until the complete native run and control pass.
    for path, content in outputs:
        path.write_text(content)
    Path('research/bds/home-area-native.log.gz').write_bytes(gzip.compress(evidence.encode(), mtime=0))
    Path('research/bds/home-area-settings.json').write_text(json.dumps(settings, indent=2)+'\n')
    Path('research/bds/home-area-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print('Exported 48 native home-area tiles, 786432 new Y64 cells and a 16384-cell control')


if __name__ == '__main__':
    main()
