# Official Bedrock reference run (not yet executed)

Target: stable Bedrock 26.60; no experiments; seed `3022187552114785111`.
The adjacent properties file is a disposable test-world configuration, never
for the user's existing Xbox world. Do not expose its ports publicly.

Official source: https://www.minecraft.net/en-us/download/server/bedrock
The download form requires agreement to the Minecraft EULA and Microsoft
Privacy Policy. Obtain user authorization before accepting those terms.
No server binary has been downloaded or executed for this project yet.

Before collecting references:
1. Obtain authorized official Linux stable package; verify its actual startup
   version matches 26.60 (not preview and not simply the latest release).
2. Extract into a new scratch directory. Do not commit server binaries or worlds.
3. Apply the supplied properties, verify generated world's seed and disabled
   experiments, and keep access restricted to local validation.
4. Record native biome readings with X/Y/Z, exact engine build and evidence.
   Console command structure searches alone do not provide biome point ground truth.
5. Record structure locations separately from biome points. Compare candidates
   and negative cases before approving individual structure capabilities.
6. Feed biome fixtures into scripts/validate-engine.mjs. Missing or inaccessible
   coordinates must remain failures, not assumed matches.

If official server access cannot be completed, report the blocker; do not
replace reference observations with outputs from a second cubiomes fork.
