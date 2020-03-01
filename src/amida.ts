interface Global extends Window{
  amida: Amida,
  log: (...any) => void,
}
interface Amida {
  pageX: number,
  pageY: number,
  vLines: VLine[],
  hLines: HLineArray,
  innerHTML: string, // TODO getter
  activeVlineIdx: number,
  players: Player[],
  goals: string[] | number[],
}
interface HLineArray {
  [key: string]: HLine,
}
interface VLine {
  position: { x: number },
  routes: VLineRoutes,
  startRoute: string | null,
}
interface VLineRoutes {
  [key: string]: VLineRoute, // HLine.key value is used as this key value
}
interface VLineRoute {
  nextKey: string | null,
  prevKey: string | null,
  lr: VLineRouteLR,
}
type VLineRouteLR = -1 | 1;
interface HLine {
  key: string
  position: HLinePos,
  ownerIdx: number,
}
interface HLinePos extends Pozition{
}
interface Player {
  name: string,
  path: Path,
  goal?: string | number,
  startVLineIdx: number,
}
type Path = Pozition[];
interface Pozition {
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

  const PRODUCTION = false;
  const NO_INDICATOR = -1;
  const DEFAULT_VLINES = 6;
  const DEFAULT_HLINES = 10;
  const VLINE_HEIGHT = 200
  const VLINE_MARGIN_HEIGHT_RATIO = .1
  const VLINE_MARGIN_HEIGHT = VLINE_HEIGHT * VLINE_MARGIN_HEIGHT_RATIO
  const VLINE_CONTENT_HEIGHT = VLINE_HEIGHT - VLINE_MARGIN_HEIGHT
  const VLINE_CONTENT_MIN_POS = VLINE_MARGIN_HEIGHT / 2
  const VLINE_CONTENT_MAX_POS = VLINE_HEIGHT - VLINE_CONTENT_MIN_POS
  const LINE_SPAN = 40;
  const AMIDA_CONTAINER_MARGIN_RATIO = .2;
  const COLORS = [
    'RED',
    'MAROON',
    'YELLOW',
    'OLIVE',
    'LIME',
    'GREEN',
    'AQUA',
    'TEAL',
    'BLUE',
    'NAVY',
    'FUCHSIA',
    'PURPLE',
    'SILVER',
  ];
  const CHAR_A = 65;

