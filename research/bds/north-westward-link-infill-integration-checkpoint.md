# Westward link integration checkpoint

PR #63 integrates eight adjoining native Y64 tiles at X -2560..-2305, Z -1024..-513 (131,072 readings). Strict importer reproduced exports from committed evidence: nine completed jobs, zero partial rows, 16,384 matching independent control cells. Canonical gzip restored from the normalized base64 evidence.

Local validation: 117 Node tests and 94 Python tests passed. Includes adjoining tile loading, unknown borders, deterministic exports and wrong-seed rejection. Atlas: 596 tiles / 9,764,864 height-specific readings; Y64 579 tiles / 9,486,336 readings. Overview remains 60 pages (46 Y64), revision b27db09e714b66c4c84e0ed770d1ff0a3951ad442025ab73e89ccd525a3c1dab.

Publication pending final-head CI, merge and live byte verification. Exact seed string 3022187552114785111; source BDS 1.26.61.1 build 53069370 versus Xbox target 26.60, experiments off, unknown original generation and older Xbox chunks caveats retained. Home remains approximate and unverified; device waypoint behavior unchanged. Native Y64 samples do not establish surface height, structure footprints or unsampled accuracy. Full-world generator unresolved; rejected fitting experiments were not repeated.
