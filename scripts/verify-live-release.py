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
    # Verify every overview page; retain representative dense tiles per height.
    for y in sorted({t['y'] for t in catalog['tiles']}):
        paths.append(next(t['path'].removeprefix('./') for t in catalog['tiles'] if t['y'] == y))
    paths.extend(p['path'].removeprefix('./') for p in index['pages'])
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
                scope='Application modules, metadata, representative native tiles and every indexed overview page; not every dense tile or physical Safari QA.')


def verify_attempts(base, root, attempts=1):
    """Keep every attempt; success requires one complete matching snapshot."""
    if type(attempts) is not int or not 1 <= attempts <= 3:
        raise ValueError('attempts must be between 1 and 3')
    reports = []
    for _ in range(attempts):
        report = verify(base, root)
        reports.append(report)
        if report['verified']:
            break
    return dict(report, attempts=reports)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', default='https://lunarshine333.github.io/minecraft-seed-explorer/')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--attempts', type=int, choices=range(1,4), default=1)
    args = parser.parse_args()
    report = verify_attempts(args.base, args.root, args.attempts)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['verified'] else 1)
