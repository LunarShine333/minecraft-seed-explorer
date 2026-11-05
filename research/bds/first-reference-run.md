# Official server reference run

User authorized the official Minecraft EULA and Microsoft Privacy Policy for this temporary validation server.
Downloaded from https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.26.61.1.zip . Latest discovery endpoint pointed to 1.26.62.1, which was not substituted for the requested target.

Startup: Version 1.26.61.1, Build ID 53069370, Branch r/26_u6,
commit 86f7b32281709abd4444adb52887796af061c7bd. Fresh vanilla world;
Pack Stack - None; full configured seed 3022187552114785111.
Allowlist enabled with no entries; LAN visibility disabled; no Xbox world imported.

Native command results (X/Y/Z inputs are blocks):

| Command origin | Type | Result X/Z |
|---|---|---|
| 0,64,0 | village | 760,680 |
| 0,64,0 | monument | 184,712 |
| -904,64,152 | village | -904,152 |
| 760,64,680 | village | 760,680 |
| 184,64,712 | monument | 184,712 |
| 0,64,0 | ruined_portal | 264,152 |
| 0,64,0 | ancient_city | 552,-2664 |

Each command used `execute positioned X 64 Z run locate structure TYPE false`.
The game's origin search did not return the geometrically closest listed village;
do not treat its `nearest` label as proof of exhaustive distance ordering.
The targeted calls confirm both village coordinates are native locator hits.

These establish game locator coordinates only, not visual generation, exact Y,
biome points or global generator accuracy. `data/bedrock-26.60-landmarks.json`
is an importable observed bundle with these limitations retained in provenance.
Native reference gathering is now possible. Server was stopped after the run.
