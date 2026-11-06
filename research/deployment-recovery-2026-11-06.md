# Deployment recovery — 2026-11-06

Pages run 42268159946 originally failed after remaining deployment_queued. Its failed-job retry succeeded; no map-generation or code fix was needed. Main db426a9bdc44a056352ebc72e0d38215453d65c6 retains 274 tiles and all prior native evidence. Full-world generation remains unfinished.

Added scripts/verify-live-release.py: a read-only, four-worker, bounded HTTP check of exact application/module/metadata bytes plus representative tiles and lossless rasters at every sampled height and the last catalog tile. It reports SHA256 digests, preserves the seed string and exits nonzero on missing, stale, truncated or unreachable resources. It does not claim exhaustive hosted-file validation or physical Safari QA. Run from a checkout of the release to compare, using python scripts/verify-live-release.py. The live run succeeded against main. No BDS run, new native coverage, waypoint mutation or failed engine experiment was performed.

Next: resume adjoining native coverage or generation research supported by new evidence. Do not rerun the already rejected sampling fits. Prior 73 Node / 33 Python results remain historical for the map; the new read-only utility was validated directly against the live release.
