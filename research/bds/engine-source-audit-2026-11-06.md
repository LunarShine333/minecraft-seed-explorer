# Engine source audit — 2026-11-06

Read-only source inspection; no candidate compilation, repeated generation
experiment or new accuracy claim.

- `git ls-remote https://github.com/FragrantResult186/cubiomes-bedrock.git HEAD`
  returned `294c72ab0392dd818a91d293dbd5774d4874d64b`, exactly the previously
  tested revision. There is no new upstream code to justify repeating the
  rejected quart/fractional/Voronoi comparisons.
- Inspected [Demeno/cubiomes-bedrock](https://github.com/Demeno/cubiomes-bedrock)
  at `533cbe2a51a3d8cd41547040d50d91a00ac76e43` (commit date 2026-08-26).
  Compared it against the tested upstream revision using `git diff FETCH_HEAD
  HEAD`. It lacks the newer 26.60 enum/tree. Its `generator.c`, `noise.c`,
  `noise.h`, `layers.c` and `layers.h` match the tested upstream; the
  `biomenoise.c` difference only removes the newer decision-tree selection.
  This supplies no new block-biome access algorithm to test.

Sources:
[upstream pinned tree](https://github.com/FragrantResult186/cubiomes-bedrock/tree/294c72ab0392dd818a91d293dbd5774d4874d64b),
[fork pinned tree](https://github.com/Demeno/cubiomes-bedrock/tree/533cbe2a51a3d8cd41547040d50d91a00ac76e43).

Full-world biome generation remains unresolved. Next engine work needs new
algorithmic evidence or an independent implementation, followed by native
validation across seeds/heights. No code from these checkouts was added to the
website, and no approval registry or checked map data changed.
