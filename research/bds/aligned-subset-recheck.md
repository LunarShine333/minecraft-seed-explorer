# Aligned-subset recheck invalidates the simple boundary explanation

Rechecked the saved 1,156 official-server readings, restricting to X/Z
multiples of four. Quart-mode candidate matched only **86 of 100** readings.
Therefore the original 36/36 match was an insufficient sample, and the
problem cannot be attributed solely to mapping intermediate block coordinates.
The earlier framing of a sampling-scale fix was too strong.

Also tested block-scale Voronoi with a zero key: **894/1156**, not a fix.
Neither transformation nor the candidate engine is approved.

Next investigation must separate underlying climate/biome generation from
stored biome access and confirm generated-world seed/settings from level.dat.
Then compare a second independently implemented Bedrock-specific engine or
extract the actual game-generated biome data for a bounded map. Do not keep
fitting offsets or approve aligned samples without independent spatial tests.
