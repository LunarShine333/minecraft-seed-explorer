# Reproducible stored-biome export

`scripts/export_stored_biomes.py` exports game-stored cells, not generated predictions.
It accepts a stopped **copy** of an Overworld DB, an observed data bundle as a
template, and an explicit numeric-ID palette. It never opens the user's Xbox save.

Before using a template, independently confirm that its seed, release, experiments
and provenance describe the source database. The exporter does not verify those
facts from level.dat. Existing structure records are retained from the template;
their evidence must also remain applicable. Update source evidence for new areas.

Dependencies used for the existing test database:

```sh
python -m pip install 'Cython<3' wheel versioneer
CC=gcc CXX=g++ python -m pip install --no-build-isolation amulet-leveldb==1.0.2
```

Example, from the repository root, with paths to a copied DB and a verified bundle:

```sh
python scripts/export_stored_biomes.py \
  --db-copy /path/to/stopped-db-copy \
  --template /path/to/verified-observed-bundle.json \
  --palette research/bds/stored-biome-palette.json \
  --output /path/to/export.json \
  --x -128 --z -128 --width 256 --height 256 --step 1 --y -48 0 64
```

The included palette covers only seven IDs encountered in the checked region.
ID 25 uses `minecraft:stony_shore`, equivalent to the native API's `stone_beach`
label in our checks. Never guess a name for a new numeric ID.

Missing chunks, unknown IDs, invalid heights and oversized bundles abort before
writing output. Palette order may differ from an older export; compare resolved
names/colors at each cell rather than raw palette indices. Step >1 exports only
recorded sample positions and does not claim intervening coverage.

The application importer still checks exact seed/release and provenance. Passing
these checks does not approve any global prediction engine or establish that
newly generated test chunks match older chunks in the Xbox world.
