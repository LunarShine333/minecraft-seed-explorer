# Direct stored-biome inspection

Resolved reader build using Cython<3, wheel, setuptools, versioneer, and
`CC=gcc CXX=g++ python -m pip install --no-build-isolation amulet-leveldb==1.0.2`.
Avoided the unavailable clang++ default. Ran via a non-login shell.

Decoded Data3D palettes from a copy of the stopped test-world database.
Constant, inherited and 1-bit packed palette synthetic decoder checks passed.
Corrected Bedrock numeric ID mapping: meadow 186 and deep_dark 190; these are
not the candidate library's Java-derived enum values. This mapping issue concerns
stored numeric IDs only, not earlier comparisons by biome names.

Only 3 Overworld Data3D keys were available in this database snapshot.
Of the 1,156 reference coordinates:
- 72 could be compared with stored chunk palettes.
- 71 matched the stable Script API reading.
- 1 differed: X17,Y128,Z3; API plains, decoded stored meadow.
- 1,084 had no corresponding saved Data3D key and remain unverified.

No engine approval follows. The reader has limited numeric-name mappings and
needs further fixtures/order verification. The single discrepancy must be
investigated as a possible decoder, API-access or data-generation difference.
Future runs should explicitly generate/save a rectangular region and verify
chunk coverage before treating an API probe as stored-data confirmation.

Reproduce with `python scripts/inspect-stored-biomes.py SESSION_ROOT` using
the session directory layout documented in the script. It copies the source
DB before opening it; never point this workflow at the user's Xbox world.
