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

## 2026-11-06 — native outpost approach

Resumed main 099d736021e06ab764d97877d87e7a4c2e6f492e; no open PRs.
Added 10 directly native Y64 tiles, X1152..1791 / Z640..895, adjoining the eastern
temple area and including the biome slice at the prior outpost locator X1768
Z728. This does not newly validate a structure, its footprint or its height.
163840 new cells; atlas now 284 tiles / 4653056 height cells, including 271 Y64
tiles / 4440064 cells. Other heights and device waypoints remain unchanged.

Official BDS 1.26.61.1 build 53069370 completed all 11 requested jobs and DONE in
fresh disposable world seed-explorer-outpost-approach, then stopped cleanly.
level.dat independently verifies exact string seed 3022187552114785111, default
generator and experiments off. The independent 16384-cell home control matches
all prior native cells. Tests compare all 180224 complete native readings against
exports. No incomplete records, block edits or Xbox save access. Plan, read-only
probe, compressed native evidence/settings, control and manifest are committed
under research/bds/outpost-approach-*. Reproduce:
`python scripts/import_native_area.py --runs research/bds/outpost-approach-native-runs.json.gz --plan research/bds/outpost-approach-plan.json`
then `node scripts/build-checked-tiles.mjs`.

75 Node / 38 Python tests pass: exact footprint, continuous pan from home to
outpost slice, unknown borders/heights, every native reading, byte-reproducible
exports, every original raster pixel and unknown alpha. Overview now 40 pages
(27 at Y64), revision 2c763204cefb853a8a541102081ef0de51c49761eca2531a9494aa843272f22e,
204528 stored overview bytes vs 9658249 dense JSON bytes (not a Safari benchmark).
Worker shell v22; durable checked downloads retained. No browser or physical
Safari QA in this data increment. No engine experiment repeated or promoted.

Target Xbox 26.60/source 1.26.61.1, experiments off and unknown original Xbox
chunk-generation version/older-chunk caveats remain. Full-world generation still
unfinished. Next: widen adjoining eastern coverage or new evidence-based engine
research. Use the committed live verifier after deployment. No server remains
running; scratch configuration selects the completed outpost test world.

## 2026-11-06 — native southern home connection

Resumed main 7f811e70a7e6b2b324840f8d5ef7eb3dbbb90c04; no open PRs. The
committed live verifier passed against the outpost release before expansion.
Added eight directly native Y64 tiles at X -256..767 / Z768..895, joining the
southern home edge to the existing eastern row. New continuous row spans
X -256..1791 at these Z values. No new structure, elevation or Xbox claim.
131072 additional cells; atlas now 292 tiles / 4784128 height cells, including
279 Y64 tiles / 4571136 cells. Other heights and device waypoints unchanged.

Official BDS 1.26.61.1 build 53069370 completed all nine jobs with DONE in fresh
disposable seed-explorer-south-home world, then stopped cleanly. level.dat
independently verifies exact string seed 3022187552114785111, default generator
and experiments off. The independent 16384-cell control matches all prior home
fixture cells. Tests compare all 147456 native readings with exports. No partial
records, block edits or Xbox save access. Plan, read-only probe, compressed log
and settings, control and manifest committed under research/bds/south-home-*.
Reproduce with:
`python scripts/import_native_area.py --runs research/bds/south-home-native-runs.json.gz --plan research/bds/south-home-plan.json`
then `node scripts/build-checked-tiles.mjs`.

77 Node / 40 Python tests pass: exact requested footprint, continuous south/east
pan paths, unknown southern border and other heights, every native reading,
byte-reproducible exports and every original raster pixel/unknown alpha.
Historical unknown assertions at now-measured coordinates moved to the new
southern border. Overview remains 40 pages (27 at Y64), revision
d4165f808149bd4cf1b04e79cbf01e500c9be76f6fee3ee8485e81d75a957d22;
206418 stored overview bytes vs 9930181 dense JSON bytes (not a Safari benchmark).
Worker shell v23 retains durable checked downloads. No browser or physical
Safari QA this data increment; device testing remains outstanding.

Runtime instructions/network reference read. environment_status is not exposed
and /etc/codex/network-policy.json is absent; no readiness/policy assertions or
network/credential changes were made. Existing normal connector/HTTP access and
previously authorized native assets used.

