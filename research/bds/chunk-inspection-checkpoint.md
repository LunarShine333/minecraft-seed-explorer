# Stored-world inspection checkpoint

Read actual level.dat using scripts/read-bedrock-level.py. Header length and
complete NBT consumption passed. RandomSeed is exactly 3022187552114785111;
Generator is 1; experiments_ever_used and saved_with_toggled_experiments are
both zero. This rules out a seed or experimental-settings mismatch in the
reference world. Settings snapshot is stored alongside this file.

Direct chunk palette inspection is not completed. amulet-leveldb installation
failed first due missing CMake, then an older release failed with Cython signature
errors. Installed CMake and Ninja, selected native CMake binary rather than
its Python wrapper for build isolation, but latest installation did not complete
in the bounded attempt and was stopped. No chunk palettes were decoded and no
map-generator approval follows from this checkpoint.

Continue with a compatible pinned reader/build toolchain or a direct Data3D
reader, operating only on a copy of the stopped temporary test-world database.
Do not replace actual reference biomes with candidate engine outputs.
