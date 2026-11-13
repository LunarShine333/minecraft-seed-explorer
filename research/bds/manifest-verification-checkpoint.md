# Complete manifest verification checkpoint

Added scripts/verify-native-manifest.py to compare every dense tile in a selected native manifest against published bytes, with per-file SHA256 evidence and fail-closed download results. Two targeted tests pass, covering all-tile traversal, corruption, offline failures, path escape, duplicates and empty manifests. Ran against all eight PR63 westward-link tiles: exit 0; evidence saved alongside this checkpoint.

No map data or website behavior changed. Full suite/CI and merge remain next; use this checker alongside verify-live-release.py for future acquisitions. Full-world generator remains unresolved. Exact seed, target/source version distinctions, unknown original generation, older Xbox chunks and unverified home caveats unchanged.