Xbox target 26.60/native source 1.26.61.1, experiments off, unknown original Xbox
chunk-generation release and older-chunk caveats retained. Full-world generation
remains unresolved; no failed engine sampling experiments repeated. Next: useful
native southern destinations or generation research supported by new evidence.
Verify new deployment with scripts/verify-live-release.py; no server remains
running. Scratch selects the finished south-home world; evidence is in GitHub.

## 2026-11-06 — native southern stronghold approach

Resumed main f4a1b5c5845dfce261e365a768380f165c9a1994; no open PRs. The
committed live verifier passed against the southern-home release before this
acquisition. Added 24 directly native Y64 tiles at X512..767 / Z896..2431,
adjoining the southern home row and including the biome slice at the prior
stronghold locator X658 Z2338. This is not a safe walking route, surface-height
model, new locator observation or verified structure footprint/elevation.
393216 added cells; atlas 316 tiles / 5177344 height cells, including 303 Y64
tiles / 4964352 cells. Other heights and device waypoints unchanged.

Official BDS 1.26.61.1 build 53069370 completed all 25 jobs with DONE in fresh
disposable seed-explorer-stronghold-approach world, then stopped cleanly.
level.dat independently verifies exact string seed 3022187552114785111, default
generator and experiments off. All 16384 repeated home control cells match prior
native observations. Tests compare all 409600 complete native readings against
exported biome names. No partial records, block edits or Xbox save access.
Plan, read-only probe, compressed native log/settings, control and manifest are
under research/bds/stronghold-approach-*. Reproduce:
`python scripts/import_native_area.py --runs research/bds/stronghold-approach-native-runs.json.gz --plan research/bds/stronghold-approach-plan.json`
then `node scripts/build-checked-tiles.mjs`.

79 Node / 42 Python tests pass: exact planned footprint, continuous southward
pan to the prior stronghold coordinate, unknown side/end borders and heights,
every native reading, byte-reproducible exports, every original raster pixel and
unknown alpha. Whole-atlas test view extends south to include the new strip;
the historical unknown southern edge assertion moved to the new boundary.
Overview 43 active pages (30 at Y64), revision
d190e64f833906404c8ce064f2a418103b1d988d21a8701ae12f5cf9dff32fab;
227603 overview bytes vs 10749022 dense JSON bytes (not a Safari benchmark).
Worker shell v24 retains durable checked downloads. No browser/physical Safari
QA in this data increment. No failed generator experiment repeated/promoted.

Runtime/network guidance read. environment_status tool unavailable and policy
snapshot absent; no credential-readiness/network-policy claims or changes.
Previously authorized native assets and normal HTTP/connector paths were used.
Xbox target 26.60/native source 1.26.61.1, experiments off, unknown original Xbox
generation release and older-chunk caveats remain. Full-world generation still
unfinished. Next: useful new native destinations or new algorithmic evidence,
without repeating rejected sampling fits. Verify publication with the committed
live verifier. No server remains running; scratch selects the completed test
world. All acquisition evidence is committed so scratch loss does not lose cells.

## 2026-11-06 — native desert destination

Resumed main bd165dc7780e868d906528ec1209bd6c2e2b1748; no open PRs. The live
verifier passed against the stronghold release before acquisition. Native locator
command from X128 Y64 Z24 returned desert at X3936 Y66 Z-1992. A separate fresh
native world directly confirms minecraft:desert at that exact coordinate.

Added eight directly native tiles: 256 x 256 at X3840..4095 / Z-2048..-1793,
at Y64 and Y66. These include desert, mesa_plateau_stone, river, stony_shore
(alias of native stone_beach), and warm_ocean; native names are preserved.
Desert occupies 20447 recorded Y64 cells and 20425 Y66 cells. This destination
is separate from the continuous home atlas: the travel gap remains unknown and
transparent. It is not a safe route or surface-height model. Existing Browse all
checked biomes finds it at the chosen Y and verifies its original native cell.
No new UI control or waypoint mutation. A sand-colored presentation fallback
was added for desert; biome identities remain entirely native observations.

