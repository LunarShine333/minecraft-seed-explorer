"""Compare a pinned diagnostic binary with bounded native and stored references."""
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

def normalize(name):
    return {'minecraft:stone_beach': 'minecraft:stony_shore',
            'minecraft:stone_shore': 'minecraft:stony_shore'}.get(name, name)

def compare(binary, refs, version, scope):
    rows=list(refs)
    coords=''.join(f"{p['x']} {p['y']} {p['z']}\n" for p in rows)
    output=json.loads(subprocess.run([binary,version,'quart'],input=coords,text=True,
                                    capture_output=True,check=True).stdout)
    if len(output)!=len(rows):raise ValueError('Missing candidate points')
    mismatches=[]
    totals=Counter(); failures=Counter(); confusions=Counter()
    for expected,actual in zip(rows,output):
        if any(expected[k]!=actual[k] for k in ['x','y','z']):
            raise ValueError('Candidate coordinates changed or reordered')
        y=str(expected['y']);totals[y]+=1
        if normalize(expected['biome'])!=normalize(actual['biome']):
            failures[y]+=1
            confusions[normalize(expected['biome'])+' -> '+normalize(actual['biome'])]+=1
            mismatches.append({'expected':expected,'actual':actual})
    report={'scope':scope,'versionMode':version,'lookup':'quart','checked':len(rows),
            'matched':len(rows)-len(mismatches),'mismatchCount':len(mismatches),
            'byHeight':{y:{'checked':n,'matched':n-failures[y]} for y,n in totals.items()},
            'confusions':dict(confusions),'firstMismatches':mismatches[:8],
            'approvedForMap':False}
    result=Path('candidate-results');result.mkdir(exist_ok=True)
    (result/f'{scope}-{version}.json').write_text(json.dumps({**report,'mismatches':mismatches},indent=2))
    print('MULTI_HEIGHT_RESULT '+json.dumps(report),flush=True)

def stored_points(bundle):
    for tile in bundle['biomes']:
        for index,palette in enumerate(tile['samples']):
            yield {'x':tile['x']+(index%tile['width'])*tile['step'],
                   'z':tile['z']+(index//tile['width'])*tile['step'],
                   'y':tile['y'],'biome':tile['palette'][palette]['name']}

def main():
    if len(sys.argv)!=2:raise SystemExit('Usage: compare-candidate-heights.py /path/to/binary')
    native=json.loads(Path('research/bds/wide-area-api-reference.json').read_text())
    bundle=json.loads(Path('data/bedrock-26.60-checked-area.json').read_text())
    if bundle['seed']!='3022187552114785111' or bundle['version']!='26.60':
        raise ValueError('Wrong stored reference identity')
    points=list(stored_points(bundle))
    if len(points)!=262144 or sorted({p['y'] for p in points})!=[-48,0,64,128]:
        raise ValueError('Unexpected stored reference coverage')
    for version in ['26.50','26.60']:
        compare(sys.argv[1],native,version,'native-wide-Y64')
        compare(sys.argv[1],points,version,'stored-four-heights')

if __name__=='__main__':main()
