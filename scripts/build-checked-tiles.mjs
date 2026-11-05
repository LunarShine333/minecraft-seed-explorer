import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {validateBundle, WORLD_SEED} from '../world-data.mjs';
const target={seed:WORLD_SEED,version:'26.60'};
const read=p=>validateBundle(JSON.parse(readFileSync(p,'utf8')),target);
const wide=read('data/bedrock-26.60-wide-area.json');
const local=read('data/bedrock-26.60-checked-area.json');
const cherry=read('data/bedrock-26.60-cherry-grove.json');
const tiles=[];
mkdirSync('data/tiles',{recursive:true});
for(const bundle of [wide,local,cherry])for(const t of bundle.biomes){
  if(bundle===local&&t.y===64)continue; // Wide data contains this exact overlap.
  for(let j=0;j<t.height;j+=128)for(let i=0;i<t.width;i+=128){
    const width=Math.min(128,t.width-i),height=Math.min(128,t.height-j);
    const tile={...t,x:t.x+i,z:t.z+j,width,height,samples:[]};
    for(let row=0;row<height;row++)tile.samples.push(...t.samples.slice((j+row)*t.width+i,(j+row)*t.width+i+width));
    const id=`${t.y}_${tile.x}_${tile.z}`,path=`./data/tiles/${id}.json`;
    const output={...bundle,structures:[],biomes:[tile]};
    writeFileSync(path,JSON.stringify(output)+'\n');
    tiles.push({id,path,x:tile.x,z:tile.z,y:tile.y,width,height});
  }
}
writeFileSync('data/checked-tiles.json',JSON.stringify({schemaVersion:1,...target,edition:'bedrock',dimension:'overworld',source:{kind:'observed',name:'Official Bedrock server: checked tile atlas',evidence:'BDS 1.26.61.1 build 53069370; exact seed, experiments off. Tiles retain original per-file provenance. Y64: decoded 512 × 512 cells, 1024 native chunk-center checks. Y-48/0/128: decoded 256 × 256 cells, decoder checked against 1156 original and 320 held-out samples. Y103: Cherry Grove 64 × 64 native API cells. Structures: 36 native locator positions, Y unknown, partial coverage. No prediction engine approved. Older Xbox chunks may differ. Source bundle evidence remains in each tile file.'},structures:wide.structures,tiles},null,2)+'\n');
