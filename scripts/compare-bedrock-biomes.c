/* Research only. Compile against FragrantResult186/cubiomes-bedrock
 * revision 294c72ab0392dd818a91d293dbd5774d4874d64b:
 * gcc -O2 -fwrapv -I <core> scripts/compare-bedrock-biomes.c <core>/libcubiomes.a -lm -o compare-biomes
 * This compares two candidate modes; neither is independently validated here.
 */
#include "generator.h"
#include <stdio.h>
#include <inttypes.h>
int main(void) {
 uint64_t seed=UINT64_C(3022187552114785111); Generator a,b;
 setupGenerator(&a,MC_26_50,0);setupGenerator(&b,MC_26_60,0);
 applySeed(&a,DIM_OVERWORLD,seed);applySeed(&b,DIM_OVERWORLD,seed);
 printf("{\"seed\":\"%" PRIu64 "\",\"researchOnly\":true,\"comparisons\":[",seed);
 int ys[]={-48,0,64,128},first=1;
 for(int j=0;j<4;j++) {int count=0,diff=0,ice=0;
 for(int z=-1024;z<=1024;z+=32)for(int x=-1024;x<=1024;x+=32){
 int old=getBiomeAt(&a,1,x,ys[j],z),now=getBiomeAt(&b,1,x,ys[j],z);
 count++;diff+=(old!=now);ice+=(now==ice_caves);
 }
 printf("%s{\"y\":%d,\"samples\":%d,\"different\":%d,\"previewIceCaves\":%d}",first?"":",",ys[j],count,diff,ice);first=0;
 }
 puts("]}");return 0;
}
