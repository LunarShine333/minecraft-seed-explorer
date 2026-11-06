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

## Xbox version confirmed

User checked the title screen at home and reported **v26.60**. Target Bedrock
release is now **26.60**, seed **3022187552114785111**. Earlier notes describing
the release as unknown are historical. The installed version does not establish
when existing chunks were generated or whether world experiments are enabled.
Do not approve an engine simply because the target version is now known.

Next validation should distinguish normal 26.60 generation from experimental
world settings and pre-existing chunks. Investigate FragrantResult186's
cubiomes-viewer-bedrock release notes, which mention 26.60 preview support;
preview support alone is not proof of compatibility with stable Xbox 26.60.

## Experiments-off engine investigation

User confirmed **Experiments are OFF**. Stable Bedrock 26.60 is the target.

Inspected and successfully built FragrantResult186/cubiomes-bedrock revision
`294c72ab0392dd818a91d293dbd5774d4874d64b` using `make -j2` and GCC.
Build success is not accuracy validation. Findings:

- `biomes.h` labels `MC_26_60` as **preview 26.60.29** and adds `ice_caves`.
- `biomenoise.c` selects `btree266` for `mc >= MC_26_60` unconditionally.
- `generator.h` exposes flags for large biomes, beta ocean and ocean variants;
  no experiments-off switch is declared there. Stable-versus-preview mapping
  therefore needs explicit investigation, not just selecting MC_NEWEST.
- GCC warns about possible double free/use-after-free in `getSpawn`;
  do not invoke that path before inspecting/fixing it. The map still treats
  origin as origin, not a verified spawn.

No candidate outputs were approved for the user map. Next bounded step:
compare version-specific biome trees and release data for non-experimental
26.60, then produce reference samples with the full seed at explicit Y.
Native build is available for that comparison; browser/WASM integration and
in-game comparisons remain outstanding.

## Full-seed native comparison results

Ran `scripts/compare-bedrock-biomes.c` against pinned core revision
294c72ab0392dd818a91d293dbd5774d4874d64b with the exact uint64 seed.
Compared MC_26_50 and MC_26_60 at 4,225 points per Y, X/Z -1024 through
1024 inclusive, spacing 32 blocks (16,900 paired samples total).

| Y | Different samples | Preview ice cave samples |
|---|---:|---:|
| -48 | 5 | 5 |
| 0 | 202 | 202 |
| 64 | 0 | 0 |
| 128 | 0 | 0 |

All observed differences in this bounded sample coincide with preview ice
caves. This is evidence of a concrete experiments mismatch underground,
not proof that MC_26_50 is correct for stable 26.60 or that surface maps
match globally. No actual Bedrock game outputs were compared. Do not
approve either mode from this test alone. Keep underground generation gated.
Harness is saved so the test can be repeated and expanded before WASM work.

## Game-reference comparison harness

Added `scripts/validate-engine.mjs` and regression coverage. Run:
`node scripts/validate-engine.mjs game-reference.json engine-output.json report.json`.

Reference schema: `bedrock-game-reference-v1`; output schema:
`bedrock-engine-output-v1`. Both declare string seed, exact version, edition,
dimension, `experiments:false`, and `biomes:[{x,y,z,biome:"minecraft:..."}]`.
Reference source requires `type:"xbox"` or `"bedrock-dedicated-server"` and
an evidence string. Engine output requires `engine:{id,revision}`.

Missing coordinates and wrong Y produce mismatches; duplicate points,
wrong world settings and missing provenance are rejected. Reports retain
full seed identity and explicitly do not auto-approve an engine. All 9 Node
tests pass. Synthetic unit tests are not actual game reference evidence.
Real game fixtures and structure validation remain outstanding.

## World creation date and latest sampling check

User reports the Xbox world was created **October 16, 2026**. Do not infer an
exact original game version from the date alone. Current version remains 26.60,
Experiments off; already generated Xbox chunks may reflect earlier generation.
The disposable current-release server map is not a direct read of the Xbox save.

Retested core's genBiomeNoiseChunkSection with X/Y/Z iteration order and a
persistent per-chunk cache through sections -4..19. Raw quart results still
matched 935/1156 saved API references, identical to independent quart sampling.
Chunk-generation traversal order does not fix the observed mismatch.

