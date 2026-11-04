# World generation integration research

## Target
- Minecraft Bedrock 26.x
- Full signed 64-bit seed: 3022187552114785111
- Overworld biome map and structure markers
- Host as a static GitHub Pages PWA if possible

## Candidate engines
1. SeedForge: https://github.com/fwsoapy/seedforge
   - MIT-licensed client-side WebAssembly/cubiomes approach
   - Supports Bedrock 1.18+ and version-dependent biome/structure generation according to project documentation
   - **Important:** its seed-search documentation describes 32-bit Bedrock seed search; independently verify whether its *single-seed* path accepts and preserves the full 64-bit Bedrock seed before integration.
   - Verify build artifacts, license notices, bundle size, iOS Safari compatibility, and exact version mapping.
2. SeedFinder: https://github.com/zebedelu/SeedFinder
   - MIT-licensed Bedrock structure predictions through a native engine/API
   - Requires verifying hosted API access, CORS, reliability, rate limits and seed precision. Do not assume it provides a biome raster.

## Accuracy rules
- Never truncate the user's seed to a JavaScript Number or to 32 bits. Pass decimal seed as a string, and use BigInt when supported by the engine.
- Distinguish *predicted* structure positions from in-game confirmed locations.
- Version-dependent biome and placement rules must be tested before showing any results.
- (0,0) is map origin, **not** a verified world spawn.
- No real biome/structure predictions are currently integrated. Existing grid and waypoint markers remain user-entered only.
- Do not scrape or copy Chunkbase's proprietary code.

## Next implementation steps
1. Inspect SeedForge's licensing, build output and single-seed interface.
2. Run reference comparisons using the complete seed and target Bedrock version.
3. Produce a small bounded biome tile and structure data set; test mobile rendering.
4. Add explicit predicted/confirmed labels, version selector and filters.
5. Version the service worker cache so Home Screen installs receive updates.

User can provide Xbox house coordinates later; they are not required for this work.

## Integration checkpoint — 2026-11-04

Implemented in `world-data.mjs` and the map UI:
- Full signed 64-bit decimal seed validation, without Number conversion.
- Exact Bedrock release matching (26.x is intentionally rejected).
- Provenance-aware data bundles, Y-specific biome sample layers and legends,
  structure filtering/navigation, and isolated waypoint storage.
- Prediction approval registry keyed by engine revision, release, edition and
  dimension. It remains empty pending actual Bedrock game reference fixtures.
- Versioned PWA cache with the new module precached, scoped cache cleanup,
  network-first updates and offline fallback.
- Regression tests for seed precision, version isolation, negative coordinates,
  sample orientation/Y, malformed data and unapproved engines.

`research/reference-probe.json` records live endpoint responses for the full
seed, with URLs, timestamps, CORS headers and an explicit research-only status.
It is not an approved/generated world map and is not loaded by the app.
Reproduce with `node scripts/probe-reference.mjs` (two bounded API requests).

Blocking accurate automatic maps: the exact Xbox version is unknown (user is
away); SeedForge's Bedrock biome assumptions and documented structure shifts
need in-game checks; SeedFinder's API cannot select a Bedrock release and its
hosted docs differ from repository routes. No predictions were promoted to
verified data, and no guessed biome raster was shipped.

Next: obtain the exact version, pin an engine that targets it, collect real
Bedrock/BDS fixtures at known Y and structure locations, run comparisons, then
register only passing capabilities and connect the engine producer to bundles.
