"""Decode Overworld Data3D biome cells in XZY layout (Y varies fastest)."""
import struct

def decode(data):
    if len(data) < 512:
        raise ValueError('Missing Data3D heightmap')
    position = 512
    sections = []
    def u32():
        nonlocal position
        if position + 4 > len(data):
            raise ValueError('Truncated Data3D palette')
        value = struct.unpack_from('<I', data, position)[0]
        position += 4
        return value
    for _ in range(24):
        if position >= len(data):
            raise ValueError('Missing biome section')
        header = data[position]
        position += 1
        bits = header >> 1
        if bits == 127:
            if not sections:
                raise ValueError('Missing previous biome section')
            # Extend the previous section's top horizontal layer upwards.
            previous = sections[-1]
            sections.append([previous[(i // 16) * 16 + 15] for i in range(4096)])
            continue
        if not header & 1:
            raise ValueError('Unsupported palette encoding')
        if bits == 0:
            sections.append([u32()] * 4096)
            continue
        if bits not in (1, 2, 3, 4, 5, 6, 8, 16):
            raise ValueError('Invalid biome palette bit width')
        per_word = 32 // bits
        words = [u32() for _ in range((4096 + per_word - 1) // per_word)]
        count = u32()
        if not 1 <= count <= 65536:
            raise ValueError('Invalid biome palette size')
        palette = [u32() for _ in range(count)]
        mask = (1 << bits) - 1
        indices = [(words[i // per_word] >> ((i % per_word) * bits)) & mask for i in range(4096)]
        if any(i >= count for i in indices):
            raise ValueError('Biome palette index out of bounds')
        sections.append([palette[i] for i in indices])
    return sections
