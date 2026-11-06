import {validateBundle} from './world-data.mjs';

/** Index validation keeps PNGs tied to exactly the checked atlas, never unknown terrain. */
export function validateRasterIndex(raw,catalog){
  const identity=validateBundle({...raw,schemaVersion:1,structures:[],biomes:[]},catalog);
  if(raw.schema!=='checked-raster-atlas-v1'||identity.source.kind!=='observed'||raw.representation!=='lossless-native-cell-colors'||raw.pageSize!==512||raw.revision!==catalog.overview?.revision||!Array.isArray(raw.pages)||raw.pages.length>100000)throw Error('Raster overview does not match checked atlas.');
  const tiles=new Map(catalog.tiles.map(t=>[t.id,t])),covered=new Set(),ids=new Set();
  const pages=raw.pages.map(p=>{
    if(![p.x,p.z,p.y].every(Number.isSafeInteger)||p.x%512||p.z%512||p.width!==512||p.height!==512||p.id!==`${p.y}_${p.x}_${p.z}`||ids.has(p.id)||p.path!==`./data/overview/${p.id}-${raw.revision.slice(0,16)}.png`||!/^[0-9a-f]{64}$/.test(p.sha256)||!Array.isArray(p.coverage)||!p.coverage.length||p.coverage.length>16)throw Error('Invalid raster page.');
    ids.add(p.id);
    const pageTiles=p.coverage.map(id=>{
      const t=tiles.get(id);
      if(!t||covered.has(id)||t.y!==p.y||t.x<p.x||t.z<p.z||t.x+t.width>p.x+512||t.z+t.height>p.z+512)throw Error('Invalid raster coverage.');
      covered.add(id);return t;
    });
    if(!Array.isArray(p.witnesses)||p.witnesses.length>4096)throw Error('Invalid checked biome samples.');
    const names=new Set();
    const witnesses=p.witnesses.map(w=>{
      if(typeof w.name!=='string'||!w.name.startsWith('minecraft:')||w.name.length>80||names.has(w.name)||!/^#[0-9a-fA-F]{6}$/.test(w.color)||![w.x,w.z,w.y].every(Number.isSafeInteger)||w.y!==p.y||!pageTiles.some(t=>w.x>=t.x&&w.x<t.x+t.width&&w.z>=t.z&&w.z<t.z+t.height))throw Error('Checked biome sample lies outside coverage.');
      names.add(w.name);return {...w};
    });
    return {...p,coverage:[...p.coverage],witnesses};
  });
  if(covered.size!==tiles.size)throw Error('Raster overview omits checked tiles.');
  return {...identity,revision:raw.revision,pages};
}
export function visibleRasterPages(index,{minX,minZ,maxX,maxZ},y){
  return index.pages.filter(p=>p.y===y&&p.x<maxX&&p.x+p.width>minX&&p.z<maxZ&&p.z+p.height>minZ);
}
/** Representative is an exact native cell, without a global-nearest claim. */
export function checkedBiomeWitness(pages,name,x,z,y){
  let best=null;
  for(const page of pages)for(const p of page.witnesses){
    if(p.name!==name||p.y!==y)continue;
    const distance=Math.hypot(p.x-x,p.z-z);if(!best||distance<best.distance)best={...p,distance};
  }
  return best;
}
