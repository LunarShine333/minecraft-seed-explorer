# Northwest atlas integration

Eight strictly exported native BDS 1.26.61.1 tiles are registered at Y64: X1024..1279, Z-1024..-513. Adds 131,072 measured biome cells; no prediction or terrain-height validation. Xbox target remains 26.60, experiments off, original generation version unknown. Existing waypoints and older-chunk caveats unchanged.

Atlas: 501 tiles, 8,208,384 height-specific cells; Y64: 484 tiles, 7,929,856 cells. Revision 9fdd96ba22b55ed60539a415f2a643b92d54e7f08d40b1a0e3148548e087a23a.

Local validation passed: 103 Node tests and 70 Python tests, including strict native evidence reproduction and northwest streaming/unknown-border checks. CI and deployment remain pending. Do not merge until final checks pass. Full-world generation remains unresolved.
