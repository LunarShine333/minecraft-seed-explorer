import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {seedString,exactVersion} from '../world-data.mjs';
export function compareReference(reference, prediction) {
  if(reference?.schema!=='bedrock-game-reference-v1'||prediction?.schema!=='bedrock-engine-output-v1')throw Error('Invalid reference/output schema');
  for(const input of [reference,prediction]){
    seedString(input.seed);exactVersion(input.version);
    if(input.edition!=='bedrock'||input.dimension!=='overworld'||input.experiments!==false)throw Error('Expected Bedrock Overworld, Experiments off');
  }
  if(reference.seed!==prediction.seed||exactVersion(reference.version)!==exactVersion(prediction.version))throw Error('Seed/version mismatch');
  if(!['xbox','bedrock-dedicated-server'].includes(reference.source?.type)||!reference.source?.evidence?.trim())throw Error('Game reference evidence required');
  if(!prediction.engine?.id||!prediction.engine?.revision)throw Error('Pinned engine identity required');
  if(!Array.isArray(reference.biomes)||!reference.biomes.length)throw Error('No actual game biome references supplied');
  const index=new Map();
  for(const row of prediction.biomes||[]){
    const key=pointKey(row);if(index.has(key))throw Error('Duplicate engine sample');index.set(key,row.biome);
  }
  const seen=new Set(), mismatches=[];
  for(const row of reference.biomes){
    const key=pointKey(row);if(seen.has(key))throw Error('Duplicate game reference');seen.add(key);
    if(index.get(key)!==row.biome)mismatches.push({x:row.x,y:row.y,z:row.z,expected:row.biome,actual:index.get(key)??null});
  }
  return {schema:'bedrock-validation-report-v1',seed:reference.seed,version:exactVersion(reference.version),
    engine:prediction.engine,checked:seen.size,passed:seen.size-mismatches.length,mismatches,
    // A bounded fixture comparison cannot approve a whole generator or structures.
    approvedForMap:false,scope:'supplied biome points only; no structure validation',
    matchesSuppliedReferences:mismatches.length===0};
}
function pointKey(row){
  if(![row.x,row.y,row.z].every(Number.isSafeInteger)||typeof row.biome!=='string'||!row.biome.startsWith('minecraft:'))throw Error('Invalid biome point');
  return `${row.x},${row.y},${row.z}`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [ref,output,report]=process.argv.slice(2);
    if(!ref||!output||!report)throw Error('Usage: node scripts/validate-engine.mjs game-reference.json engine-output.json report.json');
    const result=compareReference(JSON.parse(await readFile(ref,'utf8')),JSON.parse(await readFile(output,'utf8')));
    await writeFile(report,JSON.stringify(result,null,2)+'\n');
    console.log(`${result.passed}/${result.checked} reference biome points match. No automatic engine approval.`);
    if(!result.matchesSuppliedReferences)process.exitCode=1;
  }catch(error){console.error(error.message);process.exitCode=1}
}
