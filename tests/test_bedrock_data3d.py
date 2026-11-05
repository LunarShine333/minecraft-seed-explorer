import struct
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from bedrock_data3d import decode

def packed(bits, indices, palette):
    per = 32 // bits
    words = [sum(v << (bits * i) for i, v in enumerate(indices[start:start+per])) for start in range(0, 4096, per)]
    return bytes([bits*2+1])+struct.pack('<'+str(len(words))+'I', *words)+struct.pack('<I',len(palette))+struct.pack('<'+str(len(palette))+'I',*palette)

class Data3DTests(unittest.TestCase):
    def test_constant_inherits(self):
        sections=decode(bytes(512)+b'\x01'+struct.pack('<I',186)+b'\xff'*23)
        self.assertEqual(sections[23][4095],186)
    def test_inheritance_extends_top_layer_not_full_section(self):
        indices=[int(i%16==15) for i in range(4096)]
        sections=decode(bytes(512)+packed(1,indices,[1,186])+b'\xff'*23)
        self.assertEqual(sections[0][0],1)
        self.assertEqual(sections[0][15],186)
        self.assertEqual(set(sections[1]),{186})
        self.assertEqual(set(sections[23]),{186})
    def test_padding_and_word_boundaries(self):
        indices=[i%3 for i in range(4096)]
        section=decode(bytes(512)+packed(3,indices,[1,186,190])+b'\xff'*23)[0]
        self.assertEqual(section,[[1,186,190][i] for i in indices])
    def test_bad_data_rejected(self):
        for data in [b'',bytes(512)+b'\xff'*24,bytes(512)+b'\x01',bytes(512)+b'\x13']:
            with self.assertRaises(ValueError):decode(data)

if __name__=='__main__':unittest.main()