## Continuous checked tile checkpoint — 2026-11-05

Implemented a viewport-driven checked atlas in `checked-tiles.mjs`. The page
opens in continuous mode, requests adjoining stored tiles as the viewport or
sample height changes, and keeps unknown areas blank. Tile requests use four
workers, shared in-flight requests and a 32-tile LRU. UI generation tokens reject
stale viewport results after newer requests, clearing or switching layers.
Existing imports and device waypoint storage remain supported.

`node scripts/build-checked-tiles.mjs` reproducibly splits the existing native
bundles into 29 files (128 × 128 maximum), with no fitted predictions:
16 Y64 tiles, four each at Y-48/0/128, and one Y103 Cherry Grove tile.
Every file retains its original source evidence; the catalog describes the
combined coverage. This reorganizes **462848 existing distinct height cells**;
it does not expand their geographic footprint or solve global generation.
The tile catalog can grow without changing rendering code. Full-seed identity,
exact target release and tile bounds are validated before display.

Added a separate approximate home marker at X128 Z24 (house, garden and barn),
without adding, replacing or deleting any device waypoint. Home returns to Y64.
No app packaging or custom icon work is planned.

Validation: 31 Node tests and 10 Python decoder/export tests pass. New tests
compare every tile cell/name/color against its original native source, exercise
adjoining negative-coordinate edges, cache reuse/eviction, network failure and
retry, concurrent view snapshots, and reject wrong seed/height/provenance.
Browser preview confirmed initial automatic loading, unknown regions at a
coordinate jump, and the Y103 Cherry Grove loading in continuous mode.
Physical Safari/iPhone/iPad testing remains outstanding.

Next: expand checked coverage through native test-world acquisition and append
new tiles, while investigating Bedrock-specific climate/access behavior with
new evidence. Do not rerun rejected fitted quart/Voronoi experiments. The
retained scratch `bds-validation/bedrock_server` is truncated (61669376 bytes;
ELF section headers expected at 265500360). The existing official ZIP was intact:
restored a separate 265500488-byte executable with successful ZIP CRC validation
to `/workspace/scratch/d1fee5f737c4/bds-restored/bedrock_server` (SHA256
`d75212f20511eac3e3a1a45c5b57646d697a33038d5e41fa92113e1fbc14efab`).
It was not executed in this increment. Reuse the intact official archive if the
restored scratch executable is missing; no fresh download is needed. Never
substitute candidate predictions for missing native regions.

## Native route expansion checkpoint — 2026-11-05

Collected **589824 direct native API biome readings** in a fresh disposable
BDS 1.26.61.1 build 53069370 world: 573440 route/destination cells plus an
independent 16384-cell control. Seed was the exact configured decimal string;
`level.dat` verifies it, default generator, and all experiments off. No blocks
were modified; only temporary ticking areas loaded chunks. Server stopped cleanly.
No Xbox save was accessed. Original Xbox generation release remains unknown.

Published atlas content prepared in this increment:
- **34 new Y64 tiles**, forming a continuous 2176 × 256 strip at X -2432..-257,
  Z -384..-129, adjoining the original 512 × 512 map. Total Y64 coverage:
  **819200 cells across 50 tiles**. This is a sampled biome strip, not a safe
  walking route or a height/surface terrain model.
- **128 × 128 at Y103** around the native Cherry Grove point. All 4096 cells
  of the old patch match exactly; it is superseded only in the atlas catalog,
  while its original import file remains available. Net additional distinct
  height cells: **569344**. Atlas total: **1032192 cells across 63 tiles**.
- Independent native Y64 control matches all 16384 prior stored cells, retaining
  the documented stone_beach/stony_shore name alias. No fitted output is used.
- Added a direct Cherry Grove navigation button/marker and Fit checked biome
  coverage. Existing saved waypoints are unchanged. Unknown terrain stays blank.

Evidence is committed as `research/bds/cherry-route-native.log.gz`, with exact
settings, per-tile provenance and SHA256 in `cherry-route-manifest.json`.
`research/bds/cherry-route-probe.js` is the read-only acquisition script.
Re-export from retained evidence (no running game required):

