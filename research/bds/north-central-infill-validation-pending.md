# Validation pending

Atlas integration and generated assets committed to PR49. All 71 Python checks pass. Node suite still fails; inspect tests/native-desert-connection.test.mjs unknown-edge assertion (new sampled coverage may obsolete its unknown coordinate), and tests/raster-overview.test.mjs failure. No merge or deployment authorized until these failures are resolved and final checks pass. Published main remains unchanged. Next run should reproduce Node output and correct the specific stale assumptions or implementation defect, retaining unknown-border validation.
