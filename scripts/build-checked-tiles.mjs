import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
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
// Append complete native acquisitions. Supersede smaller tiles only after every
// overlapping cell agrees; preserve the legacy source files for imports.
for(const extensionPath of ['research/bds/cherry-route-manifest.json','research/bds/home-area-manifest.json','research/bds/west-area-manifest.json','research/bds/north-monument-manifest.json','research/bds/shipwreck-approach-manifest.json','research/bds/eastern-temple-manifest.json','research/bds/outpost-approach-manifest.json','research/bds/south-home-manifest.json','research/bds/stronghold-approach-manifest.json','research/bds/desert-destination-manifest.json','research/bds/desert-connection-manifest.json','research/bds/eastern-candidates-manifest.json','research/bds/wider-east-manifest.json','research/bds/southeast-manifest.json','research/bds/south-junction-manifest.json','research/bds/home-east-fill-manifest.json','research/bds/middle-east-manifest.json','research/bds/east-gap-manifest.json','research/bds/north-gap-manifest.json','research/bds/north-west-infill-manifest.json','research/bds/north-central-infill-manifest.json','research/bds/north-home-infill-manifest.json','research/bds/north-base-infill-manifest.json','research/bds/north-origin-infill-manifest.json','research/bds/north-west-origin-infill-manifest.json','research/bds/north-west-join-infill-manifest.json','research/bds/north-west-outer-infill-manifest.json','research/bds/north-west-edge-infill-manifest.json','research/bds/north-shipwreck-infill-manifest.json','research/bds/north-westward-infill-manifest.json','research/bds/north-westward-outer-infill-manifest.json']){
if(existsSync(extensionPath)){
  const extension=JSON.parse(readFileSync(extensionPath,'utf8'));
  if(extension.seed!==target.seed||extension.version!==target.version||extension.experiments!==false)throw Error('Wrong extension world settings');
  for(const entry of extension.tiles){
    const bundle=read(entry.path),next=bundle.biomes[0];
    if(bundle.source.kind!=='observed'||bundle.biomes.length!==1||next.step!==1||['x','z','y','width','height'].some(k=>next[k]!==entry[k]))throw Error('Invalid native extension tile');
    for(let i=tiles.length-1;i>=0;i--){
      const old=tiles[i];if(old.y!==entry.y)continue;
      const overlap=old.x<entry.x+entry.width&&old.x+old.width>entry.x&&old.z<entry.z+entry.height&&old.z+old.height>entry.z;
      if(!overlap)continue;
      const prior=read(old.path).biomes[0];
      for(let z=Math.max(old.z,entry.z);z<Math.min(old.z+old.height,entry.z+entry.height);z++)for(let x=Math.max(old.x,entry.x);x<Math.min(old.x+old.width,entry.x+entry.width);x++){
        const a=prior.palette[prior.samples[(z-old.z)*old.width+x-old.x]].name;
        const b=next.palette[next.samples[(z-entry.z)*entry.width+x-entry.x]].name;
        if(a!==b)throw Error('Native overlap mismatch at '+x+','+entry.y+','+z);
      }
      if(old.x>=entry.x&&old.z>=entry.z&&old.x+old.width<=entry.x+entry.width&&old.z+old.height<=entry.z+entry.height)tiles.splice(i,1);
      else throw Error('Partly overlapping atlas tiles require splitting first');
    }
    tiles.push(entry);
  }
}
}
writeFileSync('data/checked-tiles.json',JSON.stringify({schemaVersion:1,...target,edition:'bedrock',dimension:'overworld',source:{kind:'observed',name:'Official Bedrock server: checked tile atlas',evidence:'BDS 1.26.61.1 build 53069370; exact seed, experiments off. Tiles retain original per-file provenance. Y64: decoded 512 × 512 cells, 1024 native chunk-center checks. Y-48/0/128: decoded 256 × 256 cells, decoder checked against 1156 original and 320 held-out samples. Y103: Cherry Grove native API cells. The route extension contains directly sampled 128 × 128 tiles; research/bds/cherry-route-manifest.json, home-area-manifest.json, west-area-manifest.json north-monument-manifest.json shipwreck-approach-manifest.json eastern-temple-manifest.json outpost-approach-manifest.json south-home-manifest.json stronghold-approach-manifest.json desert-destination-manifest.json and desert-connection-manifest.json record acquisition evidence and settings for native extensions. Structures: 36 native locator positions, Y unknown, partial coverage. No prediction engine approved. Older Xbox chunks may differ. Source bundle evidence remains in each tile file.'},structures:wide.structures,tiles},null,2)+'\n');

// Catalog changes must never leave an old overview attached to new native data.
const overviewBuild=spawnSync('python',['scripts/build_raster_overview.py'],{stdio:'inherit'});
if(overviewBuild.error||overviewBuild.status!==0)throw Error('Could not rebuild lossless checked overview.');
