# Requires amulet-leveldb==1.0.2. Operates on a copied, stopped test DB.
# Development decoder: numeric mapping currently covers plains/forest/meadow/deep_dark only.
# Data3D format reference: https://team-lodestone.github.io/Documentation/Bedrock/LevelDB_Output_Array_Formats/Data3D_Format.html
import struct,json,shutil,sys
from pathlib import Path
from leveldb import LevelDB
root=Path(sys.argv[1]);src=root/'bds-validation/worlds/seed-explorer-validation/db';dst=root/'db-inspection-copy';shutil.copytree(src,dst,dirs_exist_ok=True)
def decode(data):
 pos=512;sections=[]
 def u32():
  nonlocal pos
  n=struct.unpack_from('<I',data,pos)[0];pos+=4;return n
 for section in range(24):
  header=data[pos];pos+=1;bits=header>>1
  if bits==127:
   if not sections:raise ValueError('Missing inherited palette')
   sections.append(sections[-1]);continue
  if bits==0:sections.append([u32()]*4096);continue
  if bits not in [1,2,3,4,5,6,8,16]:raise ValueError('Invalid bits')
  per=32//bits;words=[u32() for _ in range((4096+per-1)//per)];count=u32()
  if count>65536:raise ValueError('Invalid palette size')
  palette=[u32() for _ in range(count)];mask=(1<<bits)-1
  sections.append([palette[(words[i//per]>>((i%per)*bits))&mask] for i in range(4096)])
 return sections
names={1:'minecraft:plains',4:'minecraft:forest',186:'minecraft:meadow',190:'minecraft:deep_dark'}
ref=json.loads((root/'minecraft-seed-explorer/research/bds/boundary-reference.json').read_text());db=LevelDB(str(dst));cache={};matches=0;errors=[];missing=[]
for p in ref['biomes']:
 key=(p['x']//16,p['z']//16)
 if key not in cache:
  try:cache[key]=decode(db.get(struct.pack('<ii',*key)+b'+'))
  except KeyError:cache[key]=None
 if cache[key] is None:missing.append(p);continue
 index=(p['x']%16)*256+(p['z']%16)*16+p['y']%16
 biomeid=cache[key][(p['y']+64)//16][index];actual=names.get(biomeid,'id:'+str(biomeid))
 if actual==p['biome']:matches+=1
 else:errors.append({**p,'stored':actual})
db.close();report={'checked':len(ref['biomes']),'storedDataMatchesScriptAPI':matches,'mismatches':errors,'missingStoredPoints':missing,'compared':matches+len(errors)};(root/'stored-biome-report.json').write_text(json.dumps(report,indent=2));print(matches,'/',len(ref['biomes']),'stored palette points match Script API')
