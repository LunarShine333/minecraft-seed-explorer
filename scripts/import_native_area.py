"""Validate a planned native acquisition and export dense observed biome tiles.

The committed plan pins the exact project seed, source build, requested footprint
and independent control fixtures. No output is written until every check passes.
"""
import argparse
import base64
import gzip
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
from import_native_route import parse_native, color, SEED, VERSION, BUILD


def export_area_runs(runs, plan):
    if (plan.get('schema') != 'native-checked-area-plan-v1' or plan.get('seed') != SEED
            or plan.get('version') != '26.60' or plan.get('sourceVersion') != VERSION
            or plan.get('build') != BUILD or plan.get('experiments') is not False
            or not re.fullmatch('[a-z][a-z0-9-]{0,39}', plan.get('id', ''))):
        raise ValueError('Invalid native acquisition plan identity')
    jobs = plan.get('jobs')
    if not isinstance(jobs, list) or not 1 <= len(jobs) <= 512:
        raise ValueError('Invalid native acquisition size')
    expected = {}
    for job in jobs:
        key = tuple(job[k] for k in ['x', 'z', 'y'])
        if (not all(type(n) is int for n in key) or key in expected
                or any(abs(n) > 29999872 for n in key[:2]) or not -64 <= key[2] <= 319):
            raise ValueError('Invalid or duplicate requested coordinates')
        expected[key] = job
    combined, reports, normalized_runs = {}, [], []
    control_cells = duplicate_cells = 0
    for run in runs:
        text, settings = run['log'], run['settings']
        current = parse_native(text, settings, allow_partial=True)
        start = next(json.loads(line.split('MSE_ROUTE_START ', 1)[1]) for line in text.splitlines() if 'MSE_ROUTE_START ' in line)
        if start.get('planId') != plan['id']:
            raise ValueError('Native run belongs to another plan')
        run_controls = 0
        for tile in current:
            key = tile['x'], tile['z'], tile['y']
            if key not in expected:
                raise ValueError('Native output does not match requested plan footprint')
            job = expected[key]
            if bool(tile.get('control')) != bool(job.get('control')):
                raise ValueError('Native control role mismatch')
            if tile.get('control'):
                ref = PurePosixPath(job.get('reference', ''))
                if ref.is_absolute() or '..' in ref.parts or ref.suffix != '.json' or str(ref).split('/')[0] not in ['research', 'data']:
                    raise ValueError('Unsafe native control fixture path')
                raw = json.loads(Path(ref).read_text())
                if raw.get('seed') != SEED or raw.get('version') != '26.60' or raw.get('source', {}).get('kind') != 'observed' or len(raw.get('biomes', [])) != 1:
                    raise ValueError('Wrong native control fixture identity')
                prior = raw['biomes'][0]
                if any(prior.get(k) != tile[k] for k in ['x', 'z', 'y', 'width', 'height']) or prior.get('step') != 1:
                    raise ValueError('Native control fixture dimensions differ')
                for i, value in enumerate(tile['samples']):
                    if tile['palette'][value] != prior['palette'][prior['samples'][i]]['name']:
                        raise ValueError('Independent native control mismatch')
                run_controls += len(tile['samples'])
            if key in combined:
                old = combined[key]
                if any(tile['palette'][value] != old['palette'][old['samples'][i]] for i, value in enumerate(tile['samples'])):
                    raise ValueError('Native runs disagree on overlapping cells')
                duplicate_cells += len(tile['samples'])
            else:
                combined[key] = tile
        if not run_controls:
            raise ValueError('Each native run needs an independent completed control')
        control_cells += run_controls
        observed_keys = {(t['x'], t['z'], t['y']) for t in current}
        discarded_rows = 0
        for line in text.splitlines():
            if 'MSE_ROUTE_ROW ' in line:
                row = json.loads(line.split('MSE_ROUTE_ROW ', 1)[1])
                if (row['x'], row['z'], row['y']) not in observed_keys:
                    discarded_rows += 1
        evidence = '\n'.join(line for line in text.splitlines() if any(m in line for m in ['Version:', 'Build ID:', 'Commit ID:', 'MSE_ROUTE_']))+'\n'
        normalized_runs.append(dict(log=evidence, settings=settings, note=run.get('note', '')))
        reports.append(dict(runComplete='MSE_ROUTE_DONE' in text, reportedJobs=start['jobs'],
                            completeTileReadings=len(current), discardedPartialRows=discarded_rows,
                            controlCells=run_controls))
    if set(combined) != set(expected):
        raise ValueError(f'Native acquisition is missing {len(set(expected)-set(combined))} planned tiles')
    tiles = [combined[k] for k in expected]
    new_cells = sum(len(t['samples']) for t in tiles if not t.get('control'))
    if plan.get('expectedNewCells') != new_cells:
        raise ValueError('Planned sample total mismatch')
    archive = dict(schema='native-area-evidence-v1', planId=plan['id'], runs=normalized_runs)
    evidence = json.dumps(archive, sort_keys=True, separators=(',', ':'))+'\n'
    digest = hashlib.sha256(evidence.encode()).hexdigest()
    colors = {}
    for path in Path('data/tiles').glob('*.json'):
        for tile in json.loads(path.read_text())['biomes']:
            for p in tile['palette']:
                colors[p['name']] = p['color']
    slug = plan['id']
    outputs, entries = [], []
    for t in tiles:
        key = f"{t['y']}_{t['x']}_{t['z']}"
        tile = {k: t[k] for k in ['x', 'z', 'y', 'width', 'height', 'samples']}
        tile['step'] = 1
        tile['palette'] = [{'name': n, 'color': color(n, colors)} for n in t['palette']]
        bundle = dict(schemaVersion=1, edition='bedrock', dimension='overworld', seed=SEED, version='26.60',
                      source=dict(kind='observed', name='Official Bedrock server: '+plan['name'],
                                  evidence=f'BDS {VERSION} build {BUILD}, complete native tile records from disposable exact-seed worlds, default generator and experiments off verified separately from each level.dat. Every cell read directly using stable Script API getBiome at the stated Y. No block edits or Xbox save access. Plan {slug}; evidence SHA256 {digest}; see research/bds/{slug}-native-runs.json.gz and {slug}-plan.json. Interrupted runs and discarded partial rows are explicitly recorded. Each run passed its native control; {control_cells} control readings total across {len(reports)} runs. stone_beach/stony_shore alias normalized. Target 26.60, source 1.26.61.1; original Xbox generation version unknown, older chunks may differ. No global engine or new structure claim.'),
                      structures=[], biomes=[tile])
        path = f'research/bds/{slug}-control-{key}.json' if t.get('control') else f'data/tiles/{key}.json'
        outputs.append((Path(path), json.dumps(bundle, separators=(',', ':'))+'\n'))
        if not t.get('control'):
            entries.append(dict(id=key, path='./'+path, **{k: t[k] for k in ['x', 'z', 'y', 'width', 'height']}))
    report = dict(schemaVersion=1, seed=SEED, version='26.60', nativeVersion=VERSION, build=BUILD,
                  experiments=False, planId=slug, evidenceSha256=digest, tiles=entries,
                  addedDistinctHeightCells=new_cells, controlCells=control_cells, duplicateCellsChecked=duplicate_cells, completeNativeCellReadings=sum(r['completeTileReadings'] for r in reports)*16384, runReports=reports,
                  baselineCommit=plan['baselineCommit'], baselineRevision=plan['baselineRevision'], olderXboxChunksMayDiffer=True)
    return outputs, evidence, report


def read_evidence(path):
    data = path.read_bytes()
    if path.name.endswith('.gz.b64'):
        data = base64.b64decode(data, validate=True)
        return gzip.decompress(data).decode('utf-8')
    if path.suffix == '.gz':
        return gzip.decompress(data).decode('utf-8')
    return data.decode('utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    args = parser.parse_args()
    raw = read_evidence(args.runs)
    archive, plan = json.loads(raw), json.loads(args.plan.read_text())
    if archive.get('schema') != 'native-area-evidence-v1' or archive.get('planId') != plan['id']:
        raise ValueError('Wrong native evidence archive')
    outputs, evidence, report = export_area_runs(archive['runs'], plan)
    for path, content in outputs:
        path.write_text(content)
    prefix = Path('research/bds')/plan['id']
    Path(str(prefix)+'-native-runs.json.gz').write_bytes(gzip.compress(evidence.encode(), mtime=0))
    Path(str(prefix)+'-manifest.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(dict(tiles=len(report['tiles']), cells=report['addedDistinctHeightCells'], controlCells=report['controlCells'], runs=report['runReports'])))


if __name__ == '__main__':
    main()