```
python scripts/import_native_route.py --log research/bds/cherry-route-native.log.gz --settings research/bds/cherry-route-settings.json
node scripts/build-checked-tiles.mjs
```

The importer rejects incomplete/aborted runs, missing/duplicate rows, unexpected
seed/version/experiments, invalid palette indices and failed prior-fixture
comparisons before writing outputs. Atlas builder checks all overlap cells
before replacing a smaller tile. 34 Node tests and 14 Python tests pass,
including every exported cell against the retained native evidence and a
continuous pan path along the strip. Browser preview confirmed 50 streamed
Y64 tiles and direct navigation to the enlarged native Y103 destination.
Physical Safari/device gesture testing remains outstanding.

Scratch acquisition environment: `/workspace/scratch/d1fee5f737c4/bds-route`;
world `seed-explorer-route`. Full official ZIP is again available at
`/workspace/scratch/d1fee5f737c4/bds-official.zip` (98093051 bytes). The first
download was incomplete; a normal HTTP range resume completed it and ZIP
extraction succeeded. Prior scratch directory `5f64400feb0f` had expired.
Do not rely on scratch survival: code, settings and measured cells are in GitHub.

Next useful increment: widen native coverage near home or the Cherry Grove,
then add further useful destinations. A compact overview/LOD layer and a global
request pool would help if the catalog grows much larger. The precise full-world
engine remains unresolved; investigate only with new Bedrock-specific evidence,
without repeating rejected quart/fractional/Voronoi fitting. No engine capability
has been approved. BDS 1.26.61.1 observations retain the 26.60 target/older-chunk
caveats; passing these tests does not establish a global Xbox prediction engine.

## Home-area expansion and progressive streaming — 2026-11-05

Added **48 native Y64 tiles / 786432 new cells**, expanding the home-area square
from 512 × 512 to **1024 × 1024**, X/Z -256..767. Together with the existing
Cherry Grove strip, Y64 now has **1605632 cells across 98 tiles**. Complete atlas:
**1818624 distinct height cells / 111 tiles**, with other sample heights unchanged.
The new area includes biome observations around existing locator landmarks at
(264,152), (184,712) and (760,680); it does not add or validate new structures.

Acquired **802816 direct native API readings** in fresh disposable world
`seed-explorer-home`, official BDS 1.26.61.1 build 53069370: 48 new tiles plus
one independent 16384-cell control. The control matches all prior native control
cells. level.dat confirms exact string seed, default generator and experiments
off. No block edits or Xbox save access; server stopped cleanly. Evidence,
settings, manifest, control and probe are under `research/bds/home-area-*`.
Re-export without a running server:

```
python scripts/import_native_home.py --log research/bds/home-area-native.log.gz --settings research/bds/home-area-settings.json
node scripts/build-checked-tiles.mjs
```

The native row/settings validator is shared with the route importer. The home
exporter additionally checks the complete expected footprint and independent
control before writing any files. All 802816 readings are compared with committed
outputs in tests, and re-export reproduces all bundle bytes and the manifest.

Replaced independent per-view request bursts with one **four-request pool shared
across views and store instances**. View cancellation immediately stops further
enqueueing; queued requests with no live consumer are skipped. Queued tiles still
needed by a newer view are shared, and already active requests may finish into
the cache. Each validated tile is delivered progressively; the UI batches paints
with requestAnimationFrame and rejects stale/cancelled snapshots. Height changes
show the correct pending Y and clear the old legend immediately. Waypoints and
prediction gates remain unchanged.

**40 Node tests and 18 Python tests pass.** New concurrency tests cover shared
caps, progressive delivery before a slow tile, cancelled queued work, sharing
with a newer viewport, and already-aborted views. Browser preview confirmed
98/98 Y64 tiles rendering after navigation interrupted by a Cherry Grove jump,
then returning to home and fitting coverage. Physical Safari testing is still
outstanding; Chrome preview is not an iPhone/iPad verification.

Scratch server/resources remain at `/workspace/scratch/d1fee5f737c4/bds-route`;
its current configuration selects the disposable home world and home probe.
The old route probe remains committed for reproducibility. If scratch expires,
restore official BDS assets and use the committed scripts; no Xbox save is needed.

