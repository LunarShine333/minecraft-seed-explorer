/* Fractional diagnostic adapted from cubiomes-bedrock at revision
 * 294c72ab0392dd818a91d293dbd5774d4874d64b, sampleBiomeNoise().
 * Copyright (c) 2020 Cubitect. MIT license: see cubiomes-LICENSE.txt.
 * Only diagnostic coordinate types changed; no map approval implied.
 */
#include "generator.h"
#include "util.h"
#include <stdio.h>
#include <string.h>
float getSpline(const Spline *sp, const float *vals);
int sampleBiomeNoiseFractional(const BiomeNoise *bn, int64_t *np, double x, double y, double z,
    uint64_t *dat, uint32_t sample_flags)
{
    if (bn->nptype >= 0)
    {   // initialized for a specific climate parameter
        if (np)
            memset(np, 0, NP_MAX*sizeof(*np));
        int64_t id = (int64_t) (10000.0 * sampleClimatePara(bn, np, x, z));
        return (int) id;
    }

    float t = 0, h = 0, c = 0, e = 0, d = 0, w = 0;
    double px = x, pz = z;
    if (!(sample_flags & SAMPLE_NO_SHIFT))
    {
        px += sampleDoublePerlin(&bn->climate[NP_SHIFT], x, 0, z) * 4.0;
        pz += sampleDoublePerlin(&bn->climate[NP_SHIFT], z, x, 0) * 4.0;
    }

    c = sampleDoublePerlin(&bn->climate[NP_CONTINENTALNESS], px, 0, pz);
    e = sampleDoublePerlin(&bn->climate[NP_EROSION], px, 0, pz);
    w = sampleDoublePerlin(&bn->climate[NP_WEIRDNESS], px, 0, pz);

    if (!(sample_flags & SAMPLE_NO_DEPTH))
    {
        float np_param[] = {
            c, e, -3.0F * ( fabsf( fabsf(w) - 0.6666667F ) - 0.33333334F ), w,
        };
        double off = getSpline(bn->sp, np_param) + 0.015F;

        //double py = y + sampleDoublePerlin(&bn->shift, y, z, x) * 4.0;
        d = 1.0 - (y * 4) / 128.0 - 83.0/160.0 + off;
    }

    t = sampleDoublePerlin(&bn->climate[NP_TEMPERATURE], px, 0, pz);
    h = sampleDoublePerlin(&bn->climate[NP_HUMIDITY], px, 0, pz);

    int64_t l_np[6];
    int64_t *p_np = np ? np : l_np;
    p_np[0] = (int64_t)(10000.0F*t);
    p_np[1] = (int64_t)(10000.0F*h);
    p_np[2] = (int64_t)(10000.0F*c);
    p_np[3] = (int64_t)(10000.0F*e);
    p_np[4] = (int64_t)(10000.0F*d);
    p_np[5] = (int64_t)(10000.0F*w);

    int id = none;
    if (!(sample_flags & SAMPLE_NO_BIOME))
        id = climateToBiome(bn->mc, (const uint64_t*)p_np, dat);
    return id;
}



/* Diagnostic fractional-coordinate sampling; not approved for map use. */
#include "generator.h"
#include "util.h"
#include <stdio.h>
#include <string.h>

static int quart(int value) { return value >= 0 ? value / 4 : (value - 3) / 4; }
int main(int argc, char **argv) {
    if (argc != 3 || (strcmp(argv[1], "26.50") && strcmp(argv[1], "26.60")) ||
        strcmp(argv[2], "fractional")) return 2;
    int mc = !strcmp(argv[1], "26.60") ? MC_26_60 : MC_26_50;
    Generator g;
    setupGenerator(&g, mc, 0);
    applySeed(&g, DIM_OVERWORLD, UINT64_C(3022187552114785111));
    int x, y, z, first = 1;
    puts("[");
    while (scanf("%d %d %d", &x, &y, &z) == 3) {
        int id = sampleBiomeNoiseFractional(&g.bn, NULL, x / 4.0, y / 4.0, z / 4.0, NULL, 0);
        const char *name = biome2str(mc, id);
        if (!name) {
            switch (id) {
            case snowy_slopes: name = "snowy_slopes"; break;
            case jagged_peaks: name = "jagged_peaks"; break;
            default: name = "unknown"; break;
            }
        }
        printf("%s{\"x\":%d,\"y\":%d,\"z\":%d,\"biome\":\"minecraft:%s\"}",
            first ? "" : ",", x, y, z, name);
        first = 0;
    }
    puts("]");
    return 0;
}
