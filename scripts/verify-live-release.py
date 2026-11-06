"""Read-only byte verification of a checked-out release against its published site."""
import argparse, hashlib, json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen


def verify(base, root):
    catalog = json.loads((root / 'data/checked-tiles.json').read_text())
    index = json.loads((root / 'data/overview/index.json').read_text())
    paths = ['index.html', 'sw.js', 'data/checked-tiles.json', 'data/overview/index.json']
    paths += [p.name for p in root.glob('*.mjs')]
    # One native tile and raster per height, plus the newest catalog tile.
    for y in sorted({t['y'] for t in catalog['tiles']}):
        paths.append(next(t['path'].removeprefix('./') for t in catalog['tiles'] if t['y'] == y))
        paths.append(next(p['path'].removeprefix('./') for p in index['pages'] if p['y'] == y))
    paths.append(catalog['tiles'][-1]['path'].removeprefix('./'))
    def check(path):
        try:
            expected = (root / path).read_bytes()
            with urlopen(base.rstrip('/') + '/' + path, timeout=20) as response:
                actual = response.read(len(expected) + 1)
            return dict(path=path, matches=actual == expected,
                        expectedSha256=hashlib.sha256(expected).hexdigest(),
                        receivedSha256=hashlib.sha256(actual).hexdigest())
        except Exception as error:
            return dict(path=path, matches=False, error=str(error))
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, sorted(set(paths))))
    return dict(seed=catalog['seed'], revision=index['revision'],
                verified=all(r['matches'] for r in results), files=results,
                scope='Application modules, metadata, representative native tiles and rasters; not every hosted file or physical Safari QA.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', default='https://lunarshine333.github.io/minecraft-seed-explorer/')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    report = verify(args.base, args.root)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['verified'] else 1)