Next: a compact overview/LOD layer to keep wide zooms light before adding many
more native tiles, plus biome destination discovery. The full-world generator
remains unresolved and no rejected fitted sampling experiments were repeated.
Only native observed cells are published; older Xbox chunks may differ from
this 1.26.61.1 source while the user's target stays 26.60, experiments off.

## Lossless wide-map overview checkpoint — 2026-11-05

Wide views now use **lossless 512 × 512 PNG pages**, with exactly one original
native cell per pixel and transparent unknown areas. There is no majority
aggregation, fitted boundary, interpolation, predicted terrain or new coverage.
All **1818624 existing native cells** retain their exact original colors.
The full atlas has 26 image pages plus an index: **108306 stored bytes**, versus
**3770357 bytes** for the dense tile JSON (97.1% smaller stored representation).
This is a file-size comparison, not a measured Safari network benchmark.

At scales below 0.6 screen pixels per block, the viewport streams PNG pages
through the existing four-request pool. Fitting all Y64 coverage requires
**13 image pages plus the compact index**, replacing 98 dense JSON tile loads.
At closer zooms it switches back to the native cell tiles. A 16-image LRU bounds
cached raster pages. Metadata is matched to the exact catalog revision; stale
indices fail closed and fall back to checked cell tiles. Image filenames include
that revision, and image dimensions are checked before display.

Tap inspection always reads the corresponding original native cell tile,
including when viewing an overview; it never infers a biome name from a color.
Unmeasured coordinates return unknown without a tile request. Negative taps use
block floor coordinates. The overview legend offers exact native witness cells
for biome discovery. These are labeled known samples, not globally nearest
occurrences; following one zooms into cell detail. Existing nearest-loaded-cell
search remains available in detail mode. Source version/older-Xbox-chunk caveats,
structure provenance and device waypoints are retained.

`node scripts/build-checked-tiles.mjs` now also runs the standard-library Python
raster builder, so a rebuilt catalog cannot silently retain a stale overview.
The atlas index and PNG SHA256 digests are committed under `data/overview/`.
No external image dependency, image generation model, paid service or native
server run was needed: these are a rendering of existing native measurements.

**46 Node tests and 20 Python tests pass.** Tests independently decode the PNGs,
check every original native pixel, verify transparent alpha at every unmeasured
pixel, and check each biome witness against its original native cell. Other
checks cover catalog/version/seed identity, stale index rejection, unsafe paths,
coverage loss, image dimensions, cancellation, fallback, and one-tile exact
inspection. Browser preview confirmed 13/13 Y64 overview pages, native biome tap
inspection, and navigation from a known Cherry Grove witness into detail.
Physical Safari/iPhone/iPad testing remains outstanding.

Next: expand useful native coverage and/or add more native located destinations;
retain these lossless pages as coverage grows. The full-world Bedrock generator
is still unresolved, and no rejected quart/fractional/Voronoi experiments were
repeated or promoted. The atlas remains bounded test-world observations for the
exact seed; Xbox target remains 26.60, experiments off, source 1.26.61.1, with
original Xbox generation version unknown.

## 2026-11-06 — fill the western checked rectangle

Added 127 directly sampled native Y64 tiles (2080768 new cells). Y64 now covers
X -2432..767, Z -384..767 continuously: 25 × 9 tiles, 3200 × 1152 cells.
The catalog contains 238 tiles / 3899392 distinct height cells, including 225
Y64 tiles. Other heights, the approximate home marker, all 36 partial native
structure observations and device waypoint storage remain as before. This
is a biome slice at the stated Y, not a safe route or surface elevation model.

`research/bds/west-area-plan.json` pins the exact seed, footprint, source build,
experiments-off setting and independent home control fixture. Disposable native
world runs stalled twice (cause unknown); each was interrupted after retaining
only native TILE records with all 128 rows. Partial rows (64 + 60) were discarded.
A resumed 61-job run completed with its genuine DONE record and stopped cleanly.
No server remains running. All three level.dat settings were independently
checked: exact decimal seed, default generator, experiments off, source BDS
1.26.61.1 build 53069370. No Xbox save was accessed or modified.