Both fresh disposable worlds' level.dat verify exact string seed
3022187552114785111, default generator, experiments off and native source
1.26.61.1 build 53069370. Locator probe and raw log/settings are preserved as
desert-locator-*. Initial calculateClosestBiomeFromSeed rejected boundingSize.x
8192; the unnamespaced console command was also rejected. Neither failure
produced a biome prediction. The successful command was:
`execute positioned 128 64 24 run locate biome minecraft:desert`.
Primary API/command references inspected:
https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable
https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/locate
Native execution, not documentation alone, establishes the recorded result.

Patch acquisition completed all nine jobs with DONE and stopped cleanly. All
16384 independent home control cells match prior observations; tests compare
all 147456 complete native readings to exports. No partial records, block edits
or Xbox save access. Plan, read-only probe, compressed evidence/settings, control
and manifest are under research/bds/desert-destination-*. Reproduce:
`python scripts/import_native_area.py --runs research/bds/desert-destination-native-runs.json.gz --plan research/bds/desert-destination-plan.json`
then `node scripts/build-checked-tiles.mjs`.

81 Node / 45 Python tests pass, with the updated locator/settings test rerun
successfully after recording direct verification. Coverage includes the exact
locator cell, raw log SHA256, every native reading, reproducible export, exact
patch footprint, unknown travel gap/borders/heights, atlas biome discovery,
every original raster pixel/unknown alpha, and all six sampled heights in biome
destination tests. Whole-atlas bounds expanded east/north to include the patch.
No browser or physical Safari QA in this data increment.

Atlas now 324 tiles / 5308416 height cells; Y64 307 tiles / 5029888 cells,
Y66 four tiles / 65536 cells. Other heights unchanged. Overview 45 pages (31 at
Y64 and one at Y66), revision
b5c4db968ad1c506d7aa5d028e738fdaa0d59d36fc5918bafc142ab86e1d8335;
237472 stored overview bytes vs 11021990 dense JSON bytes (not a Safari
benchmark). Worker shell v25 retains durable checked downloads and waypoints.

Runtime/network instructions read; environment_status unavailable and policy
snapshot absent, so no readiness/policy assertions or changes were made.
Xbox target 26.60/source 1.26.61.1, experiments off, unknown original Xbox chunk
generation release and older-chunk caveats remain. Full-world generation is
unfinished; no rejected candidate sampling fits repeated or promoted. Next:
connect useful adjoining regions toward this destination, or investigate new
algorithmic evidence. Verify publication with the live verifier. Both servers
stopped cleanly; scratch selects the finished desert destination world.

## 2026-11-06 — continuous native home-to-desert connection

Resumed main 55e725eee6b1a06d0e83bf8a3caa4aca2596dd6c; no open PRs. The live
verifier passed against the desert destination release before acquisition.
Added 74 directly native Y64 tiles: a vertical strip X1536..1791 / Z-2048..639
and horizontal strip X1792..3839 / Z-2048..-1793. They join the existing eastern
outpost coverage to the previously isolated desert patch. The checked biome
path is continuous from home through the eastern extension to the desert;
surrounding gaps remain unknown. This does not establish surface elevation or
a safe walking route. Y66 remains limited to its original desert patch.

1212416 new cells; atlas now 398 tiles / 6520832 height cells, including 381
Y64 tiles / 6242304 cells. Other heights and device waypoints unchanged.
No new structure or full-world-generation claim.

Official BDS 1.26.61.1 build 53069370 sampled three fresh disposable worlds.
First run stalled after 25 complete records (including control), stopped cleanly,
and discarded 68 partial rows. Resume stalled after nine complete records,
stopped cleanly, and discarded 108 partial rows. A fresh final world sampled
only missing jobs plus control, at two rows per tick instead of four: all 43
jobs finished with genuine DONE and stopped cleanly. Earlier stall cause is
unknown; final completion does not establish a causal fix. Original full/resume/
final probes and actual incomplete logs/settings are retained.

Each level.dat independently verifies exact string seed 3022187552114785111,
default generator and experiments off. All 49152 control readings match the
prior home fixture; 32768 duplicate control cells agree across runs. Tests
compare all 1261568 complete native readings with exported biome names. The
planned union is required before export; incomplete rows never become coverage.
No block edits or Xbox save access. Evidence, settings, plan, probes, control
and manifest committed under research/bds/desert-connection-*. Reproduce:
`python scripts/import_native_area.py --runs research/bds/desert-connection-native-runs.json.gz --plan research/bds/desert-connection-plan.json`
then `node scripts/build-checked-tiles.mjs`.

