"""Render a read-only acquisition probe from a pinned native plan."""
import argparse
import json
from pathlib import Path
import re
SEED='3022187552114785111'

def render_probe(plan, template):
    if (plan.get('schema')!='native-checked-area-plan-v1'
        or plan.get('seed')!=SEED or plan.get('version')!='26.60'
        or plan.get('sourceVersion')!='1.26.61.1'
        or plan.get('build')!='53069370' or plan.get('experiments') is not False
        or not re.fullmatch('[a-z][a-z0-9-]{0,39}',plan.get('id',''))):
        raise ValueError('Invalid native plan identity')
    jobs=plan.get('jobs')
    if not isinstance(jobs,list) or not 1<=len(jobs)<=512:
        raise ValueError('Invalid jobs')
    seen=set()
    for j in jobs:
        if not isinstance(j,dict) or any(type(j.get(k)) is not int for k in ('x','y','z')):
            raise ValueError('Invalid coordinates')
        key=(j['x'],j['y'],j['z'])
        if key in seen or not -64<=j['y']<320 or any(abs(j[k])>29999872 for k in ('x','z')):
            raise ValueError('Duplicate or out-of-range job')
        seen.add(key)
    if not any(j.get('control') is True and j.get('reference') for j in jobs):
        raise ValueError('Independent control required')
    text,n=re.subn(r'^const jobs=.*?;$','const jobs='+json.dumps(jobs)+';',template,count=1,flags=re.M)
    if n!=1 or "planId:'east-gap'" not in text:
        raise ValueError('Unexpected probe template')
    return text.replace("planId:'east-gap'","planId:'"+plan['id']+"'")

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--plan',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    template=Path(__file__).resolve().parents[1]/'research/bds/east-gap-probe.js'
    result=render_probe(json.loads(a.plan.read_text()),template.read_text())
    with a.output.open('x') as f:
        f.write(result)
