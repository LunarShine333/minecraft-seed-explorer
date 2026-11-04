// Research only. Never emits an importable/approved world-data bundle.
import {mkdir, writeFile} from 'node:fs/promises';
import {WORLD_SEED, seedString} from '../world-data.mjs';
const base = 'https://www.mineseedfinder.com';
const seed = seedString(process.argv[2] || WORLD_SEED);
const requests = [
  ['/GetBiomes', {seed, x:'0', z:'0', size:'8', scale:'16', outputformat:'json'}],
  ['/scan/bedrock', {seed, x:'0', z:'0', radius:'64', max:'20', types:'5,8,9'}]
];
const report = {schema:'research-only', seed, edition:'bedrock', targetVersion:null,
  approvedForMap:false, reason:'API does not declare/select an exact Bedrock release. No in-game validation.',
  capturedAt:new Date().toISOString(), provider:base, requests:[]};
for (const [path, params] of requests) {
  const url=new URL(path,base); url.search=new URLSearchParams(params).toString();
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
    const body=await response.text();
    report.requests.push({url:url.toString(),status:response.status,
      cors:response.headers.get('access-control-allow-origin'), body});
  } catch(error) {report.requests.push({url:url.toString(),error:error.message})}
}
await mkdir('research',{recursive:true});
await writeFile('research/reference-probe.json',JSON.stringify(report,null,2)+'\n');
console.log('Saved research/reference-probe.json (NOT approved world data)');
if(report.requests.some(r=>r.status!==200))process.exitCode=1;
