# Dense predictor validation

The corrected candidate was rebuilt from pinned source in GitHub diagnostic run 42068226652 (job 127388558344). Both 26.50 and 26.60 modes produced identical results for these fixtures. These are diagnostic modes, not approved stable release implementations.

Native chunk-center reference: 1023/1024 at Y64. The residual point is X -136, Y 64, Z 40: native snowy_slopes, predicted jagged_peaks.

Full stored-cell comparison, X/Z -128..127:

| Height | Matching cells | Checked cells |
| --- | ---: | ---: |
| -48 | 62745 | 65536 |
| 0 | 61158 | 65536 |
| 64 | 61252 | 65536 |
| 128 | 61386 | 65536 |
| Total | 246541 | 262144 |

The dense check reveals 15603 disagreements hidden by sparse chunk-center sampling. It compares decoded game-stored cells, not 262144 independently queried Script API points. The original decoder has its own recorded native reference checks.

The candidate quart lookup samples integer coordinates at scale four, while the stored world is represented per block. Its chunk-section helper also emits a 4-by-4-by-4 quart grid, so merely using that helper does not establish correct block sampling. The source's scale-one path uses Voronoi selection. These implementation facts motivate further sampling investigation; they do not prove the cause of these differences.

No new seeds were generated during this check. No prediction engine or structure predictor was enabled. Complete mismatch outputs are attached to the GitHub run; first mismatch examples and per-height summaries are committed in four-height-predictor-summary.json.
