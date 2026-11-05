// Search only supplied landmarks; proximity never implies complete world coverage.
export function findStructures(structures,{query='',type='',x=0,z=0}={}){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('Search center must be finite.');
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return structures.filter(p=>(!type||p.type===type)&&words.every(w=>(p.type.replaceAll('_',' ')+' '+p.x+' '+p.z).toLowerCase().includes(w)))
    .map(p=>({...p,distance:Math.hypot(p.x-x,p.z-z)}))
    .sort((a,b)=>a.distance-b.distance||a.type.localeCompare(b.type)||a.x-b.x||a.z-b.z);
}
