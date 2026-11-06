import {checkedBiomeWitness} from './raster-overview.mjs';

// Exact recorded witnesses, not globally nearest occurrences or surface heights.
export async function checkedDestinations(store,y){
  const index=await store.rasterIndex();
  return [...new Set(index.pages.filter(p=>p.y===y).flatMap(p=>p.witnesses.map(w=>w.name)))].sort();
}
export async function checkedDestination(store,name,x,z,y){
  const index=await store.rasterIndex();
  const witness=checkedBiomeWitness(index.pages,name,x,z,y);
  if(!witness)return null;
  const cell=await store.cell(witness.x,witness.z,y);
  if(!cell||cell.name!==name)throw Error('Destination differs from its checked native tile. Please reload the map.');
  return {...cell,distance:witness.distance};
}
