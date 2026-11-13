"""Verify every dense tile in a native manifest against published bytes."""
import argparse
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen


def verify(root, manifest, base, fetch=None):
    root = Path(root).resolve()
    def download(path):
        with urlopen(base.rstrip('/') + '/' + path, timeout=20) as response:
            return response.read((root / path).stat().st_size + 1)
    fetch = fetch or download
    paths = []
    for tile in manifest['tiles']:
        path = tile['path'].removeprefix('./')
        resolved = (root / path).resolve()
        if resolved == root or root not in resolved.parents:
            raise ValueError('Tile path escapes repository')
        paths.append(path)
    if not paths or len(paths) != len(set(paths)):
        raise ValueError('Manifest must have unique tile paths')
    def check(path):
        try:
            expected = (root / path).read_bytes()
            actual = fetch(path)
            return dict(path=path, matches=actual == expected,
                        expectedSha256=hashlib.sha256(expected).hexdigest(),
                        receivedSha256=hashlib.sha256(actual).hexdigest())
        except Exception as error:
            return dict(path=path, matches=False, error=str(error))
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, paths))
    return dict(verified=all(r['matches'] for r in results), files=results)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--base', default='https://lunarshine333.github.io/minecraft-seed-explorer/')
    args = parser.parse_args()
    report = verify(args.root, json.loads(args.manifest.read_text()), args.base)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['verified'] else 1)
