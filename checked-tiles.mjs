import {validateRasterIndex,visibleRasterPages} from './raster-overview.mjs';
import {validateBundle,biomeAt, WORLD_SEED} from './world-data.mjs';
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
  // Tiles may cross bucket edges; index every touched bucket at this height.
  const occupied=new Map();
  for(const t of tiles){
    for(let x=Math.floor(t.x/128);x<=Math.floor((t.x+t.width-1)/128);x++)
      for(let z=Math.floor(t.z/128);z<=Math.floor((t.z+t.height-1)/128);z++){
        const key=`${t.y}:${x}:${z}`,neighbors=occupied.get(key)||[];
        if(neighbors.some(n=>n.x<t.x+t.width&&n.x+n.width>t.x&&n.z<t.z+t.height&&n.z+n.height>t.z))throw Error('Overlapping checked tiles at the same height.');
        neighbors.push(t);occupied.set(key,neighbors);
      }
  }
  let overview;
  if(raw.overview){
    if(raw.overview.path!=='./data/overview/index.json'||!/^[0-9a-f]{64}$/.test(raw.overview.revision))throw Error('Invalid raster overview identity.');
    overview={...raw.overview};
  }
  return {...base,tiles,...(overview?{overview}:{})};
}
export function visibleTiles(catalog,{minX,minZ,maxX,maxZ},y){
  return catalog.tiles.filter(t=>t.y===y&&t.x<maxX&&t.x+t.width>minX&&t.z<maxZ&&t.z+t.height>minZ);
}
// Prioritize the point being viewed; copy so catalog order stays immutable.
export function centerFirst(entries,bounds){
  const x=(bounds.minX+bounds.maxX)/2,z=(bounds.minZ+bounds.maxZ)/2;
  const distance=t=>Math.hypot(t.x+t.width/2-x,t.z+t.height/2-z);
  return [...entries].sort((a,b)=>distance(a)-distance(b));
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
      try {if(!job.needed()){job.reject(cancelledRequest());continue}}
      catch(error){job.reject(error);continue}
      this.active++;
      Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{this.active--;this.drain()});
    }
  }
}
const sharedRequests=new TileRequestPool(4);

/** Validated cells stream progressively; cancelled views cannot enqueue more work. */
export class CheckedTileStore {
  constructor(catalog,fetchJSON,{maxCached=32,requestPool=sharedRequests,fetchRaster=null,maxRasterCached=16}={}){
    this.catalog=validateCatalog(catalog);this.fetchJSON=fetchJSON;this.maxCached=maxCached;this.requests=requestPool;this.cache=new Map();this.pending=new Map();this.fetchRaster=fetchRaster;this.maxRasterCached=maxRasterCached;this.rasterCache=new Map();this.rasterPending=new Map();this.indexPromise=null;this.liveRasters=new Map();this.rasterGeneration=0;
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
  async cell(x,z,y,{signal}={}){
    if(![x,z,y].every(Number.isSafeInteger)||Math.abs(x)>30000000||Math.abs(z)>30000000)throw Error('Invalid checked cell coordinate.');
    const entry=this.catalog.tiles.find(t=>t.y===y&&x>=t.x&&x<t.x+t.width&&z>=t.z&&z<t.z+t.height);
    if(!entry)return null;
    const tile=await this.tile(entry,{signal});return {...biomeAt({biomes:[tile]},x,z,y),source:tile.source};
  }
  async rasterIndex(){
    if(!this.catalog.overview||!this.fetchRaster)throw Error('Raster overview unavailable.');
    if(!this.indexPromise)this.indexPromise=this.requests.run(async()=>validateRasterIndex(await this.fetchJSON(this.catalog.overview.path),this.catalog)).catch(error=>{this.indexPromise=null;throw error});
    return this.indexPromise;
  }
  async raster(page,{signal}={}){
    if(signal?.aborted)throw cancelledRequest();
    if(this.liveRasters.has(page.id))return this.liveRasters.get(page.id);
    if(this.rasterCache.has(page.id)){const image=this.rasterCache.get(page.id);this.rasterCache.delete(page.id);this.rasterCache.set(page.id,image);return image}
    if(this.rasterPending.has(page.id)){const job=this.rasterPending.get(page.id);job.signals.add(signal);return job.promise}
    const job={signals:new Set([signal])};
    job.promise=this.requests.run(async()=>{
      const image=await this.fetchRaster(page.path);
      if(image.width!==page.width||image.height!==page.height)throw Error('Raster image dimensions do not match checked page.');
      this.rasterCache.set(page.id,image);
      while(this.rasterCache.size>this.maxRasterCached)this.rasterCache.delete(this.rasterCache.keys().next().value);
      return image;
    },()=>[...job.signals].some(s=>!s?.aborted)).finally(()=>{if(this.rasterPending.get(page.id)===job)this.rasterPending.delete(page.id)});
    this.rasterPending.set(page.id,job);return job.promise;
  }
  async rasterView(bounds,y,{signal,onProgress}={}){
    const generation=++this.rasterGeneration;
    const index=await this.rasterIndex(),pages=centerFirst(visibleRasterPages(index,bounds,y),bounds),results=new Array(pages.length);let cursor=0,completed=0;
    const snapshot=()=>({mode:'raster',bundle:{...this.catalog,biomes:[]},rasters:results.flatMap(r=>r?.image?[{...r.page,image:r.image}]:[]),expected:pages.length,completed,failed:results.filter(r=>r?.error).length,cancelled:!!signal?.aborted});
    await Promise.all(Array.from({length:Math.min(4,pages.length)},async()=>{
      while(cursor<pages.length&&!signal?.aborted){
        const i=cursor++,page=pages[i];
        try{results[i]={page,image:await this.raster(page,{signal})}}
        catch(error){if(signal?.aborted)break;results[i]={error}}
        if(signal?.aborted)break;
        completed++;onProgress?.(snapshot());
      }
    }));
    const result=snapshot();
    if(!signal?.aborted&&generation===this.rasterGeneration)this.liveRasters=new Map(result.rasters.map(p=>[p.id,p.image]));
    return result;
  }
  async view(bounds,y,{signal,onProgress,overview=false}={}){
    if(signal?.aborted)return {mode:overview?'raster':'detail',bundle:{...this.catalog,biomes:[]},rasters:[],expected:0,completed:0,failed:0,cancelled:true};
    if(overview){
      try{return await this.rasterView(bounds,y,{signal,onProgress})}
      catch(error){
        if(signal?.aborted)return {mode:'raster',bundle:{...this.catalog,biomes:[]},rasters:[],expected:0,completed:0,failed:0,cancelled:true};
        return this.view(bounds,y,{signal,onProgress:r=>onProgress?.({...r,overviewUnavailable:true})}).then(r=>({...r,overviewUnavailable:true}));
      }
    }
    this.liveRasters.clear();this.rasterGeneration++;
    const entries=centerFirst(visibleTiles(this.catalog,bounds,y),bounds),results=new Array(entries.length);let cursor=0,completed=0;
    const snapshot=()=>({mode:'detail',bundle:{...this.catalog,biomes:results.flatMap(r=>r?.tile?[r.tile]:[])},expected:entries.length,completed,failed:results.filter(r=>r?.error).length,cancelled:!!signal?.aborted});
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
