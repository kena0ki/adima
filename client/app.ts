interface Global {
  amida: Amida
}
interface Amida {
  pageX: number,
  pageY: number,
  vLines: VLine[],
  hLines: HLineArray,
  svg: string,
  activeVlineIdx: number,
}
interface VLine {
  position: { x: number, y?: number },
  boundary: { x1: number, x2: number },
  members?: string[],
}
interface HLineArray {
  [key: string]: HLine,
}
interface HLine {
  key: string
  position: { x: number, y: number },
  ownerIdx: number,
  beingDragged?: boolean,
}

const NO_INDICATOR = -1;

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
  const hLines: HLineArray = (() => {
    const hLines: HLineArray = {}
    const timestamp = Date.now()
    for(let i=0, j=0; i<DEFAULT_HLINES; i++, j++) {
      if (j >= DEFAULT_VLINES - 1) j = 0;
      const key = 'hline' + timestamp + i
      hLines[key] = {
        key,
        position: { x: vLines[j].position.x, y: Math.floor(Math.random() * VLINE_HEIGHT) },
        ownerIdx: j,
      }
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
  svg += Object.keys(hLines).reduce((result, next) => {
    const h = hLines[next]
    return `${result}
      <g id="${h.key}" class="hline" transform="translate(${h.position.x},${h.position.y})" >
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
      pageX: root.children[0].getBoundingClientRect().left + scrollX,
      pageY: root.children[0].getBoundingClientRect().top + scrollY,
      vLines,
      hLines,
      svg,
      activeVlineIdx: NO_INDICATOR,
    }
    console.log(global.amida)

    document.querySelectorAll('[id^="hline"]').forEach(function(n) {
      draggablify(n as HTMLElement, global.amida)
    })
  })
})(Function('return this')())


function draggablify(hLineElm: HTMLElement, amida: Amida) {
  let pntrX = 0, pntrY = 0;
  hLineElm.onmousedown = function(mdEvt) {
    pntrX = mdEvt.clientX;
    pntrY = mdEvt.clientY;
    const key = (mdEvt.target as Element).parentElement.id
    const hLine = amida.hLines[key]
    let vLine = amida.vLines[hLine.ownerIdx]
    const indicator = document.getElementById('indicator')
    indicator.setAttribute('class', 'active')
    indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
    document.onmousemove = function(mmEvt) {
      const diffX = mmEvt.clientX - pntrX;
      const diffY = mmEvt.clientY - pntrY;
      pntrX = mmEvt.clientX;
      pntrY = mmEvt.clientY;
      hLine.position = { x: (+hLine.position.x + +diffX), y: (+hLine.position.y + +diffY) }
      const offsetFromAmidaLeft = (hLineElm.getBoundingClientRect().left + scrollX) - amida.pageX
      if (offsetFromAmidaLeft < vLine.boundary.x1) {
        if (hLine.ownerIdx > 0) {
          hLine.ownerIdx--
          vLine = amida.vLines[hLine.ownerIdx]
          amida.activeVlineIdx = hLine.ownerIdx
        } else {
          amida.activeVlineIdx = NO_INDICATOR
        }
      } else if (vLine.boundary.x2 < offsetFromAmidaLeft) {
        if (hLine.ownerIdx < amida.vLines.length - 2) {
          hLine.ownerIdx++
          vLine = amida.vLines[hLine.ownerIdx]
          amida.activeVlineIdx = hLine.ownerIdx
        } else {
          amida.activeVlineIdx = NO_INDICATOR
        }
      }
      hLineElm.setAttribute('transform', `translate(${hLine.position.x},${hLine.position.y})`)
      if (amida.activeVlineIdx === NO_INDICATOR) {
        indicator.setAttribute('class', 'inactive')
      } else {
        indicator.setAttribute('class', 'active')
        indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
      }
    }
    document.onmouseup = function() {
      document.onmousemove = null
      document.onmouseup = null
      if (amida.activeVlineIdx === NO_INDICATOR) {
        delete amida.hLines[key]
        hLineElm.parentNode.removeChild(hLineElm)
      } else {
        hLineElm.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
        indicator.setAttribute('class', 'inactive')
      }
    }
  }
}
