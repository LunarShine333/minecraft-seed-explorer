# Minecraft Seed Explorer

Personal Bedrock Overworld explorer for seed `3022187552114785111`.

The current app supports coordinate navigation, locally saved waypoints and
provenance-aware imported world data. It does **not yet calculate validated
biome or structure predictions automatically**. The exact Xbox release and
in-game engine comparisons are still needed.

- [World data format and accuracy gates](DATA_FORMAT.md)
- [Generator research and next integration steps](WORLDGEN_PLAN.md)

Serve this directory over HTTP, or use the existing GitHub Pages deployment.
No build or dependencies are required. Run `npm test` with Node 20+.

Waypoints persist on this device and have a separate JSON backup. World data
layers last for the session; importing them does not replace waypoints.
