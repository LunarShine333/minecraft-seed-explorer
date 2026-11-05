# Expanded actual stored-data map

Generated and saved 256 chunks in a 16x16 chunk square, X/Z -128..127.
Four rectangular ticking areas each covered 64 chunks. All 256 chunk touch/
restore operations succeeded; the reference API probe again completed with
1156 successes and zero failed reads. Server stopped cleanly.

Extracted 196,608 stored biome cells: 256x256 at each of Y-48,0,64.
All referenced chunks were present; unknown numeric biome IDs cause failure.
Checked numeric-name mapping against the primary GeyserMC/mappings biomes.json:
1 plains, 4 forest, 25 stony_shore, 182 jagged_peaks, 184 snowy_slopes,
186 meadow, 190 deep_dark. Colors are app presentation choices.

Bundle is 395,506 bytes; format/full-seed/version validation passed. Browser
QA successfully loaded the bundled map and displayed the default Y64 surface
layer with the correct dataset coverage status. Replaced per-cell draw loops
for step-1 tiles with cached canvas rasters, preserving sparse point rendering
for coarser imports. The map fits within the viewport on load. Mobile hardware
performance and Safari behavior have not been independently measured.

Existing central reference comparison remains 1122/1156 stored/API matches,
with all 34 differences at Y128, which is excluded from shipped tiles.
Not every expanded cell has an independent API check. No global generation
engine is approved. Work is saved on the feature branch, not deployed to Pages.
