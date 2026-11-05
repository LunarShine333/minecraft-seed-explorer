import {validateBundle, WORLD_SEED} from './world-data.mjs';
export const HOME = Object.freeze({x:128,z:24,name:'Home property (approximate)'});
const target={seed:WORLD_SEED,version:'26.60'};
export function validateCatalog(raw){
  const base=validateBundle({...raw,biomes:[]},target);
  if(base.source.kind!=='observed'||!Array.isArray(raw.tiles)||raw.tiles.length>100000)throw Error('Invalid checked tile catalog.');
  const ids=new Set();
  const tiles=raw.tiles.map(t=>{
    if(typeof t.id!=='string'||ids.has(t.id)||!/^\.\/data\/tiles\/[\w-]+\.json$/.test(t.path))throw Error('Invalid tile identity or path.');
    ids.add(t.id);
    for(const n of [t.x,t.z,t.y,t.width,t.height])if(!Number.isSafeInteger(n)||Math.abs(n)>30000000)throw Error('Invalid tile bounds.');
    if(t.width<1||t.height<1||t.width>128||t.height>128)throw Error('Invalid tile size.');
    return {...t};
  });
  return {...base,tiles};
}
export function visibleTiles(catalog,{minX,minZ,maxX,maxZ},y){
  return catalog.tiles.filter(t=>t.y===y&&t.x<maxX&&t.x+t.width>minX&&t.z<maxZ&&t.z+t.height>minZ);
}
/** Small request pool and LRU; viewport snapshots never include stale regions. */
export class CheckedTileStore {
  constructor(catalog,fetchJSON,{maxCached=32}={}){
    this.catalog=validateCatalog(catalog);this.fetchJSON=fetchJSON;this.maxCached=maxCached;this.cache=new Map();this.pending=new Map();
  }
  async tile(entry){
    if(this.cache.has(entry.id)){const value=this.cache.get(entry.id);this.cache.delete(entry.id);this.cache.set(entry.id,value);return value}
    if(this.pending.has(entry.id))return this.pending.get(entry.id);
    const job=(async()=>{
      const bundle=validateBundle(await this.fetchJSON(entry.path),target);
      const t=bundle.biomes[0];
      if(bundle.source.kind!=='observed'||bundle.biomes.length!==1||bundle.structures.length||!t||t.step!==1||['x','z','y','width','height'].some(k=>t[k]!==entry[k]))throw Error('Tile does not match checked catalog.');
      t.source=bundle.source;this.cache.set(entry.id,t);
      while(this.cache.size>this.maxCached)this.cache.delete(this.cache.keys().next().value);
      return t;
    })();
    this.pending.set(entry.id,job);
    try{return await job}finally{this.pending.delete(entry.id)}
  }
  async view(bounds,y){
    const entries=visibleTiles(this.catalog,bounds,y),results=new Array(entries.length);let cursor=0;
    await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{
      while(cursor<entries.length){const i=cursor++;try{results[i]={tile:await this.tile(entries[i])}}catch(error){results[i]={error}}}
    }));
    return {bundle:{...this.catalog,biomes:results.flatMap(r=>r.tile?[r.tile]:[])},expected:entries.length,failed:results.filter(r=>r.error).length};
  }
}
