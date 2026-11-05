# Continuous-coordinate sampler investigation

Tested whether stable Bedrock's block biome access could be reproduced by
sampling the candidate climate noise at fractional quart coordinates x/4.0,
y/4.0,z/4.0 rather than rounding coordinates or using Java Voronoi access.

Pinned core revision: 294c72ab0392dd818a91d293dbd5774d4874d64b,
MC_26_50 candidate mode. Reference: preserved 1,156 official-server observations.

After compiling with the correct `float getSpline(const Spline *, const float *)`
prototype and standard string header, the trial matched **1016/1156** points.
An initial incorrectly declared prototype invalidated an earlier local run;
that result is discarded and is not evidence about game generation.

The continuous-coordinate hypothesis also fails. Do not ship it as a fix.
This narrows the problem beyond simple floor/truncate/offset selection.
Investigate Bedrock-specific biome-access noise and climate evaluation next.
Actual measured data remains usable, and automatic biome output stays gated.
