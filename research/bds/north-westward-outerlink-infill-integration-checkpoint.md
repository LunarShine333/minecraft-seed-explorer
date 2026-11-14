# Outerlink integration checkpoint

Eight adjoining native tiles are registered for continuous loading at Y64:
X -4352..-4097, Z -1024..-513. Strict re-export reproduced 131,072 new
readings and 16,384 independent control cells from the committed normalized
native evidence. The disposable acquisition completed all nine jobs, discarded
zero partial rows and shut down with exit 0.

Atlas: 652 tiles / 10,682,368 height-specific readings; Y64: 635 tiles /
10,403,840 readings. Rebuilt 64 lossless overview pages, revision
bf47521bd0c8c9f8a87aa07f2cf98ad4ed54c4bd64fbea4185e57d0fddd8deed.
124 Node tests and 111 Python tests pass; git diff --check passes. Added an
adjoining tile stream regression covering native provenance, all new cells,
unknown north border and wrong-height rejection. The pending acquisition
planner now excludes these already sampled jobs.

PR #71 integration is ready for final-head CI. Merge and deployment are still
pending at this checkpoint. After successful CI, merge with a head lease and
run both verify-live-release.py and verify-native-manifest.py against the new
manifest. Retain failed initial deployment probes as well as successful retry
reports and record the final release state in a separate checkpoint.

Seed remains exact decimal string 3022187552114785111. Native source is BDS
1.26.61.1, distinct from Xbox target 26.60; experiments off. Original world
release and older Xbox chunk generation remain unknown. Home X128 Z24 remains
approximate and not verified in-game. No Xbox save was modified. Unsampled
areas remain unknown; full-world generation and native structure footprints
remain unresolved. No rejected generation fits were repeated.
