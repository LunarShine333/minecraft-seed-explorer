# Checked tile atlas release status

Personal Overworld site: exact seed `3022187552114785111`, Xbox target Bedrock
26.60, experiments off. Original Xbox chunk generation release remains unknown.

## Available

- Continuous checked mode loads adjoining tiles on pan/zoom or sample Y changes.
- 29 native-data tiles: 512 × 512 at Y64, 256 × 256 at Y-48/0/128,
  and 64 × 64 Cherry Grove at Y103. Geographic coverage remains bounded.
- 36 selected native locator landmarks across 13 types; Y unknown.
- Approximate home property marker at X128 Z24; not verified in-game.
- Biome finder (visible loaded tiles in continuous mode), structure search,
  coordinate jumps, device waypoints/backups and existing full-area imports.
- Request deduplication, four concurrent loads, bounded tile cache and
  stale-viewport protection. Service worker caches requested tiles for offline
  reuse; regions never downloaded are unavailable offline.

## Verification and limits

31 Node and 10 Python tests pass. All 462848 tiled cells retain their original
native-source biome names/colors. Original native evidence remains in each tile
file. Browser preview confirms automatic loading and Cherry Grove navigation.
Physical Safari/iPhone/iPad testing remains outstanding.

The source world used official BDS 1.26.61.1 build 53069370, experiments off;
these are current test-world observations, not reads of the user's Xbox save.
Older Xbox chunks may differ. Unknown areas and missing sample heights stay
unknown. Coverage has been reorganized for streaming, not expanded globally.

No prediction engine is approved. Default quart matched 246541/262144 cells;
fractional sampling matched 248206/262144 with new errors. Alternate Voronoi
hashes were worse. These rejected experiments must not be used as validated
world maps. Full-world generation and exhaustive structure discovery are
unfinished. The user wants Safari/Add to Home Screen, no separate app package
or custom icon.

See WORLDGEN_PLAN.md for the resumable implementation checkpoint.
