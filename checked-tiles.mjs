import {validateBundle, WORLD_SEED} from './world-data.mjs';
export const HOME = Object.freeze({x:128,z:24,name:'Home property (approximate)'});
export const CHERRY = Object.freeze({x:-2336,y:103,z:-288,name:'Cherry Grove (native Y103)'});
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
function cancelledRequest(){const error=new Error('Tile request is no longer needed.');error.name='AbortError';return error}

/** One shared pool caps HTTP work across overlapping views and layer reloads. */
export class TileRequestPool {
  constructor(limit=4){
    if(!Number.isInteger(limit)||limit<1||limit>16)throw Error('Invalid request concurrency.');
    this.limit=limit;this.active=0;this.queue=[];
  }
  run(task,needed=()=>true){
    return new Promise((resolve,reject)=>{this.queue.push({task,needed,resolve,reject});this.drain()});
  }
  drain(){
    while(this.active<this.limit&&this.queue.length){
      const job=this.queue.shift();
      if(!job.needed()){job.reject(cancelledRequest());continue}
      this.active++;
      Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{this.active--;this.drain()});
    }
  }
}
const sharedRequests=new TileRequestPool(4);

/** Validated cells stream progressively; cancelled views cannot enqueue more work. */
export class CheckedTileStore {
  constructor(catalog,fetchJSON,{maxCached=32,requestPool=sharedRequests}={}){
    this.catalog=validateCatalog(catalog);this.fetchJSON=fetchJSON;this.maxCached=maxCached;this.requests=requestPool;this.cache=new Map();this.pending=new Map();
  }
  async tile(entry,{signal}={}){
    if(signal?.aborted)throw cancelledRequest();
    if(this.cache.has(entry.id)){const value=this.cache.get(entry.id);this.cache.delete(entry.id);this.cache.set(entry.id,value);return value}
    if(this.pending.has(entry.id)){const job=this.pending.get(entry.id);job.signals.add(signal);return job.promise}
    const job={signals:new Set([signal])};
    job.promise=this.requests.run(async()=>{
      const bundle=validateBundle(await this.fetchJSON(entry.path),target);
      const t=bundle.biomes[0];
      if(bundle.source.kind!=='observed'||bundle.biomes.length!==1||bundle.structures.length||!t||t.step!==1||['x','z','y','width','height'].some(k=>t[k]!==entry[k]))throw Error('Tile does not match checked catalog.');
      t.source=bundle.source;this.cache.set(entry.id,t);
      while(this.cache.size>this.maxCached)this.cache.delete(this.cache.keys().next().value);
      return t;
    },()=>[...job.signals].some(s=>!s?.aborted)).finally(()=>{if(this.pending.get(entry.id)===job)this.pending.delete(entry.id)});
    this.pending.set(entry.id,job);return job.promise;
  }
  async view(bounds,y,{signal,onProgress}={}){
    const entries=visibleTiles(this.catalog,bounds,y),results=new Array(entries.length);let cursor=0,completed=0;
    const snapshot=()=>({bundle:{...this.catalog,biomes:results.flatMap(r=>r?.tile?[r.tile]:[])},expected:entries.length,completed,failed:results.filter(r=>r?.error).length,cancelled:!!signal?.aborted});
    await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{
      while(cursor<entries.length&&!signal?.aborted){
        const i=cursor++;
        try{results[i]={tile:await this.tile(entries[i],{signal})}}
        catch(error){if(signal?.aborted)break;results[i]={error}}
        if(signal?.aborted)break;
        completed++;onProgress?.(snapshot());
      }
    }));
    return snapshot();
  }
}
