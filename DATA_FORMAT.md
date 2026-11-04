# Bedrock world data

The app accepts JSON bundles through **Load world data**. No biome or structure
predictions ship enabled yet. The exact Xbox release must be entered first.
Your seed stays a string: `"3022187552114785111"`. A JSON number loses digits.

## Bundle contract

```json
{
  "schemaVersion": 1,
  "edition": "bedrock",
  "dimension": "overworld",
  "seed": "3022187552114785111",
  "version": "26.50",
  "source": {
    "kind": "observed",
    "name": "Source of the in-game observations",
    "evidence": "How and where these observations were collected"
  },
  "structures": [],
  "biomes": []
}
```

This empty example contains **no real world data**. `26.50` is an example,
not a claim about the Xbox world's version. Do not manufacture observations.
Both arrays are required; either can be empty. Unknown versions and editions
are rejected. A `1.` branding prefix is accepted (`1.26.50` → `26.50`), but
patches are never merged (`26.50.4` differs from `26.50`).

Each structure has `type` (a name), integer `x`, integer `z`, and optional
integer `y`, all in blocks. Waypoints are a separate collection and retain
their existing backup format. Loading a layer does not overwrite waypoints.
Imported observations are labelled **reported observations**, not independently
verified by this app. Files are processed locally and are not uploaded.
Layers last for the current session; reload the original JSON after reopening.

Each biome tile has `x`, `z`, `y`, `width`, `height`, `step`, `palette`, and
`samples`. `x,z` identify the north-west sample. Samples proceed west to east,
then north to south (Z increases south). The sample at column `i`, row `j`
is `(x+i*step, y, z+j*step)`. `palette` holds `{name, color}` entries with
six-digit hex colors. `samples` is a flat array of palette indices of length
`width*height`. All tiles carry explicit Y because biomes vary vertically.
Samples render as dots; unsampled blocks have no inferred biome. This prevents
a sparse grid from implying exact boundaries. Overlapping samples use the
first tile for inspection; producers should avoid conflicting overlaps.

Limits: 4 MB per file, 5,000 structures, 64 tiles, 262,144 total samples,
512 samples per tile side, spacing 1–256 blocks, coordinates ±30 million.
Invalid files are rejected atomically, leaving the previous layer intact.
Changing the selected version removes the current layer.

## Predictions and release approval

Predicted bundles use `source.kind: "predicted"` and additionally declare
`source.engineId` and `source.engineRevision`. They must match a locally shipped
entry in `VALIDATED_ENGINES` by engine ID, revision, exact version, edition and
dimension. The registry is deliberately empty. An imported file cannot approve
itself. Validation fixtures must include full 64-bit seeds, negative regions,
actual biome points at known Y, actual generated structures and absent candidates.
References must come from that Bedrock release or its Dedicated Server.
Agreement between two ports of the same algorithm is not independent game validation.

Before enabling an engine, pin its source revision, retain license notices,
run reference fixtures, document per-structure limitations, test the final
browser bundle on Safari, then add only the passing capability to the registry.
Structure candidates without biome/terrain checks are never actual structures.

## Current engine findings

- [SeedForge](https://github.com/fwsoapy/seedforge/blob/main/vendor/patches/README.md)
  distinguishes low-32-bit structure placement from full-64-bit biome generation.
  Its README still describes a 32-bit world seed. Its notes acknowledge assumed
  Java/Bedrock biome parity, chunk shifts for some structures, and unsupported
  Bedrock strongholds/trial chambers. These are blockers to approving it wholesale.
- [SeedFinder API source](https://github.com/zebedelu/SeedFinder/blob/main/server/app/api.py)
  parses the decimal seed with Python integers and sends it as `uint64_t`.
  It has permissive CORS, but no selectable Bedrock game version; it uses
  `MC_NEWEST`. Its hosted documentation and checked-in routes differ.
  It is suitable for collecting **research comparisons**, not silently
  presenting version-matched results for this world.

No proprietary Chunkbase code or assets are copied.
