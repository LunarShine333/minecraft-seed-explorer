# Outerlink release checkpoint

PR #71 merged as 612353c622643f6256e73321ff89e2dc4e286639 after final-head CI 43647222710 succeeded on 1221550ace59fd44e25d9351ef88394c21b7bc1c. Local validation passed 124 Node tests, 111 Python tests and diff checks; all 80 uploaded files matched tested bytes in a fresh checkout.

Released eight adjoining Y64 tiles at X -4352..-4097, Z -1024..-513: 131,072 native readings plus a matching independent 16,384-cell control. Atlas now has 652 tiles / 10,682,368 height-specific readings; Y64 has 635 tiles / 10,403,840 readings. There are 64 overview pages, revision bf47521bd0c8c9f8a87aa07f2cf98ad4ed54c4bd64fbea4185e57d0fddd8deed.

Both live verifiers exited 0 against the merged release. outerlink-release-verification.json retains the complete release passes; outerlink-dense-first-verification.json retains initial pre-deployment 404s and outerlink-dense-retry-verification.json confirms all eight new dense tiles match published bytes. Release verification covers application modules, metadata, representative dense tiles and every indexed overview PNG. It does not claim every existing dense tile or physical Safari QA.

Exact seed string 3022187552114785111, source BDS 1.26.61.1 versus Xbox target 26.60, experiments off, original-generation/older-Xbox-chunk caveats and approximate unverified home X128 Z24 remain preserved. Unknown cells remain unknown. No Xbox save modifications. Full-world generation remains unresolved; rejected fits were not repeated.

This increment is complete. Resume from current main and open PRs before selecting the next adjoining native coverage area or continuous-browsing improvement; do not reacquire these eight jobs. The planner now excludes them. No user help is required at this checkpoint.
