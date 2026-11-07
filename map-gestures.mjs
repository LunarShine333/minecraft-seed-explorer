// Preserve the world point under the gesture's midpoint while zooming and panning.
export function pinchView(start, midpoint, distance, width, height) {
  const scale=Math.max(.001,Math.min(5,start.scale*distance/Math.max(1,start.distance)));
  const anchorX=start.cx+(start.midpoint.x-width/2)/start.scale;
  const anchorZ=start.cz+(start.midpoint.y-height/2)/start.scale;
  return {scale,cx:anchorX-(midpoint.x-width/2)/scale,cz:anchorZ-(midpoint.y-height/2)/scale};
}

// Wheel/trackpad zoom keeps the inspected world location under the cursor.
export function wheelView(start, point, deltaY, deltaMode, width, height) {
  const pixels=deltaY*(deltaMode===1?16:deltaMode===2?height:1);
  const factor=Math.exp(-Math.max(-1000,Math.min(1000,pixels))*.002);
  return pinchView({...start,midpoint:point,distance:1},point,factor,width,height);
}
