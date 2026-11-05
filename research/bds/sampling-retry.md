# Sampling retry against 1,156 game observations

Retested the same preserved official-server reference set, seed
3022187552114785111, BDS 1.26.61.1 build 53069370, no experimental toggles.
All trials use the pinned FragrantResult186 core in MC_26_50 mode.

| Candidate lookup | Matching points |
|---|---:|
| Quart lookup, floor division | 935 / 1156 |
| Quart lookup, C truncation toward zero | 955 / 1156 |
| Block lookup, upstream SHA Voronoi | 896 / 1156 |
| Block lookup, raw full seed replacing g.sha | 904 / 1156 |
| Best of 64 fixed quart offsets (0..3 on each axis) | 1041 / 1156 |

None passed. The offset sweep is diagnostic fitting to the same observations,
not independent validation and not a justified production coordinate transform.
Do not ship a fitted offset or claim the boundary issue is fixed.

Source inspection: generator.c applySeed computes g.sha via getVoronoiSHA(seed)
and block sampling calls genBiomeNoiseScaled. sampleBiomeNoise accepts integer
quart coordinates. This does not yet establish the correct stable Bedrock
block-coordinate mapping. Next investigation must inspect Bedrock-specific
biome access/interpolation rather than assume Java block Voronoi semantics.

The 36-point match remains true only for that smaller aligned grid. The larger
set disproves a general accuracy claim. Checked-point display is still valid
because it uses actual game readings, not these candidate transformations.