The evidence archive preserves each run's actual completion state and settings.
All three independent 16384-cell controls match the earlier home fixture; all
229376 overlapping cell readings agree. Tests compare all 2326528 complete
native readings with exported names. No incomplete row group becomes coverage.
Reproduce with:

```sh
python scripts/import_native_area.py --runs research/bds/west-area-native-runs.json.gz --plan research/bds/west-area-plan.json
node scripts/build-checked-tiles.mjs
```

The new plan-based importer checks controls and every overlapping cell across
runs, then requires the full planned union before writing anything. Existing
single-run imports remain strict by default. Full and resumed native probe
sources are committed; the scratch server configuration currently selects the
finished west-final world and resumed probe. Future acquisitions should use
a new disposable world/plan rather than resampling this rectangle.

The lossless overview has 34 active pages (21 at Y64), revision
`2d0b48ab5334063d938e53bd5bc84a1476b3740671d35d4304906c0cc5d7a2bd`.
Its 174741 stored bytes compare with 8092090 dense JSON bytes, about 97.84%
smaller; this is not a measured network or Safari benchmark. Every native cell
retains one original-color pixel; all unsampled pixels remain transparent. Old
immutable image filenames are retained for cached clients. The viewport now
keys wide views on 512-block page boundaries rather than 128-block native tile
boundaries, and pins the current frame's images alongside the 16-image LRU.
This allows a 21-page view to be reused without evicting its own visible images.

50 Node / 25 Python tests pass, including exact footprint, all native source
readings, control/overlap rejection, byte-reproducible exports, every raster
pixel/unknown alpha, stable viewport keys and reuse beyond the background LRU.
Browser preview showed the filled rectangle and 21/21 Y64 overview pages.
Physical Safari/iPhone/iPad testing remains outstanding.

Next: new native destination coverage or generation research backed by new
evidence. Full-world generation remains unresolved; no rejected quart,
fractional or alternate Voronoi experiments were repeated or promoted. Target
Xbox 26.60, source 1.26.61.1, experiments off and unknown original Xbox chunk
version caveats remain explicit. No new structure validation is claimed.

## 2026-11-06 — retain downloaded checked tiles through site updates

Resumed from main `6c660076b8e18575cb4158b2d26933148b1d8cdf`; no open PRs.
Found that activation deleted the previous app cache, including downloaded native
tiles and overview images. Added a separate version-independent checked-data
cache, migration of scoped GET tile JSON / revision-named PNGs before old-shell
deletion, and recovery preservation if migration fails. Unrelated caches and
other paths/origins are excluded. Failed installs still leave the old worker.

Only revision-named immutable PNGs use cache-first loading. Native JSON,
metadata and application assets still request current online responses; a
network failure or non-success response falls back to a previously successful
response. Failed responses never replace checked data. Registering fetch
lifetime work synchronously keeps background cache writes within the worker
event lifetime. Storage open/write failure does not block online loading.
Existing current checked-data responses win during migration.

58 Node / 25 Python tests pass. Eight new service-worker lifecycle tests run
the actual worker source with simulated CacheStorage and network failures:
upgrade/offline replay and unknown-cell 503; immutable PNG network avoidance;
corrected JSON revalidation; server failure fallback; current metadata refresh;
storage failure; scope/method boundaries; existing-response preservation; and
failed-migration recovery (several scenarios share a test). No browser offline
simulation or physical Safari test was performed; those remain verification
limits. Browser storage eviction/clearing can still remove downloaded data.

No new coverage or native-generation claim: 238 checked tiles / 3899392 height
cells remain unchanged. Seed, source/target versions, experiments-off, older
Xbox-chunk caveats, native structure evidence and device waypoints are retained.
No BDS execution was needed for this cache-only increment; prior acquisition
controls and raster source comparisons were rerun. Next: useful new native
destinations or generation research justified by new evidence. Full-world
generation remains unresolved.

## 2026-11-06 — native northern monument approach

Resumed from main `8d5f9e335227a3985bca466169572a335560638a`; no open PRs.
Added 12 directly native Y64 tiles (196608 cells), X -512..-1 / Z -768..-385.
This 512 × 384 extension adjoins the earlier rectangle and includes the biome
slice at the previously located monument X -312 Z -680. No new structure
locator, footprint, Y or in-game verification claim is made.

