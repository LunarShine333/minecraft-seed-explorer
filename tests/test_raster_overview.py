import hashlib
import json
import struct
import sys
import unittest
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))


def pixels_from_png(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Not PNG')
    offset, compressed, dimensions = 8, b'', None
    while offset < len(data):
        length = struct.unpack_from('>I', data, offset)[0]
        kind, payload = data[offset+4:offset+8], data[offset+8:offset+8+length]
        crc = struct.unpack_from('>I', data, offset+8+length)[0]
        if zlib.crc32(kind+payload) != crc:
            raise ValueError('PNG CRC mismatch')
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            if (depth, color, compression, filtering, interlace) != (8, 6, 0, 0, 0):
                raise ValueError('Unexpected PNG pixel format')
            dimensions = width, height
        if kind == b'IDAT':
            compressed += payload
        offset += length+12
    width, height = dimensions
    rows = zlib.decompress(compressed)
    if len(rows) != height*(width*4+1):
        raise ValueError('PNG size mismatch')
    if any(rows[y*(width*4+1)] != 0 for y in range(height)):
        raise ValueError('Unexpected scanline filter')
    return width, height, b''.join(rows[y*(width*4+1)+1:(y+1)*(width*4+1)] for y in range(height))


class RasterOverviewTests(unittest.TestCase):
    def test_every_native_cell_keeps_its_color_and_unknown_pixels_stay_transparent(self):
        catalog = json.loads((ROOT/'data/checked-tiles.json').read_text())
        index = json.loads((ROOT/catalog['overview']['path']).read_text())
        entries = {t['id']: t for t in catalog['tiles']}
        total = 0
        for page in index['pages']:
            raw = (ROOT/page['path']).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(), page['sha256'])
            width, height, pixels = pixels_from_png(raw)
            self.assertEqual((width, height), (512, 512))
            alpha = bytearray(width*height)
            for tile_id in page['coverage']:
                tile = json.loads((ROOT/entries[tile_id]['path']).read_text())['biomes'][0]
                palette = [bytes.fromhex(p['color'][1:])+b'\xff' for p in tile['palette']]
                for i, value in enumerate(tile['samples']):
                    row, col = divmod(i, tile['width'])
                    pixel = (tile['z']+row-page['z'])*width+tile['x']+col-page['x']
                    self.assertEqual(pixels[pixel*4:pixel*4+4], palette[value])
                    alpha[pixel] = 255
                    total += 1
            self.assertEqual(pixels[3::4], alpha)
            for sample in page['witnesses']:
                tile = next(json.loads((ROOT/entries[t]['path']).read_text())['biomes'][0] for t in page['coverage']
                            if entries[t]['x'] <= sample['x'] < entries[t]['x']+entries[t]['width']
                            and entries[t]['z'] <= sample['z'] < entries[t]['z']+entries[t]['height'])
                i = (sample['z']-tile['z'])*tile['width']+sample['x']-tile['x']
                self.assertEqual(tile['palette'][tile['samples'][i]]['name'], sample['name'])
                self.assertEqual(tile['palette'][tile['samples'][i]]['color'], sample['color'])
        self.assertEqual(total, 5308416)

    def test_overview_is_smaller_than_dense_json_without_reducing_native_pixels(self):
        catalog = json.loads((ROOT/'data/checked-tiles.json').read_text())
        index_path = ROOT/catalog['overview']['path']
        index = json.loads(index_path.read_text())
        native_bytes = sum((ROOT/t['path']).stat().st_size for t in catalog['tiles'])
        raster_bytes = index_path.stat().st_size+sum((ROOT/p['path']).stat().st_size for p in index['pages'])
        self.assertLess(raster_bytes, native_bytes/10)
        self.assertEqual(index['representation'], 'lossless-native-cell-colors')


if __name__ == '__main__':
    unittest.main()
