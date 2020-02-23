interface Global {
  amida: Amida
}
interface Amida {
  pageX: number,
  pageY: number,
  vLines: VLine[],
  hLines: HLineArray,
  innerHTML: string, // TODO getter
  activeVlineIdx: number,
}
interface HLineArray {
  [key: string]: HLine,
}
interface VLine {
  position: { x: number, y?: number },
  routes: VLineRoutes,
  startRoute: string,
}
interface VLineRoutes {
  [key: string]: VLineRoute,
}
interface VLineRoute {
  nextHLineKey: string | null,
  lr: VLineRouteLR,
}
type VLineRouteLR = -1 | 1;
interface HLine {
  key: string
  position: HLinePos,
  ownerIdx: number,
  beingDragged?: boolean,
}
interface HLinePos {
  x: number,
  y: number,
}

class VLine implements VLine {
  private LINE_SPAN;
  public routes = {} as VLineRoutes;
  constructor(props) {
    Object.keys(props).forEach(key => {
      this[key] = props[key];
    })
  }
  public get boundary(): {x1:number, x2:number} {
    return { x1: this.position.x - (this.LINE_SPAN/2), x2: this.position.x + (this.LINE_SPAN/2) };
  }
}
class HLinePos implements HLinePos {
  private VLINE_CONTENT_MIN_POS;
  private VLINE_CONTENT_MAX_POS;
  constructor(props) {
    Object.keys(props).forEach(key => {
      this[key] = props[key];
    })
  }
  public get adjustedY(): number { // returns valid y position in the content area
    return this.y < this.VLINE_CONTENT_MIN_POS ? this.VLINE_CONTENT_MIN_POS :
            (this.VLINE_CONTENT_MAX_POS < this.y ? this.VLINE_CONTENT_MAX_POS : this.y)
  }
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
      vLines.push(new VLine({ position: { x: posX }, LINE_SPAN }));
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
      const newHLine = {
        key,
        position: new HLinePos({ x: vLines[j].position.x, y, VLINE_CONTENT_MAX_POS, VLINE_CONTENT_MIN_POS }),
        ownerIdx: j,
      }
      hLines[key] = newHLine;
      updateRoute(vLines[j].startRoute, vLines[j], 1, newHLine, hLines);
      updateRoute(vLines[j+1].startRoute, vLines[j+1], -1, newHLine, hLines);
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
    const rootElm = document.getElementById('root') as Element
    rootElm.innerHTML = svg + menu
    const amida: Amida = {
      pageX: rootElm.children[0].getBoundingClientRect().left + scrollX,
      pageY: rootElm.children[0].getBoundingClientRect().top + scrollY,
      vLines,
      hLines,
      innerHTML: rootElm.innerHTML,
      activeVlineIdx: NO_INDICATOR,
    }
    global.amida = amida;
    console.log(JSON.parse(JSON.stringify(amida)));

