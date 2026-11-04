// Keep seeds as decimal strings across JSON, storage, URLs and engine boundaries.
export const WORLD_SEED = '3022187552114785111';
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
// Add an engine only after its exact release passes in-game reference fixtures.
export const VALIDATED_ENGINES = Object.freeze([]);

export function seedString(value) {
  if (typeof value !== 'string' || !/^-?\d{1,20}$/.test(value))
    throw new Error('The seed must be a decimal string, never a JSON number.');
  const n = BigInt(value);
  if (n < -(1n << 63n) || n > (1n << 63n) - 1n)
    throw new Error('Seed is outside the signed 64-bit range.');
  return n.toString();
}

export function exactVersion(value) {
  if (typeof value !== 'string' || !/^(?:1\.)?26\.\d+(?:\.\d+){0,2}$/.test(value))
    throw new Error('Enter the exact Xbox version, such as 26.50 or 1.26.50. Do not use 26.x.');
  return value.replace(/^1\./, '');
}

function coordinate(n) {
  if (!Number.isSafeInteger(n) || Math.abs(n) > 30000000)
    throw new Error('Coordinates must be whole blocks within ±30,000,000.');
  return n;
}
function label(value, field, max = 160) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error('Invalid ' + field + '.');
  return value.trim();
}

export function validateBundle(raw, target, engines = VALIDATED_ENGINES) {
  if (!raw || raw.schemaVersion !== 1 || raw.edition !== 'bedrock' || raw.dimension !== 'overworld')
    throw new Error('Expected a version 1 Bedrock Overworld data bundle.');
  const seed = seedString(raw.seed), version = exactVersion(raw.version);
  if (seed !== seedString(target.seed)) throw new Error('This data belongs to a different seed.');
  if (version !== exactVersion(target.version)) throw new Error('This data belongs to a different Bedrock version.');
  const source = raw.source;
  if (!source || !['observed', 'predicted'].includes(source.kind))
    throw new Error('Data must declare observed or predicted provenance.');
  const name = label(source.name, 'source name');
  const evidence = label(source.evidence, 'source evidence', 2000);
  const engine = source.kind === 'predicted' ? engines.find(e =>
    e.id === source.engineId && e.revision === source.engineRevision &&
    e.version === version && e.edition === raw.edition && e.dimension === raw.dimension) : null;
  if (source.kind === 'predicted' && !engine)
    throw new Error('This prediction engine has not passed validation for this exact Bedrock version. No data was loaded.');
  if (!Array.isArray(raw.structures) || raw.structures.length > 5000)
    throw new Error('Expected at most 5,000 structures.');
  const structures = raw.structures.map(p => ({
    type: label(p.type, 'structure type', 80), x: coordinate(p.x), z: coordinate(p.z),
    ...(p.y === undefined ? {} : {y: coordinate(p.y)})
  }));
  if (!Array.isArray(raw.biomes) || raw.biomes.length > 64)
    throw new Error('Expected at most 64 biome tiles.');
  let cells = 0;
  const biomes = raw.biomes.map(tile => {
    const {width, height, step} = tile;
    if (![width, height].every(n => Number.isSafeInteger(n) && n > 0 && n <= 512) ||
        !Number.isSafeInteger(step) || step < 1 || step > 256)
      throw new Error('Invalid biome tile dimensions or sample spacing.');
    cells += width * height;
    if (cells > 262144) throw new Error('Biome data exceeds the 262,144 sample limit.');
    const x = coordinate(tile.x), z = coordinate(tile.z), y = coordinate(tile.y);
    coordinate(x + width * step); coordinate(z + height * step);
    if (!Array.isArray(tile.palette) || !tile.palette.length || tile.palette.length > 256)
      throw new Error('Missing biome palette.');
    const palette = tile.palette.map(p => {
      if (!/^#[0-9a-fA-F]{6}$/.test(p.color)) throw new Error('Invalid biome color.');
      return {name: label(p.name, 'biome name', 80), color: p.color};
    });
    if (!Array.isArray(tile.samples) || tile.samples.length !== width * height ||
        !tile.samples.every(n => Number.isInteger(n) && n >= 0 && n < palette.length))
      throw new Error('Biome sample count or palette index is invalid.');
    // Samples are points at x+i*step,z+j*step, at a stated Y. Never paint
    // intervening blocks as known: coarse samples are not exact boundaries.
    return {x, z, y, width, height, step, palette, samples: [...tile.samples]};
  });
  return {schemaVersion: 1, edition: 'bedrock', dimension: 'overworld', seed, version,
    source: {kind: source.kind, name, evidence,
      ...(engine ? {engineId: engine.id, engineRevision: engine.revision} : {})}, structures, biomes};
}

export function biomeAt(bundle, x, z, y) {
  for (const t of bundle?.biomes || []) {
    if (t.y !== y) continue;
    const ix = Math.round((x-t.x)/t.step), iz = Math.round((z-t.z)/t.step);
    if (ix < 0 || iz < 0 || ix >= t.width || iz >= t.height) continue;
    const sx = t.x+ix*t.step, sz = t.z+iz*t.step;
    if (Math.hypot(x-sx,z-sz) > Math.min(2,t.step/2)) continue;
    return {...t.palette[t.samples[iz*t.width+ix]], x: sx, z: sz, y: t.y};
  }
  return null;
}
