interface Global {
  amida: Amida
}
interface Amida {
  pageX: number,
  pageY: number,
  vLines: VLine[],
  hLines: HLineArray,
  svg: string, // TODO getter
  activeVlineIdx: number,
}
interface HLineArray {
  [key: string]: HLine,
}
interface VLine {
  position: { x: number, y?: number },
  boundary: { x1: number, x2: number }, // TODO getter
  members?: string[],
}
interface HLine {
  key: string
  position: { x: number, y: number, adjustedY: number }, // TODO getter
  ownerIdx: number,
  beingDragged?: boolean,
}

(function(global: Global) {

  'use strict'

  const NO_INDICATOR = -1;
  const DEFAULT_VLINES = 4;
  const DEFAULT_HLINES = 6;
  const VLINE_HEIGHT = 200
  const VLINE_MARGIN_HEIGHT_RATIO = .1
  const VLINE_MARGIN_HEIGHT = VLINE_HEIGHT * VLINE_MARGIN_HEIGHT_RATIO
  const VLINE_CONTENT_HEIGHT = VLINE_HEIGHT - VLINE_MARGIN_HEIGHT
  const VLINE_CONTENT_MIN_POS = VLINE_MARGIN_HEIGHT / 2
  const VLINE_CONTENT_MAX_POS = VLINE_HEIGHT - VLINE_CONTENT_MIN_POS
  const LINE_SPAN = 40;
  const AMIDA_CONTAINER_MARGIN_RATIO = .2;

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
      const y = Math.floor(Math.random() * VLINE_CONTENT_HEIGHT) + (VLINE_CONTENT_MIN_POS);
      hLines[key] = {
        key,
        position: { x: vLines[j].position.x, y, adjustedY: y },
        ownerIdx: j,
      }
    }
    return hLines;
  })()
  let svg = `
  <svg id="amida-svg" height="${VLINE_HEIGHT*(1+AMIDA_CONTAINER_MARGIN_RATIO)}" width="${LINE_SPAN*DEFAULT_VLINES*(1+AMIDA_CONTAINER_MARGIN_RATIO)}" xmlns="http://www.w3.org/2000/svg" >
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
        <line x1="0" y1="0" x2="${LINE_SPAN}" y2="0" />
      </g>`
  }, '')
  svg += `
    </g>
    <g id="indicator" class="inactive" transform="translate(0,0)" >
      <circle cx="4" cy="4" r="4" fill="blue" />
    </g>
    Sorry, your browser does not support inline SVG.
  </svg>`
  const menu = `
  <div id="amida-menu" class="amida-menu-container" style="display: none">
    <div class="amida-menu-item" >
      <span class="amida-menu-item-text">Add a virtical line</span>
    </div>
    <div class="amida-menu-item" >
      <span class="amida-menu-item-text">Add a horizontal line</span>
    </div>
    <div class="amida-menu-item" >
      <span class="amida-menu-item-text">Clear</span>
    <div>
  </div>`

  document.addEventListener('DOMContentLoaded', function(){
    const rootElm = document.getElementById('root')
    rootElm.innerHTML = svg + menu
    const amida = {
      pageX: rootElm.children[0].getBoundingClientRect().left + scrollX,
      pageY: rootElm.children[0].getBoundingClientRect().top + scrollY,
      vLines,
      hLines,
      svg,
      activeVlineIdx: NO_INDICATOR,
    }
    global.amida = amida;

    const svgElm = document.getElementById('amida-svg') as unknown as SVGElement // https://github.com/microsoft/TypeScript/issues/32822
    const menuElm = document.getElementById('amida-menu')
    svgElm.addEventListener('contextmenu', cEvt => {
      cEvt.preventDefault()
      menuElm.style.left = cEvt.pageX + 'px'
      menuElm.style.top = cEvt.pageY + 'px'
      menuElm.style.display = ''
      const clearCtxMenu = () => {
        menuElm.style.display = 'none'
        document.removeEventListener('mousedown', clearCtxMenu)
      }
      document.addEventListener('mousedown', clearCtxMenu)
    })
    const addVLineElm = menuElm.children[0]
    addVLineElm.addEventListener('mousedown', () => { // TODO click event
      const lastVLineIdx = amida.vLines.length-1;
      const lastVLine = amida.vLines[lastVLineIdx];
      const newVLine: VLine = {
        position: { x: lastVLine.position.x + LINE_SPAN },
        boundary: { x1: lastVLine.boundary.x1 + LINE_SPAN, x2: lastVLine.boundary.x2 + LINE_SPAN }
      }
      amida.vLines.push(newVLine)
      const lastVLineElm = document.getElementById('vline'+lastVLineIdx)
      const clone = lastVLineElm.cloneNode(true) as SVGGElement
      clone.id = 'vline' + (amida.vLines.length-1)
      clone.setAttribute('transform', `translate(${newVLine.position.x}, 0)`)
      lastVLineElm.parentNode.insertBefore(clone, lastVLineElm.nextSibling)
      svgElm.setAttribute('width', '' + LINE_SPAN*amida.vLines.length*(1+AMIDA_CONTAINER_MARGIN_RATIO))
    })
    const addHLineElm = menuElm.children[1] as HTMLElement // cast is needed, otherwise mdEvt is not recognized as MouseEvent
    addHLineElm.addEventListener('mousedown', mdEvt => { // TODO click event
      console.log('x:', mdEvt.pageX - amida.pageX)
      const ownerIdx = (() => {
        const i = (amida.vLines.findIndex(v => {
          return (menuElm.getBoundingClientRect().left + scrollX - amida.pageX) < v.position.x
        }))
        const isLeftEnd = i === 0;
        const isRightEnd = i === -1;
        return isLeftEnd ? 0 : (isRightEnd ? amida.vLines.length - 2 : i - 1);
      })()
      const y = (menuElm.getBoundingClientRect().top + scrollY - amida.pageY)
      const adjustedY = y < VLINE_CONTENT_MIN_POS ? VLINE_CONTENT_MIN_POS :
            (VLINE_CONTENT_MAX_POS < y ? VLINE_CONTENT_MAX_POS : y)
      const key = `hline${Date.now()}1`
      const newHLine: HLine = {
        key,
        position: { x: amida.vLines[ownerIdx].position.x, y: adjustedY, adjustedY },
        ownerIdx,
      }
      amida.hLines[key] = newHLine
      const hLineElm = document.querySelector('[id^=hline]')
      const clone = hLineElm.cloneNode(true) as Element
      clone.id = key
      clone.setAttribute('transform', `translate(${newHLine.position.x}, ${newHLine.position.y})`)
      hLineElm.parentNode.insertBefore(clone, hLineElm.nextSibling)
      draggablify(clone, amida)
    })

    document.querySelectorAll('[id^="hline"]').forEach(function(n) {
      draggablify(n as Element, amida)
    })
  })

  function draggablify(hLineElm: Element, amida: Amida) {
    let pntrX = 0, pntrY = 0;
    hLineElm.addEventListener('mousedown', (mdEvt: MouseEvent) => {
      if (mdEvt.button !== 0) return;
      pntrX = +mdEvt.clientX;
      pntrY = +mdEvt.clientY;
      const key = (mdEvt.target as Element).parentElement.id
      const hLine = amida.hLines[key]
      let vLine = amida.vLines[hLine.ownerIdx]
      const indicator = document.getElementById('indicator')
      indicator.setAttribute('class', 'active')
      indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
      const dragging = mmEvt => {
        const diffX = +mmEvt.clientX - pntrX;
        const diffY = +mmEvt.clientY - pntrY;
        pntrX = +mmEvt.clientX;
        pntrY = +mmEvt.clientY;
        hLine.position = {
          x: hLine.position.x + diffX,
          y: hLine.position.y + diffY,
          adjustedY: hLine.position.y < VLINE_CONTENT_MIN_POS ? VLINE_CONTENT_MIN_POS :
            (VLINE_CONTENT_MAX_POS < hLine.position.y ? VLINE_CONTENT_MAX_POS : hLine.position.y)
        }
        const offsetFromAmidaLeft = (hLineElm.getBoundingClientRect().left + scrollX) - amida.pageX
        if (offsetFromAmidaLeft < vLine.boundary.x1) {
          if (0 < hLine.ownerIdx) {
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
        } else if (vLine.boundary.x1 < offsetFromAmidaLeft || offsetFromAmidaLeft < vLine.boundary.x2) {
          amida.activeVlineIdx = hLine.ownerIdx
        }
        hLineElm.setAttribute('transform', `translate(${hLine.position.x},${hLine.position.y})`)
        if (amida.activeVlineIdx === NO_INDICATOR) {
          indicator.setAttribute('class', 'inactive')
        } else {
          indicator.setAttribute('class', 'active')
          indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.adjustedY})`)
        }
      }
      document.addEventListener('mousemove', dragging)
      const dragEnd = () => {
        document.removeEventListener('mousemove', dragging)
        document.removeEventListener('mouseup', dragEnd)
        if (amida.activeVlineIdx === NO_INDICATOR) {
          delete amida.hLines[key]
          hLineElm.parentNode.removeChild(hLineElm)
        } else {
          hLine.position.y = hLine.position.adjustedY
          hLineElm.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
          indicator.setAttribute('class', 'inactive')
        }
      }
      document.addEventListener('mouseup', dragEnd)
    })
  }
})(Function('return this')())