The official BDS 1.26.61.1 build 53069370 completed all 13 requested jobs in a
new disposable `seed-explorer-north-monument` world, then stopped cleanly.
level.dat independently confirms exact string seed `3022187552114785111`,
default generator and experiments off. A repeated 16384-cell control matches
the earlier home fixture. All 212992 native readings (new cells plus control)
match exported biome names. No Xbox save access or block edits.

Plan, read-only probe source, compressed original native log/settings, control
and manifest are committed under `research/bds/north-monument-*`. Reproduce:

```sh
python scripts/import_native_area.py --runs research/bds/north-monument-native-runs.json.gz --plan research/bds/north-monument-plan.json
node scripts/build-checked-tiles.mjs
```

The catalog now has 250 tiles, 237 at Y64: 3883008 Y64 cells / 4096000 total
height cells. Other heights and existing device waypoints are retained. The
lossless overview has 35 active pages, 22 at Y64, revision
`224d8df965d1f1a1575d58beba56b610d8335b019f111df854ed573bab053de0`.
Overview assets/index total 178171 bytes against 8499893 dense JSON bytes
(stored size comparison only). Older immutable overview images are retained.

60 Node / 27 Python tests pass. New checks cover the exact 12-tile footprint,
all 212992 native readings, reproducible archive/export/control, northward
panning, correct unknown borders and absent other heights. All source-color
pixels and unknown alpha remain verified. Browser preview showed 22/22 pages
and the contiguous north extension. Physical Safari testing remains outstanding.

No generator experiments repeated or promoted. Full-world generation is still
unresolved. Xbox target 26.60 / native source 1.26.61.1, experiments off, unknown
original Xbox generation release and older-chunk caveats remain explicit. Next
useful native expansion could reach the shipwreck near X -1272 Z -840 or an
eastern destination, while generation research still needs new evidence.
The scratch server selects the completed north-monument world and probe; no
server remains running. Initial reference README was refreshed to prevent its
old pre-execution instructions from being mistaken for current project status.

## 2026-11-06 — recover failed or stalled visible map requests

Resumed from main `eeeadf27f65460d166d25b348ebd0b12f12572cf`; no open PRs.
The viewport key previously prevented the same failed view from reloading;
network/image work also had no deadline and could hold the shared four-request
pool indefinitely. Added `checked-network.mjs` with 15-second request deadlines
covering JSON headers/body and image loading. Timeout aborts fetch/image work,
clears handlers and releases the pool slot. Whole-area imports also use this
loader. Existing source validation remains authoritative after network success.

Failed final views show Retry visible map. Manual retry resets only the view
key, keeps the existing store/caches and preserves coordinates/height/zoom. A
connection-restored event retries a failed view once; failures do not cause a
background retry loop. Changing layer/view hides obsolete retry controls and
existing epoch/cancellation checks still reject stale results. The service
worker precaches the new loader and advances to v18; durable native downloads
remain in the checked-data cache. No device waypoints are changed.

65 Node / 27 Python tests pass. Five new tests cover exact seed strings, HTTP
and parse errors, stalled headers/body even when abort is ignored, raster
success/error/timeout cleanup, shared-slot release and retry with a retained
neighbor. Browser preview used a preview-only one-shot failure for native tile
64_0_0: 35/36 loaded with a visible gap and Retry visible map; clicking it in
the same view produced 36/36 and hid the control. Preview fault code was never
added to tracked source and was removed before stopping the preview. An earlier
missing-file test confirmed failure display; restoring a file triggered preview
live reload, so that was not counted as manual-retry proof. Physical Safari
verification remains outstanding.

Engine source audit is recorded in
`research/bds/engine-source-audit-2026-11-06.md`. Upstream HEAD remains the
already tested 294c72ab revision. The inspected Demeno fork is older and has no
new block-biome access implementation. No failed quart/fractional/Voronoi
experiments were repeated and no candidate was promoted. No BDS execution was
needed for this loading increment; existing native references and raster
comparisons were rerun. No new coverage: 250 tiles / 4096000 height cells.
Seed 3022187552114785111 remains a decimal string, Xbox target 26.60/source
1.26.61.1 with experiments off and older/unknown Xbox chunk version caveats
remain explicit. Full-world generation is unfinished. Next: more useful native
destination coverage or engine research backed by new algorithmic evidence.

