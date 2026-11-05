# Resolved: inherited upper biome sections

The original Data3D decoder repeated the previous entire 16-block section when
reading a 0xFF inheritance header. Correct behavior for these observed world
chunks is to extend the previous section's **top horizontal biome layer** upward.
The old behavior introduced the 34 Y128 discrepancies in stored/API comparisons.

With the corrected decoder:
- All 1156 original stored/API reference comparisons match.
- A fresh independent probe at 320 points across X/Z -119..119 and heights
  128,143,144,200,300 also matches, after naming biome ID25 by Bedrock's native
  `minecraft:stone_beach` rather than Geyser's `minecraft:stony_shore` display alias.
  Those 5 alias-only differences are retained explicitly in the report metadata.
- All 196608 cells at currently shipped heights -48,0,64 remain unchanged.
- Four Python regression tests cover inherited tops, constants, packed-word
  padding, and malformed data. The previous implementation would fail the
  varying-Y inheritance regression.

The fresh probe used stable @minecraft/server 2.0.0 in the same temporary
Experiments-off BDS world. All 320 block-access and biome reads succeeded;
server stopped cleanly. No user Xbox world was opened or modified.

This supersedes the unresolved upper-altitude **reader** diagnoses in earlier
checkpoints. It does not repair the independent candidate predictor mismatch,
validate arbitrary seeds, certify every biome ID, or enable global generation.

The earlier stored-map ID25 label stony_shore is an equivalent human-readable
alias, not a different biome location. Raw native reference names remain intact.
