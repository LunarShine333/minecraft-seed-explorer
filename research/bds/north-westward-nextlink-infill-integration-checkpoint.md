# Nextlink integration checkpoint

Eight native Y64 tiles at X -4608..-4353, Z -1024..-513 are registered for continuous loading. Strict evidence replay reproduced 131072 new readings and 16384 independent control cells, all nine jobs complete, zero partial rows. Added stream regression checks observed provenance, exact count, unknown border and wrong-height rejection. Pending planner now excludes collected tiles.

125 Node tests and 113 Python tests pass; diff check passes. Atlas totals 660 tiles / 10813440 height-specific readings; Y64 643 tiles / 10534912 readings. Rebuilt 64 overview pages, revision 075701ca5552dc90724ffc1d1afa65a08e0af903c82cfab31925f67f90c60166.

Integration saved on PR72; final-head CI, merge and live deployment verification remain pending. Resume this branch without recollection. After CI succeeds, merge with expected head and run verify-live-release.py --attempts 2 plus verify-native-manifest.py for this manifest from merged checkout. Retain initial failures and successful retries in release evidence and final checkpoint. Published coverage remains previous release until then.

Seed exact string 3022187552114785111; source BDS1.26.61.1 differs from Xbox26.60, experiments off. Original generation unknown/older Xbox chunks and approximate unverified home preserved. No Xbox save modifications. Full-world generation unresolved; rejected fits not repeated.