## 2026-11-06 — restore execution and native shipwreck approach

Resumed main ae37e8e2fe552d9a77a83d549ff5cce6a7607da2. Execution is available
again; closed historical blocker draft #11. No other open implementation work.
Added 12 directly native Y64 tiles: X -1280..-897, Z -896..-385, adjoining the
existing rectangle at its southern edge. Includes the biome slice at the prior
shipwreck locator X -1272 Z -840; no new structure verification is claimed.
196608 additional cells; atlas 262 tiles / 4292608 height cells, including
249 Y64 tiles / 4079616 cells. Native source remains 1.26.61.1 build 53069370,
Xbox target 26.60, experiments off, exact decimal string seed, unknown original
Xbox generation release and older-chunk caveats unchanged. Waypoints unchanged.

Two fresh disposable BDS worlds were used. First run stalled after 12 complete
records (including control); stopped cleanly, discarding 92 partial rows. Second
run repeated the independent control and completed the remaining tile with DONE,
then stopped cleanly. Both level.dat files independently checked exact seed,
default generator and experiments off. 32768 control readings match the prior
home fixture. All 229376 complete native readings match exports; no Xbox save
access or block edits. Evidence, settings, plans, full/resume probes and manifest
are committed under research/bds/shipwreck-approach-*.

Reproduce with the plan-based importer and builder:
`python scripts/import_native_area.py --runs research/bds/shipwreck-approach-native-runs.json.gz --plan research/bds/shipwreck-approach-plan.json`
then `node scripts/build-checked-tiles.mjs`.

67 Node / 30 Python tests pass: new exact footprint, native evidence, control,
byte-reproducible export and continuous pan/unknown-border checks. Every original
pixel and unknown alpha is checked. Overview now has 37 pages (24 at Y64),
revision 14769db801c11b2a7bd49691520f2ac959b488ad18eb3a40af49cd279fcf7e9d.
190134 overview bytes versus 8909080 dense JSON bytes (stored size only).
Worker shell advances to v19; durable checked cache retained. No new browser
or physical Safari QA this data increment; physical device testing remains open.
Full-world generation remains unresolved; no rejected engine experiments rerun.
Next: useful eastern native coverage or engine research with new evidence.
No server remains running; scratch configuration selects finished resume world.

## 2026-11-06 — biome discovery across the checked atlas

Resumed main f61d72a308065e2bfc659e071bb97fc4d7c25978, no open PRs. Verified
GitHub Pages completed its shipwreck deployment and live catalog has 262 tiles;
previous run's pending deployment was propagation delay, not a publishing failure.

Added Browse all checked biomes at this Y in continuous mode. It reads the
compact, revision-validated overview index across the entire checked atlas,
including regions outside the viewport, and lists unique biome names at the
selected height. Go to checked sample selects the nearest recorded witness
among those representatives, then loads its original native tile and requires
the biome name to match before moving. This is not an exhaustive nearest-cell
search or surface-height model. No inferred cells or candidate engine outputs.
Existing device waypoints remain unchanged; navigation fills the waypoint form
without saving. Height/layer changes invalidate pending UI results and disable
old selections. Network/index/native tile failures are surfaced with retry via
Browse or Go; index failures remain retryable. Service worker v20 precaches the
new module and retains durable checked downloads.

71 Node / 30 Python tests pass. New tests cover complete height-filtered names,
index reuse/no raster downloads, Cherry Grove discovery from home, absent
biomes/heights, every available representative against the original native cell,
mismatching witness rejection and index failure/retry. Browser preview showed
31 recorded biomes at Y64, navigated to checked Cherry Grove X -2359 Y64 Z -315,
loaded 12/12 destination tiles, and disabled the old selection on Y103 change.
Preview initially used stale ignored preview-dist assets; synchronized all current
modules/data before counting these observations. No physical Safari verification.