  initializeLogger(PRODUCTION);

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
      addRoute(vLines, newHLine, hLines);
    }
    return hLines;
  })();
  const players = ((p: Player[]) => {
    for(let i=0; i<vLines.length; i++) p.push({ name: ''+i, path: [], startVLineIdx: i });
    return p;
  })([]);
  const goals = ((g: string[]) => {
    for(let i=CHAR_A; i<vLines.length; i++) g.push(String.fromCharCode(i));
    return g;
  })([]);
  const menuItems = [
    'Start',
    'Add a virtical line',
    'Add a horizontal line',
    'Clear',
  ];
  let svg = `
  <svg id="amida-svg" height="${VLINE_HEIGHT*(1+AMIDA_CONTAINER_MARGIN_RATIO)}" width="${LINE_SPAN*DEFAULT_VLINES*(1+AMIDA_CONTAINER_MARGIN_RATIO)}" xmlns="http://www.w3.org/2000/svg" >
    <g style="stroke:rgb(0,0,0);stroke-width:2" >`
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
  svg += players.reduce((result, next, idx) => {
    return `${result}
      <g id="players${idx}-path-container">
        <path id="players${idx}-path" fill="transparent"/>
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
    ${menuItems.reduce((result, next) => `${result}
    <div class="amida-menu-item" >
      <span class="amida-menu-item-text">${next}</span>
    </div>`, '')}
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
      players,
      goals,
    }
    global.amida = amida;
    global.log(JSON.parse(JSON.stringify(amida)));

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
    const startLineElm = menuElm.children[0]
    startLineElm.addEventListener('mousedown', () => { // TODO click event
      amida.players = calcPath(amida);
      (async function afn() {
        for (let i=0; i<amida.players.length; i++) {
          await renderPathGradually(amida.players[i].path, i);
        }
      })();
    });
    function calcPath({ players, vLines } : Amida) {
      return players.map((p, idx) => {
        p.path.push({ x: vLines[p.startVLineIdx].position.x, y: 0 });
        const finIdx = (function setMidwayPathAndGetFinIdx(routeKey: string | null, i: number): number {
          if (!routeKey) return i;
          const hl = hLines[routeKey];
          const vl = vLines[i];
          p.path.push({ x: vl.position.x, y: hl.position.y });
          const route = vl.routes[routeKey];
          const nextVl = vLines[i+route.lr];
          p.path.push({ x: nextVl.position.x, y: hl.position.y });
          return setMidwayPathAndGetFinIdx(nextVl.routes[routeKey].nextKey, i+route.lr);
        })(vLines[p.startVLineIdx].startRoute, idx);
        p.path.push({ x: vLines[finIdx].position.x, y: VLINE_HEIGHT });
        return p;
      });
    }
    async function renderPathGradually(path: Path, idx: number) {
      let command = `M ${path[0].x} ${path[0].y}`;
      let cnt = 1;
      const pathElm = document.getElementById(`players${idx}-path`) as Element;
      pathElm.setAttribute('stroke', COLORS[idx%COLORS.length]);
      pathElm.setAttribute('stroke-width', '3');
      const promise = new Promise(resolve => {
        const intervalId = global.setInterval(function() {
          if (cnt >= path.length) {
            global.clearInterval(intervalId);
            resolve();
            return;
          }
          command = `${command} L ${path[cnt].x} ${path[cnt].y}`;
          cnt++
          pathElm.setAttribute('d', command);
        }, 100);
      });
      return promise;
    }
    const addVLineElm = menuElm.children[1]
    addVLineElm.addEventListener('mousedown', () => { // TODO click event
      const prevLastVLineIdx = amida.vLines.length-1;
      const prevLastVLine = amida.vLines[prevLastVLineIdx];
      const newVLine = new VLine({ position: { x: prevLastVLine.position.x + LINE_SPAN }, LINE_SPAN });
      amida.vLines.push(newVLine);
      const prevLastPlayersIdx = amida.players.length-1;
      amida.players.push({ name: ''+amida.players.length, path: [], startVLineIdx: amida.players.length });
      amida.goals.push(String.fromCharCode(CHAR_A+goals.length) as never); //TODO why should I cast it to never?
      const lastVLineElm = document.getElementById('vline'+prevLastVLineIdx) as unknown as SVGElement;
      const cloneV = lastVLineElm.cloneNode(true) as SVGGElement;
      cloneV.id = 'vline' + (amida.vLines.length-1);
      cloneV.setAttribute('transform', `translate(${newVLine.position.x}, 0)`);
      (lastVLineElm.parentNode as Node).insertBefore(cloneV, lastVLineElm.nextSibling);
      svgElm.setAttribute('width', '' + LINE_SPAN*amida.vLines.length*(1+AMIDA_CONTAINER_MARGIN_RATIO));
      const lastPathContainerElm = document.getElementById(`players${prevLastPlayersIdx}-path-container`) as Element;
      const cloneP = lastPathContainerElm.cloneNode(true) as SVGGElement;
      cloneP.id = `players${amida.players.length-1}-path-container`;
      cloneP.children[0].id = `players${amida.players.length-1}-path`;
      (lastPathContainerElm.parentNode as Node).insertBefore(cloneP, lastPathContainerElm.nextSibling);
    })
    const addHLineElm = menuElm.children[2] as HTMLElement // cast is needed, otherwise mdEvt is not recognized as MouseEvent
    addHLineElm.addEventListener('mousedown', mdEvt => { // TODO click event
      global.log('x:', mdEvt.pageX - amida.pageX)
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
      addRoute(amida.vLines, newHLine, amida.hLines);
      global.log(JSON.parse(JSON.stringify(amida)));
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
    hLineElm.addEventListener('mousedown', dragStart);
    function dragStart(mdEvt: MouseEvent) {
      if (mdEvt.button !== 0) return;
      pntrX = +mdEvt.clientX;
      pntrY = +mdEvt.clientY;
      const key = ((mdEvt.target as Element).parentElement as Element).id;
      const hLine = amida.hLines[key];
      amida.activeVlineIdx = hLine.ownerIdx
      removeRoute(amida.vLines, hLine);
      global.log(JSON.parse(JSON.stringify(amida)));
      let vLine = amida.vLines[hLine.ownerIdx];
      const indicator = document.getElementById('indicator') as Element;
      indicator.setAttribute('class', 'active');
      indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`);
      document.addEventListener('mousemove', dragging);
      function dragging(mmEvt) {
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
      document.addEventListener('mouseup', dragEnd)
      function dragEnd() {
        document.removeEventListener('mousemove', dragging)
        document.removeEventListener('mouseup', dragEnd)
        if (amida.activeVlineIdx === NO_INDICATOR) {
          delete amida.hLines[key];
          (hLineElm.parentNode as Node).removeChild(hLineElm);
        } else {
          hLine.position.y = hLine.position.adjustedY;
          addRoute(amida.vLines, hLine, amida.hLines); // old route is already removed at mousedown, so just add it
          hLineElm.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
          indicator.setAttribute('class', 'inactive')
        }
        global.log(JSON.parse(JSON.stringify(amida)));
      }
    }
  }
  function addRoute(vls: VLine[], newHLine: HLine, hLines: HLineArray) {
    recursive(vls[newHLine.ownerIdx].startRoute, vls[newHLine.ownerIdx], 1, newHLine, hLines);
    recursive(vls[newHLine.ownerIdx+1].startRoute, vls[newHLine.ownerIdx+1], -1, newHLine, hLines);
    function recursive(currentKey: string | null, vl: VLine, lr: VLineRouteLR, newHLine: HLine, hLines: HLineArray) {
      if (!currentKey) { // initialize
        /**
         * Before:
         *  [Start] -> [End]
         * After:
         *  [Start] -> |newKey| -> [End]
         */
        vl.startRoute = newHLine.key;
        vl.routes[newHLine.key] = { nextKey: null, prevKey: null, lr }
        return;
      }
      const currentRoute = vl.routes[currentKey];
      // @ts-ignore vl.startRoute shouldn't be undefined, because initialize block would be executed beforehand
      const startHLine = hLines[vl.startRoute]
      if (newHLine.position.y < startHLine.position.y) { // addToFirst
        /**
         * Before:
         *  [Start] -> |currentKey|
         * After:
         *  [Start] -> |newKey| -> |currentKey|
         */
        global.log('first.vl', JSON.parse(JSON.stringify(vl)));
        global.log('first.newHLine.key', newHLine.key);
        global.log('first.prevKey', null);
        vl.startRoute = newHLine.key;
        vl.routes[currentKey].prevKey = newHLine.key;
        vl.routes[newHLine.key] = { nextKey: currentKey, prevKey: null, lr };
        return;
      } else if (!currentRoute.nextKey) { // addToLast
        /**
         * Before:
         *  |currentKey| -> [End]
         * After:
         *  |currentKey| -> |newKey| -> [End]
         */
        global.log('last.vl', JSON.parse(JSON.stringify(vl)));
        global.log('last.newHLine.key', newHLine.key);
        global.log('last.currentKey', currentKey);
        vl.routes[newHLine.key] = { nextKey: null, prevKey: currentKey, lr };
        currentRoute.nextKey = newHLine.key;
        return;
      } else if ( newHLine.position.y <= hLines[currentRoute.nextKey].position.y) { // addToMiddle
        /**
         * Before:
         *  |currentKey| -> |nextKey|
         * After:
         *  |currentKey| -> |newKey| -> |nextKey|
         */
        global.log('middle.vl', JSON.parse(JSON.stringify(vl)));
        global.log('middle.newHLine.key', newHLine.key);
        global.log('middle.currentKey', currentKey);
        vl.routes[currentRoute.nextKey].prevKey = newHLine.key;
        vl.routes[newHLine.key] = { nextKey: currentRoute.nextKey, prevKey: currentKey, lr };
        currentRoute.nextKey = newHLine.key;
        return;
      }
      recursive(currentRoute.nextKey, vl, lr, newHLine, hLines);
    }
  }
  function removeRoute(vls: VLine[], hl: HLine) {
    fn(hl.ownerIdx);
    fn(hl.ownerIdx+1);
    function fn(idx) {
      const routes = vls[idx].routes;
      const route = routes[hl.key];
      if (route.prevKey) routes[route.prevKey].nextKey = route.nextKey;
      else vls[idx].startRoute = route.nextKey;
      if (route.nextKey) routes[route.nextKey].prevKey = route.prevKey;
      delete routes[hl.key];
    }
  }
  function initializeLogger(isProduction) {
    if (isProduction) global.log = () => {};
    else global.log = console.log;
  }
})(Function('return this')())

