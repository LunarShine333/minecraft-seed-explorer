# Official Bedrock reference workflow

Target: Xbox Bedrock 26.60; no experiments; seed `3022187552114785111`.

Current checkpoint: [WORLDGEN_PLAN.md](../../WORLDGEN_PLAN.md) and
[RELEASE_STATUS.md](../../RELEASE_STATUS.md). Official BDS 1.26.61.1 build
53069370 has been executed in disposable test worlds with prior user
authorization. Native observations retain that exact source version; they are
not reads of the Xbox save, whose original chunk generation version is unknown.
Older Xbox chunks may differ. No full-world prediction engine is approved.
The adjacent properties file is a disposable test-world configuration, never
for the user's existing Xbox world. Do not expose its ports publicly.

Official source: https://www.minecraft.net/en-us/download/server/bedrock
The official download form requires agreement to the Minecraft EULA and
Microsoft Privacy Policy; existing official BDS tests/EULA have prior user
authorization. Do not commit the server binary or temporary worlds.

Before collecting references:
1. Use the authorized official Linux stable package; record its actual startup
   version/build, not preview or an assumed target-version label. Source/target
   differences must remain explicit in every exported fixture.
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