No new native cells or structure claims: 262 tiles / 4292608 height cells remain.
Exact string seed 3022187552114785111, target Xbox 26.60, experiments off, source
BDS 1.26.61.1 and unknown/older Xbox generation caveats retained. No BDS run or
rejected generator experiment this increment. Full-world generation unresolved.
Next: adjoining eastern native destination coverage or new algorithmic evidence.

## 2026-11-06 — native eastern temple approach

Resumed main c43693c6c122652bed28e839ffceecb4ea47af36; no open PRs. Verified
live index.html, biome-destinations.mjs and sw.js byte-for-byte against main:
the earlier biome browser deployment is complete.

Added 12 directly native Y64 tiles at X 768..1151, Z 384..895. They adjoin the
home rectangle and contain the biome slice at the earlier temple locator
X872 Z632. No new structure locator, footprint, elevation or Xbox verification
claim. 196608 new cells; atlas now 274 tiles / 4489216 height cells, including
261 Y64 tiles / 4276224 cells. Other sample heights and waypoints unchanged.

Official BDS 1.26.61.1 build 53069370 completed all 13 jobs with DONE in a fresh
disposable seed-explorer-eastern-temple world, then stopped cleanly. level.dat
independently confirms exact decimal string seed 3022187552114785111, default
generator and experiments off. All 16384 control cells match the prior home
fixture. Tests compare all 212992 complete readings against original native
names. No partial records discarded, no block edits or Xbox save access.
Plan, probe, compressed native log/settings, control and manifest are committed
under research/bds/eastern-temple-*. Reproduce:
`python scripts/import_native_area.py --runs research/bds/eastern-temple-native-runs.json.gz --plan research/bds/eastern-temple-plan.json`
then `node scripts/build-checked-tiles.mjs`.

73 Node / 33 Python tests pass, including exact footprint, pan continuity from
home through the temple slice, unknown borders/heights, all native readings,
byte-reproducible export, every original raster pixel and unknown alpha.
Whole-atlas test view bounds expanded east to include the new tiles; old unknown
border assertions moved to the new edge. Overview: 39 active pages (26 at Y64),
revision 39a2ffd58ad820b6a81f8f65f31746b6a58c4aa26b2dea27d3e8d9e0a4977fe1,
199259 stored bytes vs 9317801 dense JSON bytes (not a Safari benchmark).
Worker shell v21, durable checked downloads retained. No browser/physical Safari
QA in this data-only increment; device testing remains outstanding.

Network runtime skill read; environment_status tool and network-policy snapshot
were unavailable in this executor, so no credential readiness or policy change
is inferred. Existing normal tool-mediated GitHub/Pages access worked; no proxy,
network policy or credential changes. Native assets were already authorized.

Target Xbox 26.60/source 1.26.61.1, experiments off, original Xbox generation
version unknown and older-chunk caveats retained. Full-world generation remains
unresolved; no rejected quart/fractional/Voronoi experiments repeated. Next:
adjoining eastern expansion toward the known pillager outpost, or engine research
backed by new algorithmic evidence. No server remains running; scratch selects
the finished eastern-temple world. Native evidence survives scratch expiration.


## 2026-11-06 — finish publication verification safeguards

Resumed current main db426a9 and existing PR #15 rather than duplicating work.
The eastern native expansion is verified live (22 representative application,
metadata, native tile and raster files matched). Pages failed after remaining
queued; retry succeeded, with no generation/code change required.

The reusable read-only scripts/verify-live-release.py is now covered by three
real local HTTP regression tests: complete release and exact seed/height/last-tile
coverage; stale module, missing tile, truncated bytes and extra-byte failure;
recovery without changing local files. Tests use only a temporary local HTTP
server and do not request external services. 73 Node and 36 Python tests pass.
The check remains representative, not exhaustive hosted-file or physical Safari
verification. Code/data accuracy gates and device waypoints unchanged.

No new native cells in this increment: 274 tiles / 4489216 height cells. Exact
seed string 3022187552114785111, Xbox target 26.60, native source 1.26.61.1,
experiments off and older/unknown Xbox generation version caveats remain. No BDS
run or rejected generator experiment repeated. Full-world generation remains
unfinished. Next: resume native expansion toward the eastern outpost or pursue
new algorithmic evidence; do not spend another run reimplementing this verifier.
