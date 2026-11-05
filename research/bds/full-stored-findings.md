# Complete saved coverage for the small reference area

Generated X/Z -32..31 area, then marked all 16 chunks dirty by temporarily
placing a barrier at Y319 and restoring each block's original permutation.
This operated only in the disposable test world. Stable Script API got 1156
readings successfully and verified each sampled block was accessible. Server
was stopped cleanly before database copying/inspection.

All 1156 coordinates now have Data3D coverage. Stored data matched 1122 API
readings. All 34 discrepancies are at Y128. All 867 checks at Y-48,0,64 match.
Padded 3-bit palette decoding also passed a synthetic word-boundary test.

Extracted 12,288 actual stored biome cells: a 64x64 tile at each of Y-48,0,64.
The existing checked-area button now loads these tiles with the five native
locator landmarks. No biome was inferred outside the stored region. Bundle
validation passed; source evidence records limitations and exact coverage.
Not every decoded cell has an independent API check. Numeric-name mapping
covers the four biome IDs present in these tiles; unknown IDs fail extraction.

Global automatic predictions remain disabled. Resolve the Y128 discrepancy
before using high-altitude API/stored comparisons interchangeably, and test
wider biome diversity before approving a general generator.

These changes are on bedrock-data-integration / PR1. They are not deployed
to the live GitHub Pages site yet. Browser QA of the expanded tile dataset
and merge authorization remain outstanding.
