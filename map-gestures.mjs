// Preserve the world point under the gesture's midpoint while zooming and panning.
export function pinchView(start, midpoint, distance, width, height) {
  const scale=Math.max(.001,Math.min(5,start.scale*distance/Math.max(1,start.distance)));
  const anchorX=start.cx+(start.midpoint.x-width/2)/start.scale;
  const anchorZ=start.cz+(start.midpoint.y-height/2)/start.scale;
  return {scale,cx:anchorX-(midpoint.x-width/2)/scale,cz:anchorZ-(midpoint.y-height/2)/scale};
}
