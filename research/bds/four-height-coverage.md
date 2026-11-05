# Four stored height layers

The checked bundle now contains 262,144 cells: 256 × 256 cells each at Y -48, 0, 64 and 128. Horizontal bounds remain X/Z -128..127. The 36 native locator landmarks are unchanged.

The Y128 layer was exported from the stopped copied official test-world DB using the corrected upper-section decoder. Prior validation: 1,156 original reference points and 320 held-out upper-height points matched with the documented stone_beach/stony_shore alias. This does not mean all 65,536 newly included Y128 cells were individually API checked.

Application validation accepts the four-height bundle at its 262,144-cell limit. Direct Y128 lookup and closest-biome search at a known cell pass; coordinates beyond the raster remain unknown. Browser height selection and legend update were checked.

This expands vertical coverage only. It does not approve a global generator or verify older Xbox chunks against the newly generated test world.
