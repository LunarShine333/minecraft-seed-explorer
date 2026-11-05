# Fixed-quart resolution limitation

Audited all 262144 stored cells at Y -48, 0, 64 and 128. Among 16384 aligned 4x4 horizontal squares, 1703 contain multiple biome names. This includes negative coordinates and the documented name mappings used by the checked bundle.

Even an oracle choosing the best single biome for each square must mislabel at least 6824 cells: for each square the unavoidable error is 16 minus the count of its most common biome. The audit sums that bound over the four layers. This is a representation limit, not a claim that 6824 of any particular predictor's errors have been explained individually.

Thus an integer-quart lookup which is constant inside each aligned square cannot reproduce this stored block-resolution dataset exactly. It accounts for only part of the 15603 observed quart-predictor disagreements. Fractional-coordinate sampling avoids that representation restriction but still disagrees at 13938 cells, so removing rounding does not solve generation.

The next algorithm work needs the actual block-biome selection/interpolation behavior. Fixed offsets and best-fit mode selection cannot validate it. No predictions were enabled and no map dataset was changed.

Reproduce: `python scripts/audit_quart_resolution.py data/bedrock-26.60-checked-area.json research/bds/quart-resolution-audit.json`.
