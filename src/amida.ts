interface Global extends Window{
  amida: Amida,
  log: (...any) => void,
}
interface Amida {
  vLines: VLine[],
  hLines: HLineArray,
  innerHTML: string, // TODO getter
  activeVlineIdx: number,
  players: Player[],
  goals: Goal[],
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
  goalIdx?: string | number,
}
type Path = Pozition[];
interface Pozition {
  x: number,
  y: number,
}
interface Goal {
  label: string,
  order?: number,
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

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
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
  const PLAYER_HEIGHT = 30;
  const GOAL_HEIGHT = 30;
  const MARGIN_Y = 10;
  const COLORS = [
    'RED',
    'TEAL',
    'OLIVE',
    'LIME',
    'ORANGE',
    'FUCHSIA',
    'MAROON',
    'AQUA',
    'BLUE',
    'PINK',
    'GREEN',
    'NAVY',
    'PURPLE',
    'GRAY',
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
  const players = vLines.map((v, i) => {
    return { name: ''+(i+1), path: [] };
  });
  const goals = vLines.map((v, i) => {
    return { label: String.fromCharCode(CHAR_A+i) };
  });
  const menuItems = [
    'Start',
    'Add a virtical line',
    'Add a horizontal line',
    'Clear',
  ];
  let svg = `
  <svg id="amida-svg" width="${LINE_SPAN*DEFAULT_VLINES}" height="${VLINE_HEIGHT+PLAYER_HEIGHT+GOAL_HEIGHT+MARGIN_Y}" xmlns="${SVG_NAMESPACE}" >
    <g style="stroke:rgb(0,0,0);stroke-width:2" transform="translate(${LINE_SPAN/2}, ${MARGIN_Y/2})" >`
    svg += `
      <g id="amida-player-container" >`
      svg += players.reduce((result, next, idx) => {
        return `${result}
        <svg id="player${idx}" x="${vLines[idx].position.x - LINE_SPAN/2}" y="0" width="${LINE_SPAN}" height="${PLAYER_HEIGHT}" >
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" >${next.name}</text>
        </svg>`
      }, '')
    svg += `
      </g>`
    svg += `
      <g id="amida-main-container" transform="translate(0, ${PLAYER_HEIGHT})" >
        <rect id="amida-bg-rect" x="-${LINE_SPAN/2}" width="${LINE_SPAN*DEFAULT_VLINES}" height="${VLINE_HEIGHT}" stroke="none" fill="transparent" />` // In order for player's texts not to be selected while HLine being dragged
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
      svg += players.reduce((result, next, idx) => { // path
        return `${result}
        <g id="player${idx}-path-container">
          <path id="player${idx}-path" fill="transparent"/>
        </g>`
      }, '')
      svg += `
        <g id="amida-indicator" class="inactive" >
          <circle r="4" fill="blue" stroke="none" />
        </g>`
    svg += `
      </g>`
    svg += `
      <g id="amida-goal-container" transform="translate(0, ${PLAYER_HEIGHT})" >`  // TODO why don't we have to add VLINE_HEIGHT?
      svg += goals.reduce((result, next, idx) => {
        return `${result}
        <svg id="goal${idx}" x="${vLines[idx].position.x - LINE_SPAN/2}" y="${VLINE_HEIGHT}" width="${LINE_SPAN}" height="${PLAYER_HEIGHT}" >
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" >${next.label}</text>
        </svg>`
      }, '')
    svg += `
      </g>`
  svg += `
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
    const startElm = menuElm.children[0]
    startElm.addEventListener('mousedown', () => {
      if (amida.players[0].path.length > 0) return; // Already rendered result
      amida.players = calcPath(amida);
      (async function afn() {
        for (let i=0; i<amida.players.length; i++) {
          const playerElm = document.getElementById(`player${i}`) as Element;
          playerElm.setAttribute('stroke', COLORS[i%COLORS.length]);
          await renderPathGradually(amida.players[i].path, i);
          const goalElm = document.getElementById(`goal${(amida.players[i].goalIdx as number)}`) as Element;
          goalElm.setAttribute('stroke', COLORS[i%COLORS.length]);
        }
      })();
      global.log(amida);
    });
    function calcPath({ players, vLines } : Amida) {
      return players.map((p, idx) => {
        p.path.push({ x: vLines[idx].position.x, y: 0 });
        const finIdx = (function setMidwayPathAndGetFinIdx(routeKey: string | null, i: number): number {
          if (!routeKey) return i;
          const hl = hLines[routeKey];
          const vl = vLines[i];
          p.path.push({ x: vl.position.x, y: hl.position.y });
          const route = vl.routes[routeKey];
          const nextVl = vLines[i+route.lr];
          p.path.push({ x: nextVl.position.x, y: hl.position.y });
          return setMidwayPathAndGetFinIdx(nextVl.routes[routeKey].nextKey, i+route.lr);
        })(vLines[idx].startRoute, idx);
        p.path.push({ x: vLines[finIdx].position.x, y: VLINE_HEIGHT });
        p.goalIdx = finIdx;
        return p;
      });
    }
    async function renderPathGradually(path: Path, idx: number) {
      let command = `M ${path[0].x} ${path[0].y}`;
      let cnt = 1;
      const pathElm = document.getElementById(`player${idx}-path`) as Element;
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
    addVLineElm.addEventListener('mousedown', () => {
      const prevLastVLineIdx = amida.vLines.length-1;
      const prevLastVLine = amida.vLines[prevLastVLineIdx];
      const newVLine = new VLine({ position: { x: prevLastVLine.position.x + LINE_SPAN }, LINE_SPAN });
      amida.vLines.push(newVLine);
      const prevLastPlayerIdx = amida.players.length-1;
      amida.players.push({ name: ''+(amida.players.length+1), path: [] });
      const prevLastGoalIdx = amida.goals.length-1;
      amida.goals.push({ label: String.fromCharCode(CHAR_A+amida.goals.length) });
      const lastVLineElm = document.getElementById('vline'+prevLastVLineIdx) as unknown as SVGElement;
      const vLineClone = lastVLineElm.cloneNode(true) as SVGGElement;
      vLineClone.id = 'vline' + (amida.vLines.length-1);
      vLineClone.setAttribute('transform', `translate(${newVLine.position.x}, 0)`);
      (lastVLineElm.parentNode as Node).insertBefore(vLineClone, lastVLineElm.nextSibling);
      const lastPlayerElm = document.getElementById(`player${prevLastPlayerIdx}`) as Element;
      const playerClone = lastPlayerElm.cloneNode(true) as SVGGElement;
      const playerTxtElm = playerClone.querySelector('text') as SVGTextElement;
      playerTxtElm.textContent = amida.players[amida.players.length-1].name;
      playerClone.id = `player${amida.players.length-1}`;
      playerClone.setAttribute('x', ''+(newVLine.position.x-LINE_SPAN/2));
      playerClone.removeAttribute('stroke');
      (lastPlayerElm.parentNode as Node).insertBefore(playerClone, lastPlayerElm.nextSibling);
      const lastGoalElm = document.getElementById(`goal${prevLastGoalIdx}`) as Element;
      const goalClone = lastGoalElm.cloneNode(true) as SVGGElement;
      const goalTxtElm = goalClone.querySelector('text') as SVGTextElement;
      goalTxtElm.textContent = amida.goals[amida.goals.length-1].label;
      goalClone.id = `goal${amida.goals.length-1}`;
      goalClone.setAttribute('x', ''+(newVLine.position.x-LINE_SPAN/2));
      goalClone.removeAttribute('stroke');
      (lastGoalElm.parentNode as Node).insertBefore(goalClone, lastGoalElm.nextSibling);
      const lastPathContainerElm = document.getElementById(`player${prevLastPlayerIdx}-path-container`) as Element;
      const pathClone = lastPathContainerElm.cloneNode(true) as SVGGElement;
      pathClone.id = `player${amida.players.length-1}-path-container`;
      pathClone.children[0].id = `player${amida.players.length-1}-path`;
      (lastPathContainerElm.parentNode as Node).insertBefore(pathClone, lastPathContainerElm.nextSibling);
      const amidaRectElm = document.getElementById('amida-bg-rect') as Element;
      amidaRectElm.setAttribute('width', '' + (LINE_SPAN*amida.vLines.length));
      svgElm.setAttribute('width', '' + (LINE_SPAN*amida.vLines.length));
    })
    const addHLineElm = menuElm.children[2] as HTMLElement;
    addHLineElm.addEventListener('mousedown', () => {
      const ownerIdx = (() => {
        const i = (amida.vLines.findIndex(v => {
          return (menuElm.getBoundingClientRect().left - (document.getElementById('vline0') as Element).getBoundingClientRect().left) < v.position.x
        }))
        const isLeftEnd = i === 0;
        const isRightEnd = i === -1;
        return isLeftEnd ? 0 : (isRightEnd ? amida.vLines.length - 2 : i - 1);
      })()
      const y = menuElm.getBoundingClientRect().top - (document.getElementById('amida-main-container') as Element).getBoundingClientRect().top;
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
    const clearElm = menuElm.children[3] as HTMLElement
    clearElm.addEventListener('mousedown', () => {
      amida.players = amida.players.map(p => ({
        ...p,
        path: [],
      }));
      amida.players.forEach((p,i) => {
        const pathElm = document.getElementById(`player${i}-path`) as Element;
        pathElm.removeAttribute('stroke');
        pathElm.removeAttribute('stroke-width');
        pathElm.removeAttribute('d');
        const playerElm = document.getElementById(`player${i}`) as Element;
        playerElm.removeAttribute('stroke');
        const goalElm = document.getElementById(`goal${i}`) as Element;
        goalElm.removeAttribute('stroke');
      });
    })

    document.querySelectorAll('[id^="hline"]').forEach(function(n) {
      draggablify(n as Element, amida)
    })
  })

  function draggablify(hLineElm: Element, amida: Amida) {
    hLineElm.addEventListener('mousedown', dragStart);
    hLineElm.addEventListener('touchstart', dragStart, {passive: true});
    function dragStart(strtEvt: MouseEvent | TouchEvent) {
      if (strtEvt instanceof MouseEvent && strtEvt.button !== 0) return;
      const initialPointX = (strtEvt instanceof MouseEvent ? strtEvt.clientX : strtEvt.touches[0].clientX);
      const initialPointY = (strtEvt instanceof MouseEvent ? strtEvt.clientY : strtEvt.touches[0].clientY);
      const key = (strtEvt.currentTarget as Element).id;
      const hLine = amida.hLines[key];
      const initialPosition = hLine.position;
      amida.activeVlineIdx = hLine.ownerIdx
      removeRoute(amida.vLines, hLine);
      global.log(JSON.parse(JSON.stringify(amida)));
      let vLine = amida.vLines[hLine.ownerIdx];
      const indicator = document.getElementById('amida-indicator') as Element;
      indicator.setAttribute('class', 'active');
      indicator.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`);
      document.addEventListener('mousemove', dragging);
      document.addEventListener('touchmove', dragging, {passive: false});
      function dragging(mvEvt: MouseEvent | TouchEvent) {
        mvEvt.preventDefault();
        const diffX = (mvEvt instanceof MouseEvent ? mvEvt.clientX : mvEvt.touches[0].clientX) - initialPointX;
        const diffY = (mvEvt instanceof MouseEvent ? mvEvt.clientY : mvEvt.touches[0].clientY) - initialPointY;
        hLine.position = new HLinePos({
          x: initialPosition.x + diffX,
          y: initialPosition.y + diffY,
          VLINE_CONTENT_MIN_POS,
          VLINE_CONTENT_MAX_POS,
        })
        const offsetFromAmidaLeft = hLineElm.getBoundingClientRect().left - (document.getElementById('vline0') as Element).getBoundingClientRect().left;
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
      document.addEventListener('touchend', dragEnd)
      function dragEnd() {
        document.removeEventListener('mousemove', dragging)
        document.removeEventListener('touchmove', dragging)
        document.removeEventListener('mouseup', dragEnd)
        document.removeEventListener('touchend', dragEnd)
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

