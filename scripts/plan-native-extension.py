"""Plan unsampled 128-block tiles; this does not acquire or validate biomes."""
import argparse
import json
from pathlib import Path

SEED = '3022187552114785111'

def missing_jobs(catalog, min_x, min_z, max_x, max_z, y):
    if catalog.get('seed') != SEED:
        raise ValueError('Unexpected seed; exact decimal string required')
    if any(type(v) is not int or v % 128 for v in (min_x, min_z, max_x, max_z)):
        raise ValueError('Bounds must be integer multiples of 128')
    if not (-30000000 <= min_x < max_x <= 30000000 and -30000000 <= min_z < max_z <= 30000000):
        raise ValueError('Invalid bounds')
    if type(y) is not int or not -64 <= y < 320:
        raise ValueError('Invalid Overworld height')
    if (max_x-min_x)*(max_z-min_z)//16384 > 4096:
        raise ValueError('Plan exceeds 4096 tiles')
    tiles = catalog.get('tiles')
    if not isinstance(tiles, list):
        raise ValueError('Catalog tiles must be a list')
    for tile in tiles:
        if not isinstance(tile, dict) or any(type(tile.get(k)) is not int for k in ('x', 'z', 'y', 'width', 'height')):
            raise ValueError('Catalog footprint must contain integer coordinates and dimensions')
        if not (-64 <= tile['y'] < 320 and 1 <= tile['width'] <= 128 and 1 <= tile['height'] <= 128):
            raise ValueError('Invalid catalog footprint dimensions or height')
    known = [t for t in tiles if t['y'] == y]
    return [dict(x=x,z=z,y=y) for z in range(min_z,max_z,128) for x in range(min_x,max_x,128)
            if not any(t['x'] < x+128 and t['x']+t['width'] > x and
                       t['z'] < z+128 and t['z']+t['height'] > z for t in known)]

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog',default='data/checked-tiles.json')
    parser.add_argument('--bounds',nargs=4,type=int,required=True,metavar=('MIN_X','MIN_Z','MAX_X','MAX_Z'))
    parser.add_argument('--y',type=int,default=64)
    args=parser.parse_args()
    jobs=missing_jobs(json.loads(Path(args.catalog).read_text()),*args.bounds,args.y)
    print(json.dumps({'status':'unsampled collection candidates only','seed':SEED,
                      'jobs':jobs,'candidateCells':len(jobs)*16384},indent=2))
