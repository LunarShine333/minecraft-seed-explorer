# Checked tile atlas release status

Personal Overworld site: exact seed `3022187552114785111`, Xbox target Bedrock
26.60, experiments off. Original Xbox chunk generation release remains unknown.

## Available

- Continuous checked mode loads adjoining tiles on pan/zoom or sample Y changes.
- 652 native-data tiles with 10,682,368 height-specific readings; Y64 has
  635 tiles and 10,403,840 readings. The latest adjoining extension covers
  X -4352..-4097, Z -1024..-513 at Y64. Coverage remains bounded.
- Map requests have 15-second deadlines. Failed visible views offer Retry visible
  map and retry on a connection-restored event without resetting the map.
- 36 selected native locator landmarks across 13 types; Y unknown.
- Approximate home property marker at X128 Z24; not verified in-game.
- Direct native Cherry Grove navigation and a button to fit checked coverage.
- Biome finder (visible loaded tiles in continuous mode), structure search,
  coordinate jumps, device waypoints/backups and existing full-area imports.
- Lossless wide-map PNG pages, exact native-cell tap inspection and known
  biome sample navigation. Unknown pixels remain transparent.
- Progressive tile display, a shared four-request concurrency cap, queued
  cancellation, request sharing, bounded tile cache and stale-viewport protection. Service worker caches requested tiles for offline
  reuse across site updates; regions never downloaded are unavailable offline.
  Revision-named overview images reuse stored bytes without a network round trip;
  native JSON and metadata still revalidate online. Browser storage eviction or
  clearing site data can remove offline downloads.

## Verification and limits

124 Node and 111 Python tests pass for the outerlink integration.
See `research/bds/north-westward-outerlink-infill-integration-checkpoint.md`
for current evidence and release state. The acquisition details below are historical. Original source cells remain preserved.
The west extension adds 127 native tiles (2080768 cells), with three independent
16384-cell control readings and 229376 repeated cells agreeing across runs.
Two interrupted acquisitions retain only completed tile records; 124 partial
rows are discarded. The final resumed acquisition completed all 61 requested
jobs and stopped cleanly. Committed evidence preserves the actual completion
status of each run. All 2326528 complete native cell readings are checked by
name against stored bundles, and re-export is reproducible.
The north extension adds 196608 direct native cells, with a matching independent
16384-cell control and a single completed 13-job run. Browser preview confirms
22/22 lossless Y64 pages and the adjoining north extension.
All 4096000 overview pixels match their native source colors, with transparent
unmeasured pixels. Stable page boundaries and reuse of current visible images
avoid repeatedly loading the same pages when panning across native tile edges.
The 35 active overview pages plus index total 178171 bytes versus 8499893 bytes
of native JSON; this is a stored-size comparison, not a Safari network benchmark.
Older immutable overview images remain for cached clients.
Service-worker lifecycle tests cover upgrade migration, offline replay, corrected
JSON revalidation, server/storage failures and scope boundaries. Browser QA also confirmed a failed visible tile recovers from 35/36 to 36/36
using Retry visible map. Physical Safari/iPhone/iPad testing remains outstanding.

The source world used official BDS 1.26.61.1 build 53069370, experiments off;
these are current test-world observations, not reads of the user's Xbox save.
Older Xbox chunks may differ. Unknown areas and missing sample heights stay
unknown. The checked rectangle connects home and Cherry Grove; full-world coverage
is unfinished. It is a biome slice at the stated Y, not a safe travel route or
a surface elevation model.

No prediction engine is approved. Default quart matched 246541/262144 cells;
fractional sampling matched 248206/262144 with new errors. Alternate Voronoi
hashes were worse. These rejected experiments must not be used as validated
world maps. Full-world generation and exhaustive structure discovery are
unfinished. The user wants Safari/Add to Home Screen, no separate app package
or custom icon.

See WORLDGEN_PLAN.md for the resumable implementation checkpoint.
