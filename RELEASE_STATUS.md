# Checked-area release status

This is a usable bounded Bedrock map for seed 3022187552114785111 and target release 26.60, not the finished full-world Seed Explorer.

## Available

- 256 × 256 blocks at Y -48, 0, 64 and 128; 262144 stored cells.
- Alternative 512 × 512-block view at Y64; 262144 stored cells.
- 36 selected native locator landmarks across 13 types, with unknown Y explicit.
- Biome finder, structure search, distance sorting, coordinate jumps, waypoints and backups.
- Responsive map layout, mouse/pointer controls, pinch gesture implementation and offline assets.

## Verification

Stored wide data matched all 1024 native chunk-center samples. The 65536 overlapping Y64 cells match the smaller map. Automated application/data checks and decoder/export checks are configured in GitHub Actions. Passing app checks does not certify the candidate generator: prediction remains disabled.

The four-height candidate comparison matches 246541/262144 cells using quart lookup; fractional sampling matches 248206/262144 but introduces new errors. Alternative Voronoi/hash modes perform worse. These are diagnostic results for one seed and existing bounded fixtures, not a global accuracy estimate.

## Still unfinished

- Exact full-world biome and structure prediction.
- Physical iPhone/iPad and Safari gesture testing.
- Home-screen icons and final installation experience.
- Merge to main and GitHub Pages publication of the development branch.

The test world uses official BDS 1.26.61.1 with experiments off. Older Xbox chunks may reflect the unknown original generation version. Imported layers are session-only; waypoints are stored only on the current device. An empty region is unknown, not evidence of no biomes or structures.

## Publishing boundary

PR #1 contains the reviewable changes. It has not been merged or deployed. Publishing this checked-area release would not complete the full-world accuracy objective.
