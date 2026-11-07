import test from 'node:test';
import assert from 'node:assert/strict';
import {TileRequestPool} from '../checked-tiles.mjs';
test('a throwing queued eligibility check rejects its own request without blocking neighbors',async()=>{
 const pool=new TileRequestPool(1);let release;
 const first=pool.run(()=>new Promise(resolve=>{release=resolve}));
 await new Promise(resolve=>setImmediate(resolve));
 const broken=pool.run(()=>assert.fail('must not start'),()=>{throw Error('stale view failure')});
 const rejected=assert.rejects(broken,/stale view failure/);
 const neighbor=pool.run(()=>42);
 release();await first;await rejected;assert.equal(await neighbor,42);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(pool.active,0);assert.equal(pool.queue.length,0);
});
