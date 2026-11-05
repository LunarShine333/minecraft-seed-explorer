# Fractional-coordinate diagnostic

Tested a fractional-coordinate adaptation of the pinned candidate's noise sampler.
It uses x/4.0, y/4.0 and z/4.0 rather than flooring block coordinates into quart
cells. This is an experiment, not a validated Bedrock generation algorithm.
The source attribution and MIT license are included beside the diagnostic.

Both 26.50 and 26.60 modes give the same results on these fixtures:

| Comparison | Quart lookup | Fractional lookup |
| --- | ---: | ---: |
| Native Y64 chunk centers | 1023 / 1024 | 1023 / 1024 |
| Stored cells at four heights | 246541 / 262144 | 248206 / 262144 |

Fractional sampling fixes 5231 quart failures, introduces 3566 new failures, and
shares 10372 failures with quart lookup. Its net improvement of 1665 matching
cells therefore does not establish an algorithmic fix.

The native residual at (-136,64,40), snowy_slopes versus jagged_peaks, persists.
This was one seed and existing fixtures; no independent seeds were generated.
Block-coordinate rounding alone does not explain every discrepancy. The next
investigation must compare actual Bedrock block-biome interpolation or selection,
rather than accept whichever sampling convention has a higher fixture score.

Reproduce with the pinned candidate checkout and its static library:

```sh
gcc -O2 -I/path/to/bedrock-core research/bds/sample-fractional-candidate.c \
  /path/to/bedrock-core/libcubiomes.a -lm -o /tmp/sample-fractional-candidate
python scripts/compare-candidate-heights.py /tmp/sample-fractional-candidate fractional
```

The shipped map still uses observed stored cells. Neither experimental sampler
is enabled as a prediction engine. Structure prediction remains unvalidated.
