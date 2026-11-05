#include "generator.h"
#include "util.h"
#include <stdio.h>
int main(){Generator g;setupGenerator(&g,MC_26_50,0);applySeed(&g,0,UINT64_C(3022187552114785111));int ys[]={-48,0,64,128},first=1;puts("[");for(int j=0;j<4;j++)for(int z=-16;z<=16;z+=16)for(int x=-16;x<=16;x+=16){int id=getBiomeAt(&g,4,x/4,ys[j]/4,z/4);printf("%s{\"x\":%d,\"y\":%d,\"z\":%d,\"biome\":\"minecraft:%s\"}",first?"":",",x,ys[j],z,biome2str(MC_26_50,id));first=0;}puts("]");}
