# Requires amulet-leveldb==1.0.2. Operates on a copied, stopped test DB.
# Numeric-name mapping covers the seven biome IDs observed in the stored test region.
# Data3D format reference: https://team-lodestone.github.io/Documentation/Bedrock/LevelDB_Output_Array_Formats/Data3D_Format.html
import struct,json,shutil,sys
from pathlib import Path
from leveldb import LevelDB
from bedrock_data3d import decode
root=Path(sys.argv[1]);src=root/'bds-validation/worlds/seed-explorer-validation/db';dst=root/'db-inspection-copy';shutil.copytree(src,dst,dirs_exist_ok=True)
names={1:'minecraft:plains',4:'minecraft:forest',25:'minecraft:stone_beach',182:'minecraft:jagged_peaks',184:'minecraft:snowy_slopes',186:'minecraft:meadow',190:'minecraft:deep_dark'}
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
