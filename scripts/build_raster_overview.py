"""Build lossless 512-block PNG pages from checked native cells.

Each source cell becomes exactly one RGBA pixel. Unknown areas stay transparent.
No resampling, majority voting, fitted predictions or new terrain is generated.
Uses only the Python standard library; run after build-checked-tiles.mjs.
"""
import hashlib
import json
import struct
import zlib
from pathlib import Path

SIZE = 512


def png_rgba(width, height, pixels):
    def chunk(kind, payload):
        return struct.pack('>I', len(payload))+kind+payload+struct.pack('>I', zlib.crc32(kind+payload))
    rows = b''.join(b'\x00'+pixels[y*width*4:(y+1)*width*4] for y in range(height))
    return (b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
            +chunk(b'IDAT', zlib.compress(rows, 9))+chunk(b'IEND', b''))


def build(root=Path('.')):
    catalog = json.loads((root/'data/checked-tiles.json').read_text())
    inputs = []
    for entry in sorted(catalog['tiles'], key=lambda t: (t['y'], t['z'], t['x'])):
        raw = (root/entry['path']).read_bytes()
        bundle = json.loads(raw)
        t = bundle['biomes'][0]
        if (bundle['seed'] != catalog['seed'] or bundle['version'] != catalog['version']
                or bundle['source']['kind'] != 'observed' or len(bundle['biomes']) != 1
                or t['step'] != 1 or any(t[k] != entry[k] for k in ['x', 'z', 'y', 'width', 'height'])):
            raise ValueError('Overview accepts only matching dense observed tiles')
        inputs.append((entry, t, hashlib.sha256(raw).hexdigest()))
    revision = hashlib.sha256(json.dumps(dict(seed=catalog['seed'], version=catalog['version'],
                                             tiles=[dict(**entry, sha256=digest) for entry, _, digest in inputs]),
                                         sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    pages = {}
    for entry, t, _ in inputs:
        x, z = t['x']//SIZE*SIZE, t['z']//SIZE*SIZE
        if t['x']+t['width'] > x+SIZE or t['z']+t['height'] > z+SIZE:
            raise ValueError('Native tile crosses overview page boundary; split first')
        key = (t['y'], z, x)
        if key not in pages:
            pages[key] = dict(id=f"{t['y']}_{x}_{z}", x=x, z=z, y=t['y'], width=SIZE, height=SIZE,
                              coverage=[], witnesses={}, pixels=bytearray(SIZE*SIZE*4))
        page = pages[key]
        page['coverage'].append(entry['id'])
        colors = [bytes.fromhex(p['color'][1:])+b'\xff' for p in t['palette']]
        for row in range(t['height']):
            start = row*t['width']
            values = t['samples'][start:start+t['width']]
            offset = ((t['z']-z+row)*SIZE+t['x']-x)*4
            # Overlapping native tiles would make provenance ambiguous.
            if any(page['pixels'][offset+i*4+3] for i in range(t['width'])):
                raise ValueError('Overlapping overview coverage')
            page['pixels'][offset:offset+t['width']*4] = b''.join(colors[i] for i in values)
            for col, index in enumerate(values):
                p = t['palette'][index]
                if p['name'] not in page['witnesses']:
                    page['witnesses'][p['name']] = dict(name=p['name'], color=p['color'],
                                                       x=t['x']+col, z=t['z']+row, y=t['y'])
    folder = root/'data/overview'
    folder.mkdir(exist_ok=True)
    output = []
    for key in sorted(pages):
        page = pages[key]
        pixels = page.pop('pixels')
        page['witnesses'] = sorted(page['witnesses'].values(), key=lambda p: p['name'])
        page['path'] = f"./data/overview/{page['id']}-{revision[:16]}.png"
        data = png_rgba(SIZE, SIZE, pixels)
        (root/page['path']).write_bytes(data)
        page['sha256'] = hashlib.sha256(data).hexdigest()
        output.append(page)
    index = dict(schema='checked-raster-atlas-v1', seed=catalog['seed'], version=catalog['version'],
                 edition='bedrock', dimension='overworld', revision=revision, pageSize=SIZE,
                 representation='lossless-native-cell-colors', source=catalog['source'], pages=output)
    index_path = './data/overview/index.json'
    (root/index_path).write_text(json.dumps(index, separators=(',', ':'))+'\n')
    catalog['overview'] = dict(path=index_path, revision=revision)
    (root/'data/checked-tiles.json').write_text(json.dumps(catalog, indent=2)+'\n')
    raw_bytes = sum((root/e['path']).stat().st_size for e, _, _ in inputs)
    overview_bytes = (root/index_path).stat().st_size+sum((root/p['path']).stat().st_size for p in output)
    print(json.dumps(dict(pages=len(output), nativeJsonBytes=raw_bytes, overviewBytes=overview_bytes,
                          ratio=round(overview_bytes/raw_bytes, 4), revision=revision)))
    return index


if __name__ == '__main__':
    build()
