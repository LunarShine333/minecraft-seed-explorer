# Neighbor selection diagnostic

Tested the pinned cubiomes-bedrock revision
294c72ab0392dd818a91d293dbd5774d4874d64b with corrected mountain biome names.
The diagnostic used the existing block lookup with its default hash, the raw
world seed as hash, and zero as hash. Raw/zero are experiments, not claims about
Bedrock's algorithm. These are the same existing fixtures, not independent seeds.

Both tested release modes gave identical results:

| Method | Native Y64 matches / 1024 | Four-height stored matches / 262144 |
| --- | ---: | ---: |
| Default block lookup | 973 | 243856 |
| Raw-seed hash | 982 | 243472 |
| Zero hash | 981 | 243729 |
| Prior fractional diagnostic | 1023 | 248206 |

The alternative hashes improve sparse native results slightly over default block
lookup while performing worse on the dense reference. This is further evidence
that sparse samples alone are an inadequate acceptance check. None is a fix.

Reproduce by compiling sample-voronoi-candidate.c against the pinned core and
running compare-candidate-heights.py with mode block, raw, or zero. The sampler
changes only the hash input before existing candidate lookup; no core code is
patched. Full mismatch reports are generated locally by the comparison script;
summaries retain per-height counts and first failure examples.

No approved engine registry or map dataset changed. Further work should use an
independently implemented Bedrock block-biome algorithm or game-level evidence,
rather than choose the best-performing hash from these fixtures.
