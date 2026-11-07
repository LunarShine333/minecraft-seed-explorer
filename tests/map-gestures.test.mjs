import {test} from 'node:test';import assert from 'node:assert/strict';import {pinchView,wheelView} from '../map-gestures.mjs';
test('centered pinch doubles scale while preserving world center',()=>{assert.deepEqual(pinchView({cx:100,cz:-20,scale:2,distance:100,midpoint:{x:200,y:150}},{x:200,y:150},200,400,300),{cx:100,cz:-20,scale:4})});
test('moving midpoint pans while pinching',()=>{assert.deepEqual(pinchView({cx:100,cz:-20,scale:2,distance:100,midpoint:{x:200,y:150}},{x:240,y:130},200,400,300),{cx:90,cz:-15,scale:4})});
test('off-center anchor stays fixed and zoom respects limits',()=>{const start={cx:0,cz:0,scale:2,distance:100,midpoint:{x:100,y:150}};const next=pinchView(start,{x:300,y:150},200,400,300);assert.equal(next.cx,-75);assert.equal(next.cx+(300-200)/next.scale,-50);assert.equal(pinchView(start,{x:100,y:150},1e9,400,300).scale,5);assert.equal(pinchView(start,{x:100,y:150},0,400,300).scale,.001)});

test('wheel zoom preserves off-center world anchor, including clamped zoom',()=>{
  const start={cx:128,cz:24,scale:.1},point={x:350,y:50};
  for(const delta of [-100,100,-10000,10000,0]){
    const next=wheelView(start,point,delta,0,400,300);
    assert.ok(Math.abs(next.cx+(point.x-200)/next.scale-(128+150/.1))<1e-8);
    assert.ok(Math.abs(next.cz+(point.y-150)/next.scale-(24-100/.1))<1e-8);
    assert.ok(next.scale>=.001&&next.scale<=5);
    if(delta===0)assert.deepEqual(next,start);
  }
});
test('wheel delta units normalize lines and pages; tiny trackpad movements stay proportional',()=>{
  const s={cx:0,cz:0,scale:1},p={x:200,y:150};
  assert.deepEqual(wheelView(s,p,1,1,400,300),wheelView(s,p,16,0,400,300));
  assert.deepEqual(wheelView(s,p,1,2,400,300),wheelView(s,p,300,0,400,300));
  assert.ok(wheelView(s,p,-1,0,400,300).scale<1.01);
});