    const svgElm = document.getElementById('amida-svg') as unknown as SVGElement // https://github.com/microsoft/TypeScript/issues/32822
    const menuElm = document.getElementById('amida-menu') as HTMLElement
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
      const newVLine = new VLine({ position: { x: lastVLine.position.x + LINE_SPAN }, LINE_SPAN });
      amida.vLines.push(newVLine)
      const lastVLineElm = document.getElementById('vline'+lastVLineIdx) as unknown as SVGElement;
      const clone = lastVLineElm.cloneNode(true) as SVGGElement;
      clone.id = 'vline' + (amida.vLines.length-1);
      clone.setAttribute('transform', `translate(${newVLine.position.x}, 0)`);
      (lastVLineElm.parentNode as Node).insertBefore(clone, lastVLineElm.nextSibling);
      svgElm.setAttribute('width', '' + LINE_SPAN*amida.vLines.length*(1+AMIDA_CONTAINER_MARGIN_RATIO));
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
      const key = `hline${Date.now()}1`
      const newHLine: HLine = {
        key,
        position: new HLinePos({ x: amida.vLines[ownerIdx].position.x, y, VLINE_CONTENT_MIN_POS, VLINE_CONTENT_MAX_POS }),
        ownerIdx,
      };
      newHLine.position.y = newHLine.position.adjustedY; // New horizontal line should be placed at valid position, so let's immediately overwrite it
      amida.hLines[key] = newHLine;
      updateRoute(amida.vLines[ownerIdx].startRoute, amida.vLines[ownerIdx], 1, newHLine, amida.hLines);
      updateRoute(amida.vLines[ownerIdx+1].startRoute, amida.vLines[ownerIdx+1], -1, newHLine, amida.hLines);
      console.log(JSON.parse(JSON.stringify(amida)));
      const hLineElm = document.querySelector('[id^=hline]') as Node;
      const clone = hLineElm.cloneNode(true) as Element;
      clone.id = key;
      clone.setAttribute('transform', `translate(${newHLine.position.x}, ${newHLine.position.y})`);
      (hLineElm.parentNode as Node).insertBefore(clone, hLineElm.nextSibling);
      draggablify(clone, amida);
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
      const key = ((mdEvt.target as Element).parentElement as Element).id
      const hLine = amida.hLines[key]
      let vLine = amida.vLines[hLine.ownerIdx]
      const indicator = document.getElementById('indicator') as Element
      indicator.setAttribute('class', 'active')
      indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
      const dragging = mmEvt => {
        const diffX = +mmEvt.clientX - pntrX;
        const diffY = +mmEvt.clientY - pntrY;
        pntrX = +mmEvt.clientX;
        pntrY = +mmEvt.clientY;
        hLine.position = new HLinePos({
          x: hLine.position.x + diffX,
          y: hLine.position.y + diffY,
          VLINE_CONTENT_MIN_POS,
          VLINE_CONTENT_MAX_POS,
        })
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
          delete amida.hLines[key];
          // TODO rearrange route
          (hLineElm.parentNode as Node).removeChild(hLineElm);
        } else {
          hLine.position.y = hLine.position.adjustedY
          // TODO rearrange route
          hLineElm.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
          indicator.setAttribute('class', 'inactive')
        }
      }
      document.addEventListener('mouseup', dragEnd)
    })
  }
  function updateRoute(currentKey: string, vl: VLine, lr: VLineRouteLR, newHLine: HLine, hLines: HLineArray) {
    if (!currentKey) {
      if (vl.position.x === 40) {
        console.log('start:', currentKey );
        console.log('newHLine.key:', newHLine.key );
      }
      vl.startRoute = newHLine.key;
      vl.routes[newHLine.key] = { nextHLineKey: null, lr }
      return;
    }
    const currentRoute = vl.routes[currentKey];
    const startHLine = hLines[vl.startRoute]
    const isFirst = newHLine.position.y < startHLine.position.y;
    if (isFirst) {
      if (vl.position.x === 40) {
        console.log('first:', currentKey );
        console.log('newHLine.key:', newHLine.key );
      }
      vl.startRoute = newHLine.key;
      vl.routes[newHLine.key] = { nextHLineKey: currentKey, lr };
      return;
    }
    if (!currentRoute.nextHLineKey || // isLast
      newHLine.position.y <= hLines[currentRoute.nextHLineKey].position.y // isMiddle
      ) {
      if (vl.position.x === 40) {
        console.log(currentRoute.nextHLineKey?'middle:':'last:', currentKey);
        console.log('newHLine.position.y:', newHLine.position.y);
        console.log('hLines[currentRoute.nextHLineKey].position.y:', currentRoute.nextHLineKey? hLines[currentRoute.nextHLineKey].position.y:'');
        console.log('newHLine.key:', newHLine.key);
        console.log('currentRoute.nextHLineKey:', currentRoute.nextHLineKey);
      }
      vl.routes[newHLine.key] = { nextHLineKey: currentRoute.nextHLineKey /* Always null when isLast */, lr };
      currentRoute.nextHLineKey = newHLine.key;
      return;
    }
    updateRoute(currentRoute.nextHLineKey, vl, lr, newHLine, hLines);
  }
})(Function('return this')())