83 Node / 47 Python tests pass: exact 74-tile planned footprint, continuous pan
from home to outpost, northward to the desert latitude and east into the desert,
unknown sides/borders/heights, each native reading, byte-reproducible evidence/
export/manifest, every original raster pixel and unknown alpha. Historical
outpost-edge unknown assertion moved to the actual new boundary. No browser or
physical Safari QA in this data increment; device testing remains outstanding.

Overview now 53 active pages (39 at Y64), revision
212e04a626cac23909fc0eb15ea449acc9389ac397ddebc2895b2e8d94a7acd7;
276571 stored overview bytes vs 13540144 dense JSON bytes (not a Safari
benchmark). Worker shell v26 retains durable checked downloads and waypoints.

Runtime/network guidance read; environment_status unavailable and policy
snapshot absent, so no readiness/policy assertions or changes. Normal connector/
HTTP paths and previously authorized native assets used. Xbox target 26.60,
native source 1.26.61.1, experiments off, unknown original Xbox generation
version and older-chunk caveats retained. No rejected generator sampling fit
repeated or promoted. Full-world generation remains unresolved. Next: useful
native coverage around connected destinations or new algorithmic evidence;
verify publication with the committed live verifier. No server remains running;
scratch selects the completed final world. All acquisition evidence survives
scratch expiration in the repository.

## 2026-11-07 — cursor-anchored wheel and trackpad zoom

Resumed main 54e0e367; no open PRs. Committed live verifier confirmed the
398-tile connected desert release (revision 212e04a626cac23909fc0eb15ea449acc9389ac397ddebc2895b2e8d94a7acd7)
with all representative release resources matching. New UI increment keeps the
world coordinate under the pointer fixed during wheel/trackpad zoom, including
scale limits, instead of pulling it toward the viewport center. Normalize pixel,
line and page delta units; zero delta does not zoom and small trackpad movements
produce proportional changes. Existing pinch behavior is reused. Shell cache v27;
checked data, provenance, exact seed and device waypoints remain intact.

Validation: 85 Node tests and 47 Python tests passed. New tests cover off-center
world anchors in both directions and at limits, zero deltas, normalized units and
small trackpad input. Tried actual Playwright Chromium and WebKit launches;
both failed because browser executables are absent (Chromium headless shell1234,
WebKit2336). This is not Safari/device verification. No native data or generation
claims added. Runtime status tool and network-policy snapshot unavailable; no
network configuration changed. Next: browser/device gesture checks and further
native coverage or new generator evidence. Full-world generation remains open.

## 2026-11-07 — bounded raster decoding

Resumed main b064579; no open PRs. Raster loading now waits for browser image
decode before handing an overview to the renderer. Decode errors become retryable
map errors instead of a successfully cached unusable image. Existing request
deadline also bounds stalled decoding, clears handlers and cancels the download.
Browsers without decode retain their load-event fallback. Added failure/stall
regression coverage; shell v28 preserves durable checked data and waypoints.
No native coverage, seed, provenance or generator claims changed. Full-world
and physical Safari validation remain open. Publication awaits PR checks/merge;
next run verify prior cursor-zoom release and finish this increment.

Continuation: added explicit late-decode-after-timeout and deferred-success
regressions. All 88 Node and 47 Python tests pass. No physical browser validation
claimed. Finish CI/merge and verify deployed bytes; native coverage remains398 tiles.

## 2026-11-07 — isolate request eligibility failures

Resumed main 519a3f0, no open PRs. Found that an exception in a queued request's
eligibility callback could escape drain during a preceding request's finalizer,
leave that request unsettled and prevent following tiles from starting. Catch
and reject that job independently, then continue draining. Regression queues a
blocked first request, throwing predicate and valid neighbor, proving neighbor
completion and zero remaining active/queued requests. 89 Node and 47 Python
tests passed. Shell v29; no native coverage, seed or provenance changes. Full
world generation and Safari validation remain unfinished. Publication pending.

## 2026-11-07 — center-first map streaming

