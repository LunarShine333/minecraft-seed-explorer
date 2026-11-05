/* Diagnostic only. Link against the pinned cubiomes-bedrock checkout.
 * stdin: integer x y z rows. argv: 26.50|26.60, quart|block.
 * This does not declare either engine mode compatible with stable Bedrock.
 */
#include "generator.h"
#include "util.h"
#include <stdio.h>
#include <string.h>

static int quart(int value) { return value >= 0 ? value / 4 : (value - 3) / 4; }
int main(int argc, char **argv) {
    if (argc != 3 || (strcmp(argv[1], "26.50") && strcmp(argv[1], "26.60")) ||
        (strcmp(argv[2], "quart") && strcmp(argv[2], "block"))) return 2;
    int mc = !strcmp(argv[1], "26.60") ? MC_26_60 : MC_26_50;
    Generator g;
    setupGenerator(&g, mc, 0);
    applySeed(&g, DIM_OVERWORLD, UINT64_C(3022187552114785111));
    int x, y, z, first = 1;
    puts("[");
    while (scanf("%d %d %d", &x, &y, &z) == 3) {
        int id = !strcmp(argv[2], "quart") ? getBiomeAt(&g, 4, quart(x), quart(y), quart(z)) :
            getBiomeAt(&g, 1, x, y, z);
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
