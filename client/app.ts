interface Global {
  amida: Amida
}
interface Amida {
  x,
  y,
  vLines: VLine[],
  hLines: HLine[],
  svg,
  activeVlineIdx,
}
interface VLine {
  position: { x, y? },
  boundary: { x1, x2 },
  members?: [],
}
interface HLine {
  position: { x, y },
  ownerIdx,
  beingDragged?,
}

(function(global: Global) {
  const DEFAULT_VLINES = 4;
  const DEFAULT_HLINES = 6;
  const VLINE_HEIGHT = 100
  const LINE_SPAN = 20;
  const vLines: VLine[] = (() => {
    const vLines: VLine[] = [];
    for(let i=0; i<DEFAULT_VLINES; i++) {
      const posX = i*LINE_SPAN
      vLines.push({
        position: { x: posX },
        boundary: { x1: posX - (LINE_SPAN/2), x2: posX + (LINE_SPAN/2) },
      })
    }
    return vLines;
  })()
  const hLines: HLine[] = (() => {
    const hLines: HLine[] = [];
    for(let i=0, j=0; i<DEFAULT_HLINES; i++, j++) {
      if (j >= DEFAULT_VLINES - 1) j = 0;
      hLines.push({
        position: { x: vLines[j].position.x, y: Math.floor(Math.random() * VLINE_HEIGHT) },
        ownerIdx: j,
      })
    }
    return hLines;
  })()
  let svg = `
  <svg height="210" width="500" xmlns="http://www.w3.org/2000/svg" >
    <g style="stroke:rgb(255,0,0);stroke-width:2" >`
  svg += vLines.reduce((result, next, idx) => {
    return `${result}
      <g id="vline${idx}" transform="translate(${next.position.x},0)" >
        <line x1="0" y1="0" x2="0" y2="${VLINE_HEIGHT}" />
      </g>`
  }, '')
  svg += hLines.reduce((result, next, idx) => {
    return `${result}
      <g id="hline${idx}" class="hline" transform="translate(${next.position.x},${next.position.y})" >
        <line x1="0" y1="0" x2="20" y2="0" />
      </g>`
  }, '')
  svg += `
    </g>
    <g id="indicator" class="inactive" transform="translate(0,0)" >
      <circle cx="4" cy="4" r="4" fill="blue" />
    </g>
    Sorry, your browser does not support inline SVG.
  </svg>`
  document.addEventListener('DOMContentLoaded', function(){
    const root = document.getElementById('root')
    root.innerHTML = svg
    global.amida = {
      x: root.children[0].getBoundingClientRect().x,
      y: root.children[0].getBoundingClientRect().y,
      vLines,
      hLines,
      svg,
      activeVlineIdx: 0,
    }
    console.log(global.amida)

    document.querySelectorAll('[id^="hline"]').forEach(function(n) {
      draggablify(n as HTMLElement, global.amida)
    })
  })
})(Function('return this')())


function draggablify(hLineElm: HTMLElement, amida: Amida) {
  let pntrX = 0, pntrY = 0;
  hLineElm.onmousedown = function(lEvt) {
    pntrX = lEvt.clientX;
    pntrY = lEvt.clientY;
    const idx = (lEvt.target as HTMLElement).parentElement.id.replace('hline', '')
    const hLine = amida.hLines[idx]
    let vLine = amida.vLines[hLine.ownerIdx]
    const indicator = document.getElementById('indicator')
    indicator.setAttribute('class', 'active')
    indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
    document.onmousemove = function(mEvt) {
        const diffX = mEvt.clientX - pntrX;
        const diffY = mEvt.clientY - pntrY;
        pntrX = mEvt.clientX;
        pntrY = mEvt.clientY;
        hLine.position = { x: (+hLine.position.x + +diffX), y: (+hLine.position.y + +diffY) }
        const offsetWithinAmidaX = mEvt.clientX - amida.x
        if (offsetWithinAmidaX < vLine.boundary.x1) {
          hLine.ownerIdx--
          vLine = amida.vLines[hLine.ownerIdx]
          amida.activeVlineIdx = hLine.ownerIdx
        } else if (vLine.boundary.x2 < offsetWithinAmidaX) {
          hLine.ownerIdx++
          vLine = amida.vLines[hLine.ownerIdx]
          amida.activeVlineIdx = hLine.ownerIdx
        }
        hLineElm.setAttribute('transform', `translate(${hLine.position.x},${hLine.position.y})`)
        indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
    }
    document.onmouseup = function() {
      document.onmousemove = null
      document.onmouseup = null
      indicator.setAttribute('class', 'inactive')
    }
  }
}
