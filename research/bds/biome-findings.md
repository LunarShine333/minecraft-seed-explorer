# First actual biome comparison

Official BDS 1.26.61.1 build 53069370, full seed 3022187552114785111,
no experimental toggles. Added a read-only script behavior pack using stable
@minecraft/server 2.0.0 Dimension.getBiome. It contains no biome or terrain
definitions. Read 36 points in a 3x3 grid at Y -48, 0, 64 and 128; all reads
succeeded after ticking-area loading. Server stopped cleanly after collection.

Pinned core: FragrantResult186/cubiomes-bedrock
294c72ab0392dd818a91d293dbd5774d4874d64b, MC_26_50 candidate mode.

- Block-scale lookup (scale 1): 29/36 match, report retained.
- Quart-scale lookup (scale 4), x/4,y/4,z/4 for these coordinates:
  **36/36 match**. All current coordinates are divisible by four, including
  negatives; this does not yet validate floor division for other negative points.
- This suggests sampling resolution caused these mismatches, rather than
  proving stable 26.60 has identical generation to 26.50 everywhere.

Next validation must include non-multiple-of-four coordinates, negative cell
boundaries, additional biomes, larger areas and known preview ice-cave points.
Do not approve a global engine from these 36 nearby samples.
The C sampler records the quart lookup used for the successful comparison.
The JSON candidate/report deliberately retain the failed block-scale comparison
so the original mismatch evidence is not lost.
