export function addMarker(fpe, pos: [number, number], className: string){
  const el = document.createElement('div');
  el.classList.add('markers', className)

  const marker = fpe.addHtmlMarker({
    el,
    pos: pos,
    offset: [0, 0],
  });
  return marker;
}

export function removeMarkers(markers: any[]){
  if(markers.length !== 0){
    markers.forEach(marker => marker.remove())
  }
}