Resumed main b6e7bf4, no open PRs. Both detailed native tile and overview page
requests now prioritize geometry nearest the viewport center, so catalog insertion
order no longer determines which distant edge loads first. Sorting copies the
visible list and leaves source catalog order and provenance intact. Existing
four-request concurrency, cancellation and progressive painting remain in use.
Added center movement/negative-coordinate/empty-list/immutability regression.
Shell v30. No native coverage or generator accuracy claim added. Physical Safari
validation and full-world generation remain open. PR publication pending.

Continuation: integration test now loads actual native fixtures through a one-slot
request pool across two viewport positions, verifies exact center-first HTTP order
and full visible coverage. 91 Node and 47 Python tests pass locally. CI/merge and
live verification follow; no additional terrain or physical Safari claims.

## 2026-11-07 — unsampled native collection planner

Added scripts/plan-native-extension.py to select only fully nonoverlapping
128-block acquisition candidates at a chosen height. Rejects rounded/numeric
seeds, unaligned/reversed/out-of-range bounds, invalid heights and oversized
plans. Partial overlap is conservatively skipped, never counted as new coverage.
Tests cover negative edges, partial footprints, height separation and invalid
inputs. Existing desert vertical corridor returns zero candidates. Saved two
eastern corridor candidates separately, explicitly unsampled; no catalog/raster
or website coverage changes. This is collection preparation, not native evidence.
Next: sample these candidates with the authorized native probe and independent
home control, preserve source version/settings and only import complete records.
Full-world generator remains unresolved; no rejected fit rerun. PR pending checks.

Continuation: real-atlas regression reproduces the saved two candidates and zero
jobs on the existing corridor, then simulates completed footprints and verifies
that neither candidate is planned again. Simulation is test-only, not native
coverage. 50 Python and 91 Node tests pass; native acquisition remains pending.

## 2026-11-07 — eastern native acquisition attempt (no coverage)

Prepared three-job probe: independent home control plus two saved eastern
candidates. First setup command used the wrong working directory and exited
before replacing the old probe; old north-monument probe briefly launched in
the new disposable world. Its output is excluded. Corrected probe then launched
with planId eastern-candidates and three jobs. Bounded observation produced START
but no complete TILE/DONE records. Stopped via console, observed Quit correctly.
No readings imported, no coverage or accuracy claim added. Saved corrected probe,
settings and raw attempt log for diagnosis. Check tickingarea/readiness progress
and ensure fresh world before retry. Do not treat this world as pristine.

## 2026-11-07 — fresh eastern native collection succeeded

Fresh seed-explorer-east-diagnostic-20261107, diagnostic probe adds JOB/WAIT/READY
markers without changing biome sampling. All three tiles and DONE completed.
Chunk readiness waits were 22,18,20 ticks. Console stop exited zero/Quit correctly.
Strict export_area_runs validated level settings and all 16384 independent home
control cells; accepted 32768 new candidate cells. Compressed normalized evidence,
plan and validation report saved. Outputs deliberately not yet installed in atlas:
next export tiles/build catalog, reproduce rasters, run full tests and deploy.
Earlier stall cause remains unknown; successful fresh run does not diagnose it.
Source 1.26.61.1 target26.60, experiments off, old Xbox chunk caveats preserved.

## 2026-11-07 — reproducible eastern native tile exports

Strict importer exported two complete Y64 tiles (32768 cells), independent control,
normalized evidence and manifest. Added byte-for-byte reproduction test for every
export, normalized evidence and manifest; explicit counts/heights asserted. No
partial rows, three complete records and DONE. Files are staged in data/tiles but
not yet referenced by catalog/overview: website coverage remains 398 tiles.
Next increment must register manifest in builder, rebuild raster/catalog, update
coverage assertions and saved planner candidates before publishing. Do not claim
400-tile map until integration and tests complete. No native server run this time.

## 2026-11-07 — eastern atlas integration prepared

Registered native eastern manifest, rebuilt catalog and53 raster pages. Atlas now
400 tiles/6553600 height cells, Y64 383tiles/6275072cells. Revision
2bec3b4629c247cf31c248b64e8b654f9f26ce7c122165b8101edd890a927c43.
Updated aggregate coverage tests and historical planner fixture baseline. 91 Node
tests pass. Raster/native Python suite follows. Publication pending PR checks and
merge of evidence stack; no new structure or full-world generator claim.

