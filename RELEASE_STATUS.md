# Checked tile atlas release status

Personal Overworld site: exact seed `3022187552114785111`, Xbox target Bedrock
26.60, experiments off. Original Xbox chunk generation release remains unknown.

## Available

- Continuous checked mode loads adjoining tiles on pan/zoom or sample Y changes.
- 63 native-data tiles: original 512 × 512 plus an adjoining 2176 × 256 strip
  at Y64 (819200 cells); 256 × 256 at Y-48/0/128; and 128 × 128 Cherry Grove
  at Y103. Total 1032192 distinct height cells. Coverage remains bounded.
- 36 selected native locator landmarks across 13 types; Y unknown.
- Approximate home property marker at X128 Z24; not verified in-game.
- Direct native Cherry Grove navigation and a button to fit checked coverage.
- Biome finder (visible loaded tiles in continuous mode), structure search,
  coordinate jumps, device waypoints/backups and existing full-area imports.
- Request deduplication, four concurrent loads, bounded tile cache and
  stale-viewport protection. Service worker caches requested tiles for offline
  reuse; regions never downloaded are unavailable offline.

## Verification and limits

34 Node and 14 Python tests pass. Existing 462848 cells retain their original
biome names/colors. All 589824 newly collected API readings, including an
independent 16384-cell control, are checked against committed native evidence.
The control and old Cherry Grove patch match their prior native fixtures.
Browser preview confirms streaming 50 Y64 tiles and Cherry Grove navigation.
Physical Safari/iPhone/iPad testing remains outstanding.

The source world used official BDS 1.26.61.1 build 53069370, experiments off;
these are current test-world observations, not reads of the user's Xbox save.
Older Xbox chunks may differ. Unknown areas and missing sample heights stay
unknown. The checked strip expands coverage toward the Cherry Grove; full-world coverage
is unfinished. It is a biome slice at the stated Y, not a safe travel route or
a surface elevation model.

No prediction engine is approved. Default quart matched 246541/262144 cells;
fractional sampling matched 248206/262144 with new errors. Alternate Voronoi
hashes were worse. These rejected experiments must not be used as validated
world maps. Full-world generation and exhaustive structure discovery are
unfinished. The user wants Safari/Add to Home Screen, no separate app package
or custom icon.

See WORLDGEN_PLAN.md for the resumable implementation checkpoint.
