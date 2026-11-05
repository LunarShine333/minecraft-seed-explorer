"""Read-only little-endian NBT inspection of Bedrock level.dat."""
import struct,json,sys
from pathlib import Path
raw=Path(sys.argv[1]).read_bytes();version,length=struct.unpack_from('<II',raw);data=memoryview(raw)[8:];pos=0
if length!=len(data):raise ValueError('Header length mismatch')
def take(n):
 global pos
 if n<0 or pos+n>len(data):raise ValueError('Invalid NBT length')
 v=data[pos:pos+n];pos+=n;return v
def number(fmt):return struct.unpack('<'+fmt,take(struct.calcsize('<'+fmt)))[0]
def string():return bytes(take(number('H'))).decode('utf8')
def payload(tag):
 if tag in range(1,7):return number({1:'b',2:'h',3:'i',4:'q',5:'f',6:'d'}[tag])
 if tag==7:return list(bytes(take(number('i'))))
 if tag==8:return string()
 if tag==9:
  kind=number('B');n=number('i')
  if n<0 or n>1000000:raise ValueError('Invalid list size')
  return [payload(kind) for _ in range(n)]
 if tag==10:
  obj={}
  while True:
   kind=number('B')
   if kind==0:return obj
   name=string();obj[name]=payload(kind)
 if tag in [11,12]:
  n=number('i')
  if n<0 or n>1000000:raise ValueError('Invalid array size')
  return [number('i' if tag==11 else 'q') for _ in range(n)]
 raise ValueError('Unknown NBT tag '+str(tag))
root_kind=number('B');root_name=string();obj=payload(root_kind)
if pos!=len(data):raise ValueError('Unconsumed NBT bytes')
selected={k:v for k,v in obj.items() if any(s in k.lower() for s in ['seed','experiment','generator','version','levelname'])}
# JSON consumers must never interpret the 64-bit seed as a floating-point number.
if 'RandomSeed' in selected:selected['RandomSeed']=str(selected['RandomSeed'])
print(json.dumps({'headerVersion':version,'payloadBytes':length,'settings':selected},indent=2))