Release continuation: consolidated evidence stack in PR29 targeting main. Added
native cell loading/provenance and unknown border/height regression; 92 Node and
51 Python tests pass. Final CI then publication verification required. Evidence
PR26–28 superseded by consolidated release; no physical Safari claim.

## 2026-11-07 — wider eastern native acquisition

Fresh disposable seed-explorer-wider-east-20261107 completed17 native tiles and
DONE, console stop clean. Plan16 new Y64 tiles X1792..2047 Z-1536..-513,
262144 cells, plus independent home control. Strict export_area_runs accepted all
new cells and matched16384 home control cells; no partial records. Compressed
normalized evidence, plan, diagnostic probe and validation report saved. No atlas
outputs installed yet; catalog remains400 tiles. Next export/reproduce/register
manifest/rebuild and test. Exact seed/source/target/experiments and Xbox caveats
preserved. No rejected generator fit rerun, no new structure claim.

## 2026-11-07 — wider eastern atlas integration

Exported16 native Y64 tiles, independently checked control, normalized evidence
and manifest. Registered manifest and rebuilt53 raster pages. Prepared atlas416
tiles/6815744 height cells; Y64 399tiles/6537216cells. Revision
 e3c842c9bc2f4a9674e10638d50bb8581e0b1e0afc48ae8953ed6b7775814856.
Added full byte reproduction test. Historical unknown-border assertions moved to
new actual boundary X2048. Full tests run before publication; no global generator
or surface/structure claim. Publication pending CI and merge.

Release validation: added store-level seam/edge/height/provenance checks and whole
16-tile viewport assertion (262144 cells). 93 Node and52 Python tests pass.
PR31 consolidates PR30 acquisition; final CI then merge/live verification.
No physical Safari or global generation claim. Check publication next run if pending.

## 2026-11-07 — southeastern native acquisition

Fresh disposable world completed16 new tiles at Y64, X1792..2047 Z-512..511,
plus home control and DONE. Clean console stop. Strict importer accepted262144
new cells and matched16384 independent control readings. Saved normalized native
evidence/settings, plan, probe and report. No partial records. Extends the eastern
strip toward existing eastern-home coverage. Atlas export/integration/tests remain
next; website catalog unchanged416tiles. No prediction/structure/safe route claim.

## 2026-11-07 — southeastern atlas integration prepared

Exported16 southeastern native tiles, control and manifest. Registered manifest,
rebuilt53 raster pages. Prepared atlas432tiles/7077888 height cells; Y64
415tiles/6799360cells. Revision
d4f61b3bad6b08bcd3dbbe530786f97801f8165dbb6f85296680e895eac2c47e.
Added byte-for-byte native export/evidence/manifest reproduction test. 93 Node
tests pass; Python raster/native suite follows. Includes original source/target,
experiments off and old Xbox chunk caveats. Publication pending CI and merge;
no full-world generator/structure/safe traversal claim. Next add seam integration
assertions and publish after checks. Native server not run this increment.

Release continuation: added southeast store-level tile seams, native provenance,
unknown border/height and full16-tile viewport assertions. 94 Node and53 Python
tests pass locally. PR33 includes PR32 evidence; CI then merge/live verification.
Physical Safari and full-world generation remain unfinished.

## 2026-11-07 — southern junction native collection

Fresh disposable world completed8 new Y64 tiles X1792..2303 Z512..767, home
control and DONE. Console stop clean. Strict importer accepted131072new cells
and matched16384 independent control readings; no partial records. Preserved plan,
probe, normalized evidence/settings and validation report. Catalog remains432tiles:
export/integration/raster tests next. Patch adjoins eastern coverage; no structure,
surface-height, safe route or full-world prediction claim. Xbox caveats retained.

## 2026-11-07 — junction exports and deployment timeout diagnosis

Exported8 southern junction native tiles, independent control and manifest.
Added byte-for-byte reproduction test for exports/evidence/manifest. Python suite
54tests passed. Catalog not changed yet; junction integration remains next.
Inspected Pages run42407532163 deploy job128508447580: build succeeded, deployment
remained syncing_files until Timeout reached and cancellation. Retried failed jobs
only. This is observed publication failure, not a native-data/test failure; verify
432-tile live bytes after retry before claiming recovery. No user action needed.
