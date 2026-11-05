# Wider-area predictor check

> Correction: the initial sampler could not name snowy_slopes or jagged_peaks.
> All 95 quart-lookup differences below were `minecraft:unknown` outputs for those
> two expected types. These counts do not establish 95 algorithmic errors.
> The sampler now supplies the omitted names. GitHub diagnostic run 42065805185
> completed successfully: corrected quart lookup matches 1,023/1,024, with one
> remaining mismatch; corrected block lookup matches 973/1,024, with 51 mismatches.
> Both tested release modes produced these same corrected counts at Y64.
> See corrected-wide-predictor-summary.json and the run's result artifacts. Original reports remain historical evidence, not approval.


Candidate: FragrantResult186/cubiomes-bedrock, revision
`294c72ab0392dd818a91d293dbd5774d4874d64b`.

Used the existing static library from that checkout, with default generator flags,
Overworld, and seed `3022187552114785111`. The native game reference contains
1,024 chunk-center samples at Y64 across X/Z -256..255 from official BDS
1.26.61.1, experiments off. This is one seed, one bounded area and one height;
it does not establish world-wide accuracy.

| Candidate mode | Lookup | Matches | Mismatches |
| --- | --- | ---: | ---: |
| 26.50 | Quart coordinates, floored | 929 / 1,024 | 95 |
| 26.60 | Quart coordinates, floored | 929 / 1,024 | 95 |
| 26.50 | Block-coordinate lookup | 890 / 1,024 | 134 |
| 26.60 | Block-coordinate lookup | 890 / 1,024 | 134 |

The equal results at Y64 do not establish equivalence between release modes or
experimental settings. Neither candidate configuration is approved for stable
Bedrock 26.60. No core source was patched for these checks.

Names were normalized only for the documented `stone_beach` / `stone_shore` /
`stony_shore` label aliases. Mismatch reports retain the original reference name
and the normalized expected name. No missing points count as a match.

Reproduce after compiling `sample-wide-candidate.c` against the pinned checkout:

```sh
gcc -O2 -I/path/to/bedrock-core research/bds/sample-wide-candidate.c \
  /path/to/bedrock-core/libcubiomes.a -lm -o /tmp/sample-wide-candidate
```

Supply the X Y Z rows from `wide-area-api-reference.json` on stdin, and use
`26.50 quart`, `26.50 block`, `26.60 quart`, or `26.60 block` as arguments.

The shipped map continues to use stored game data. The next predictor work needs
an algorithmic explanation of the disagreements, followed by independent points
and additional seeds/heights; selecting whichever mode fits this fixture best is
insufficient. Structure prediction is also unvalidated.
