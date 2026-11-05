# Minecraft Seed Explorer

Personal Bedrock Overworld explorer for seed `3022187552114785111`.

The current app loads adjoining checked biome tiles as you pan/zoom, and supports
coordinate navigation, an approximate home marker, device waypoints and
provenance-aware imported world data. Checked coverage remains bounded. It does **not yet calculate validated
biome or structure predictions automatically**. Xbox target is 26.60 with experiments off; native BDS observations use
1.26.61.1. Older Xbox chunks may differ.

- [World data format and accuracy gates](DATA_FORMAT.md)
- [Generator research and next integration steps](WORLDGEN_PLAN.md)

Serve this directory over HTTP, or use the existing GitHub Pages deployment.
No build or dependencies are required. Run `npm test` with Node 20+.

Waypoints persist on this device and have a separate JSON backup. World data
layers last for the session; importing them does not replace waypoints.
