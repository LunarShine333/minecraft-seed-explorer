# Checked tile atlas release status

Personal Overworld site: exact seed `3022187552114785111`, Xbox target Bedrock
26.60, experiments off. Original Xbox chunk generation release remains unknown.

## Available

- Continuous checked mode loads adjoining tiles on pan/zoom or sample Y changes.
- 111 native-data tiles: 1024 × 1024 home-area square plus an adjoining
  2176 × 256 strip at Y64 (1605632 cells); 256 × 256 at Y-48/0/128; and
  128 × 128 Cherry Grove at Y103. Total 1818624 distinct height cells.
  Coverage remains bounded.
- 36 selected native locator landmarks across 13 types; Y unknown.
- Approximate home property marker at X128 Z24; not verified in-game.
- Direct native Cherry Grove navigation and a button to fit checked coverage.
- Biome finder (visible loaded tiles in continuous mode), structure search,
  coordinate jumps, device waypoints/backups and existing full-area imports.
- Lossless wide-map PNG pages, exact native-cell tap inspection and known
  biome sample navigation. Unknown pixels remain transparent.
- Progressive tile display, a shared four-request concurrency cap, queued
  cancellation, request sharing, bounded tile cache and stale-viewport protection. Service worker caches requested tiles for offline
  reuse; regions never downloaded are unavailable offline.

## Verification and limits

46 Node and 20 Python tests pass. Original source cells remain preserved. The
home acquisition contains 802816 direct API readings, including an independent
16384-cell control; all are checked against committed native evidence. The prior
route acquisition and its own control remain tested. Native controls and the old
Cherry Grove patch match their prior fixtures. Re-export is reproducible.
Browser preview confirms 13 lossless Y64 overview pages, exact tap inspection
and biome sample navigation into detail. All 1818624 overview pixels match
their native source colors, and all unmeasured pixels are transparent.
The complete overview assets total 108306 bytes versus 3770357 bytes of native
JSON; this is a stored-size comparison, not a Safari network benchmark.
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
