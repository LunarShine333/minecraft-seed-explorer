"""Export a bounded biome raster from a stopped, copied Bedrock Overworld DB.

No terrain is predicted. Missing chunks and unknown numeric IDs abort the export.
The template supplies verified world identity, provenance and a numeric palette.
"""
import argparse
import json
import struct
from pathlib import Path
from bedrock_data3d import decode


def raster(read_chunk, palette, x, z, width, height, step, ys):
    if not all(isinstance(n, int) for n in [x, z, width, height, step, *ys]):
        raise ValueError('Coordinates and dimensions must be integers')
    if not (1 <= width <= 512 and 1 <= height <= 512 and 1 <= step <= 256):
        raise ValueError('Invalid raster dimensions or spacing')
    if not ys or len(set(ys)) != len(ys) or width * height * len(ys) > 262144:
        raise ValueError('Invalid heights or sample limit exceeded')
    if any(y < -64 or y > 319 for y in ys):
        raise ValueError('Overworld Y must be between -64 and 319')
    if max(abs(x), abs(z), abs(x + width * step), abs(z + height * step)) > 30000000:
        raise ValueError('Raster exceeds world coordinate limits')
    tiles = []
    # Keep only one decoded chunk in memory at a time.
    for y in ys:
        samples = [None] * (width * height)
        groups = {}
        for row in range(height):
            for col in range(width):
                bx, bz = x + col * step, z + row * step
                groups.setdefault((bx // 16, bz // 16), []).append((row * width + col, bx % 16, bz % 16))
        used, indices = [], {}
        for (cx, cz), cells in groups.items():
            sections = read_chunk(cx, cz)
            for index, lx, lz in cells:
                biome = sections[(y + 64) // 16][lx * 256 + lz * 16 + y % 16]
                key = str(biome)
                if key not in palette:
                    raise ValueError(f'Unknown biome ID {biome}; supply a verified palette entry')
                if key not in indices:
                    indices[key] = len(used)
                    used.append(palette[key])
                samples[index] = indices[key]
        tiles.append(dict(x=x, z=z, y=y, width=width, height=height, step=step, palette=used, samples=samples))
    return tiles


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db-copy', required=True, type=Path)
    parser.add_argument('--template', required=True, type=Path)
    parser.add_argument('--palette', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    for name in ['x', 'z', 'width', 'height']:
        parser.add_argument('--' + name, required=True, type=int)
    parser.add_argument('--step', type=int, default=1)
    parser.add_argument('--y', nargs='+', type=int, required=True)
    args = parser.parse_args()
    bundle = json.loads(args.template.read_text())
    if bundle.get('source', {}).get('kind') != 'observed' or bundle.get('dimension') != 'overworld':
        parser.error('Use a verified observed Overworld template')
    if not isinstance(bundle.get('seed'), str):
        parser.error('Seed must remain an exact decimal string')
    from leveldb import LevelDB
    db = LevelDB(str(args.db_copy))
    try:
        def read(cx, cz):
            try:
                return decode(db.get(struct.pack('<ii', cx, cz) + b'+'))
            except KeyError:
                raise ValueError(f'Missing stored biome chunk ({cx}, {cz}); no export written') from None
        bundle['biomes'] = raster(read, json.loads(args.palette.read_text()), args.x, args.z,
                                  args.width, args.height, args.step, args.y)
    finally:
        db.close()
    encoded = json.dumps(bundle, separators=(',', ':'))
    if len(encoded.encode()) > 4 * 1024 * 1024:
        raise ValueError('Bundle exceeds application 4 MB import limit')
    # Write only after every requested point has been read successfully.
    args.output.write_text(encoded)
    print(f'Exported {sum(len(t["samples"]) for t in bundle["biomes"])} stored cells')


if __name__ == '__main__':
    main()
