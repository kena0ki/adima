interface vLine {
  position: { x, y? },
  boundary: { x1, x2 },
  active?,
  members?: [],
}
interface hLine {
  position: { x, y },
  ownerIdx,
  beingDragged?,
}

const DEFAULT_VLINES = 4;
const DEFAULT_HLINES = 10;
const VLINE_HEIGHT = 100
const LINE_SPAN = 20;
const svgData: { vLines: vLine[], hLines: hLine[] } = (() => {
  const vLines: vLine[] = [];
  for(let i=0; i<DEFAULT_VLINES; i++) {
    vLines.push({
      position: { x: i*LINE_SPAN },
      boundary: { x1: 0, x2: 0 },
    })
    vLines[i].boundary = { x1: vLines[i].position.x - (LINE_SPAN/2), x2: vLines[i].position.x + (LINE_SPAN/2) }
  }
  const hLines: hLine[] = [];
  for(let i=0, j=0; i<DEFAULT_HLINES; i++, j++) {
    if (j >= DEFAULT_VLINES - 1) j = 0;
    hLines.push({
      position: { x: vLines[j].position.x, y: Math.floor(Math.random() * VLINE_HEIGHT) },
      ownerIdx: j,
    })
  }
  return { vLines, hLines };
})()
console.log(svgData)
let svg = `
<svg height="210" width="500" xmlns="http://www.w3.org/2000/svg" >
  <g style="stroke:rgb(255,0,0);stroke-width:2" >`
svg += svgData.vLines.reduce((result, next) => {
  return `${result}
    <g id="vline1" transform="translate(${next.position.x},0)" >
      <line x1="0" y1="0" x2="0" y2="${VLINE_HEIGHT}" />
    </g>`
}, '')
svg += svgData.hLines.reduce((result, next) => {
  return `${result}
    <g id="hline1" class="hline" transform="translate(${next.position.x},${next.position.y})" >
      <line x1="0" y1="0" x2="20" y2="0" />
    </g>`
}, '')
svg += `
  </g>
  Sorry, your browser does not support inline SVG.
</svg>`

function draggablify(elm) {
  const regex = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/
  let posX = 0, posY = 0;
  elm.onmousedown = function(lEvt) {
    console.log(11)
    posX = lEvt.clientX;
    posY = lEvt.clientY;
    document.onmousemove = function(mEvt) {
        const diffX = mEvt.clientX - posX;
        const diffY = mEvt.clientY - posY;
        posX = mEvt.clientX;
        posY = mEvt.clientY;
        const xforms = elm.getAttribute('transform');
        const [, offsetX, offsetY] = regex.exec(xforms);
        elm.setAttribute('transform', 'translate(' + (+offsetX + +diffX) + ',' + (+offsetY + +diffY) + ')' )
        console.log(12)
    }
    document.onmouseup = function() {
      document.onmousemove = null
      document.onmouseup = null
      console.log(13)
    }
  }
}
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('root').innerHTML = svg
  document.querySelectorAll('[id^="hline"]').forEach(function(n) {
    console.log(n)
    draggablify(n)
  })
})
