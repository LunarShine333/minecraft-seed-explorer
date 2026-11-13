# Manifest verification hardening

PR64 resumed from current branch. Downloads now read at most expected local size plus one byte, sufficient to detect oversized responses without retaining arbitrary response bodies. Missing local tile evidence now returns a failed per-file report rather than terminating without JSON. Added regression for missing local evidence.

Full local validation: 117 Node tests and 97 Python tests passed. Previous committed live evidence verifies all eight PR63 tiles. No website/data changes. CI run 43471902451 on implementation commit 38f011b8aa67366b3f556afeebc8271945595d9c was in progress at checkpoint; check final branch-head CI before merge. Full-world generation still unresolved; next resume PR64 rather than duplicating it.
