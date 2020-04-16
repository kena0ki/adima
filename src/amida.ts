import { global, logger } from './util.js';

interface AmidaData {
  vLines: VLine[],
  hLines: HLines,
  innerHTML: string, // TODO getter
  activeVlineIdx: number,
  players: Player[],
  goals: Goal[],
}
interface HLines {
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

class Amida {

  constructor(targetElm: Element) {
    this.targetElm = targetElm;
    this.menuItems = {
      'Start': this.startAmida,
      'Add a virtical line': this.addVLine,
      'Add a horizontal line': this.addHLine,
      'Clear': this.clearPath,
      'Shuffle goals': this.shuffleGoals,
      'Show result': this.showResult,
    };
  }
  public data: AmidaData;
  public vLinesNum = 6;
  public hLinesNum = 10;
  public vLineHeight = 200;
  public LINE_SPAN = 40;
  public HEADER_HEIGHT = 30;
  public FOOTER_HEIGHT = 30;
  public menuItems: { [label: string]: EventListener };
  public colors = [
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
  private targetElm: Element;
  private readonly SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  private readonly NO_INDICATOR = -1;
  private readonly VLINE_MARGIN_HEIGHT_RATIO = .1;
  private readonly MARGIN_Y = 10;
  private readonly CHAR_A = 65;
  private get vLineMarginHeight() {
    return this.vLineHeight * this.VLINE_MARGIN_HEIGHT_RATIO;
  }
  private get vLineContentHeight() {
    return this.vLineHeight - this.vLineMarginHeight;
  }
  private get vLineContentMinPos() {
    return this.vLineMarginHeight / 2;
  }
  private get vLineContentMaxPos() {
    return this.vLineHeight - this.vLineContentMinPos;
  }
  public readonly init = () => {
    const vLines: VLine[] = (() => {
      const vLines: VLine[] = [];
      for(let i=0; i<this.vLinesNum; i++) {
        const posX = i*this.LINE_SPAN
        vLines.push(new VLine({ position: { x: posX }, LINE_SPAN: this.LINE_SPAN }));
      }
      return vLines;
    })();
    const hLines: HLines = (() => {
      const hLines: HLines = {}
      const timestamp = Date.now()
      for(let i=0, j=0; i<this.hLinesNum; i++, j++) {
        if (j >= this.vLinesNum - 1) j = 0;
        const key = 'amida-hline' + timestamp + i
        const y = Math.floor(Math.random() * this.vLineContentHeight) + (this.vLineContentMinPos);
        const newHLine = {
          key,
          position: new HLinePos({ x: vLines[j].position.x, y, VLINE_CONTENT_MAX_POS: this.vLineContentMaxPos, VLINE_CONTENT_MIN_POS: this.vLineContentMinPos }),
          ownerIdx: j,
        }
        hLines[key] = newHLine;
        this.addRoute(vLines, newHLine, hLines);
      }
      return hLines;
    })();
    const players = vLines.map((v, i) => {
      return { name: ''+(i+1), path: [] };
    });
    const goals = vLines.map((v, i) => {
      return { label: String.fromCharCode(this.CHAR_A+i) };
    });
    let svg = `
    <svg id="amida-svg" width="${this.LINE_SPAN*this.vLinesNum}" height="${this.vLineHeight+this.HEADER_HEIGHT+this.FOOTER_HEIGHT+this.MARGIN_Y}" xmlns="${this.SVG_NAMESPACE}" >
      <style>
        .amida-hline {
          cursor: grab;
        }
        .amida-menu-container {
          box-shadow: 1px 1px 15px rgba(0,0,0,.2);
          border: solid 1px rgba(0,0,0,.2);
          display: inline-block;
          background: white;
          position: absolute;
        }
        .amida-menu-item {
          padding: .2em .4em;
        }
        .amida-menu-item:hover {
          background-color: rgba(0,0,0,.1);
          cursor: pointer;
        }
        .amida-goal {
          transition: transform 1000ms 100ms;
        }
      </style>
      <g style="stroke:rgb(0,0,0);stroke-width:2" transform="translate(${this.LINE_SPAN/2}, ${this.MARGIN_Y/2})" >`
      svg += `
        <g id="amida-player-container" >`
        svg += players.reduce((result, next, idx) => {
          return `${result}
          <svg id="amida-player${idx}" x="${vLines[idx].position.x - this.LINE_SPAN/2}" y="0" width="${this.LINE_SPAN}" height="${this.HEADER_HEIGHT}" >
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" >${next.name}</text>
          </svg>`
        }, '')
      svg += `
        </g>`
      svg += `
        <g id="amida-main-container" transform="translate(0, ${this.HEADER_HEIGHT})" >
          <rect id="amida-bg-rect" x="-${this.LINE_SPAN/2}" width="${this.LINE_SPAN*this.vLinesNum}" height="${this.vLineHeight}" stroke="none" fill="transparent" />` // In order for player's texts not to be selected while HLine being dragged
        svg += vLines.reduce((result, next, idx) => {
          return `${result}
          <g id="amida-vline${idx}" transform="translate(${next.position.x},0)" >
            <line x1="0" y1="0" x2="0" y2="${this.vLineHeight}" />
          </g>`
        }, '')
        svg += Object.keys(hLines).reduce((result, next) => {
          const h = hLines[next]
          return `${result}
          <g id="${h.key}" class="amida-hline" transform="translate(${h.position.x},${h.position.y})" >
            <line x1="0" y1="0" x2="${this.LINE_SPAN}" y2="0" />
          </g>`
        }, '')
        svg += players.reduce((result, next, idx) => { // path
          return `${result}
          <g id="amida-player${idx}-path-container">
            <path id="amida-player${idx}-path" fill="transparent"/>
          </g>`
        }, '')
        svg += `
          <g id="amida-indicator" style="display: none" >
            <circle r="4" fill="blue" stroke="none" />
          </g>`
      svg += `
        </g>`
      svg += `
        <g id="amida-goal-container" transform="translate(0, ${this.HEADER_HEIGHT})" >`  // TODO why don't we have to add this.vLineHeight?
        svg += goals.reduce((result, next, idx) => {
          return `${result}
          <g id="amida-goal${idx}" class="amida-goal" style="transform:translate(${vLines[idx].position.x-this.LINE_SPAN/2}px,${this.vLineHeight}px)" >
            <svg width="${this.LINE_SPAN}" height="${this.HEADER_HEIGHT}" >
              <svg width="100%" height="100%" >
                <text class="amida-goal-text" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" >${next.label}</text>
              </svg>
              <svg class="amida-goal-blind" style="display:none" width="100%" height="100%" >
                <rect width="100%" height="100%" fill="grey" ></rect>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" >?</text>
              </svg>
            </svg>
          </g>`
        }, '')
      svg += `
        </g>`
    svg += `
      </g>
      Sorry, your browser does not support inline SVG.
    </svg>`
    const menu = `
    <div id="amida-menu" class="amida-menu-container" style="display: none">
      ${Object.keys(this.menuItems).reduce((result, next) => `${result}
      <div class="amida-menu-item" >
        <span class="amida-menu-item-text">${next}</span>
      </div>`, '')}
    </div>`

    this.targetElm.innerHTML = svg + menu;
    this.data = {
      vLines,
      hLines,
      innerHTML: this.targetElm.innerHTML,
      activeVlineIdx: this.NO_INDICATOR,
      players,
      goals,
    };
    logger.log(JSON.parse(JSON.stringify(this.data)));

    const svgElm = document.getElementById('amida-svg') as unknown as SVGElement // https://github.com/microsoft/TypeScript/issues/32822
    const menuElm = document.getElementById('amida-menu') as HTMLElement
    svgElm.addEventListener('contextmenu', cEvt => {
      cEvt.preventDefault();
      menuElm.style.left = cEvt.pageX + 'px';
      menuElm.style.top = cEvt.pageY + 'px';
      menuElm.style.display = '';
      const clearCtxMenu = () => {
        menuElm.style.display = 'none';
        document.removeEventListener('mousedown', clearCtxMenu);
      };
      document.addEventListener('mousedown', clearCtxMenu);
    });
    Object.values(this.menuItems).forEach((func, idx) => {
      menuElm.children[idx].addEventListener('mousedown', func);
    });

    document.querySelectorAll('[id^="amida-hline"]').forEach((n) => {
      this.draggablify(n as Element);
    })
  };
  public readonly addVLine = () => {
    const prevLastVLineIdx = this.data.vLines.length-1;
    const prevLastVLine = this.data.vLines[prevLastVLineIdx];
    const newVLine = new VLine({ position: { x: prevLastVLine.position.x + this.LINE_SPAN }, LINE_SPAN: this.LINE_SPAN });
    this.data.vLines.push(newVLine);
    const prevLastPlayerIdx = this.data.players.length-1;
    this.data.players.push({ name: ''+(this.data.players.length+1), path: [] });
    const prevLastGoalIdx = this.data.goals.length-1;
    this.data.goals.push({ label: String.fromCharCode(this.CHAR_A+this.data.goals.length) });
    const lastVLineElm = document.getElementById('amida-vline'+prevLastVLineIdx) as unknown as SVGElement;
    const vLineClone = lastVLineElm.cloneNode(true) as SVGGElement;
    vLineClone.id = 'amida-vline' + (this.data.vLines.length-1);
    vLineClone.setAttribute('transform', `translate(${newVLine.position.x}, 0)`);
    (lastVLineElm.parentNode as Node).insertBefore(vLineClone, lastVLineElm.nextSibling);
    const lastPlayerElm = document.getElementById(`amida-player${prevLastPlayerIdx}`) as Element;
    const playerClone = lastPlayerElm.cloneNode(true) as SVGGElement;
    const playerTxtElm = playerClone.querySelector('text') as SVGTextElement;
    playerTxtElm.textContent = this.data.players[this.data.players.length-1].name;
    playerClone.id = `amida-player${this.data.players.length-1}`;
    playerClone.setAttribute('x', ''+(newVLine.position.x-this.LINE_SPAN/2));
    playerClone.removeAttribute('stroke');
    (lastPlayerElm.parentNode as Node).insertBefore(playerClone, lastPlayerElm.nextSibling);
    const lastGoalElm = document.getElementById(`amida-goal${prevLastGoalIdx}`) as Element;
    const goalClone = lastGoalElm.cloneNode(true) as SVGGElement;
    const goalTxtElm = goalClone.querySelector('text') as SVGTextElement;
    goalTxtElm.textContent = this.data.goals[this.data.goals.length-1].label;
    goalClone.id = `amida-goal${this.data.goals.length-1}`;
    goalClone.setAttribute('x', ''+(newVLine.position.x-this.LINE_SPAN/2));
    goalClone.removeAttribute('stroke');
    (lastGoalElm.parentNode as Node).insertBefore(goalClone, lastGoalElm.nextSibling);
    const lastPathContainerElm = document.getElementById(`amida-player${prevLastPlayerIdx}-path-container`) as Element;
    const pathClone = lastPathContainerElm.cloneNode(true) as SVGGElement;
    pathClone.id = `amida-player${this.data.players.length-1}-path-container`;
    pathClone.children[0].id = `amida-player${this.data.players.length-1}-path`;
    (lastPathContainerElm.parentNode as Node).insertBefore(pathClone, lastPathContainerElm.nextSibling);
    const amidaRectElm = document.getElementById('amida-bg-rect') as Element;
    amidaRectElm.setAttribute('width', '' + (this.LINE_SPAN*this.data.vLines.length));
    const svgElm = document.getElementById('amida-svg') as unknown as SVGElement; // https://github.com/microsoft/TypeScript/issues/32822
    svgElm.setAttribute('width', '' + (this.LINE_SPAN*this.data.vLines.length));
  };
  public readonly addHLine = () => {
    const menuElm = document.getElementById('amida-menu') as HTMLElement;
    const ownerIdx = (() => {
      const i = (this.data.vLines.findIndex(v => {
        return (menuElm.getBoundingClientRect().left - (document.getElementById('amida-vline0') as Element).getBoundingClientRect().left) < v.position.x;
      }))
      const isLeftEnd = i === 0;
      const isRightEnd = i === -1;
      return isLeftEnd ? 0 : (isRightEnd ? this.data.vLines.length - 2 : i - 1);
    })()
    const y = menuElm.getBoundingClientRect().top - (document.getElementById('amida-main-container') as Element).getBoundingClientRect().top;
    const key = `hline${Date.now()}1`;
    const newHLine: HLine = {
      key,
      position: new HLinePos({ x: this.data.vLines[ownerIdx].position.x, y, VLINE_CONTENT_MIN_POS: this.vLineContentMinPos, VLINE_CONTENT_MAX_POS: this.vLineContentMaxPos }),
      ownerIdx,
    };
    newHLine.position.y = newHLine.position.adjustedY; // New horizontal line should be placed at valid position, so let's immediately overwrite it
    this.data.hLines[key] = newHLine;
    this.addRoute(this.data.vLines, newHLine, this.data.hLines);
    logger.log(JSON.parse(JSON.stringify(this.data)));
    const hLineElm = document.querySelector('[id^=amida-hline]') as Node;
    const clone = hLineElm.cloneNode(true) as Element;
    clone.id = key;
    clone.setAttribute('transform', `translate(${newHLine.position.x}, ${newHLine.position.y})`);
    (hLineElm.parentNode as Node).insertBefore(clone, hLineElm.nextSibling);
    this.draggablify(clone);
  };
  public readonly startAmida = () => {
    if (this.data.players[0].path.length > 0) return; // Already rendered result
    this.data.players = this.calcPath(this.data);
    (async () => {
      for (let i=0; i<this.data.players.length; i++) {
        const playerElm = document.getElementById(`amida-player${i}`) as Element;
        playerElm.setAttribute('stroke', this.colors[i%this.colors.length]);
        await this.renderPathGradually(this.data.players[i].path, i);
        const goalElm = document.getElementById(`amida-goal${(this.data.players[i].goalIdx as number)}`) as Element;
        goalElm.setAttribute('stroke', this.colors[i%this.colors.length]);
      }
    })();
    logger.log(this.data);
  };
  public readonly clearPath = () => {
    this.data.players = this.data.players.map(p => ({
      ...p,
      path: [],
    }));
    this.data.players.forEach((p,i) => {
      const pathElm = document.getElementById(`amida-player${i}-path`) as Element;
      pathElm.removeAttribute('stroke');
      pathElm.removeAttribute('stroke-width');
      pathElm.removeAttribute('d');
      const playerElm = document.getElementById(`amida-player${i}`) as Element;
      playerElm.removeAttribute('stroke');
      const goalElm = document.getElementById(`amida-goal${i}`) as Element;
      goalElm.removeAttribute('stroke');
    });
  };
  public readonly shuffleGoals = () => {
    const PARSE_TRANSLATE = /translate\(\s*(-?\d+\D*)\s*,\s*(-?\d+\D*)\s*\)/;
    const SHUFFLE_DURATION = 1000;
    const SHUFFLE_DURATION_MIN = 100;
    const TIMES_OF_SHUFFLE = 25;
    const self = this;
    const goalBlindElms = document.querySelectorAll('.amida-goal-blind') as NodeListOf<SVGElement>;
    goalBlindElms.forEach(function(e) {
      e.style.display = '';
    });
    const goalElms = document.querySelectorAll('.amida-goal') as NodeListOf<SVGElement>;
    const originalTransforms = (function() {
      const arr : string[] = [];
      goalElms.forEach(function(e,i) {
        arr[i] = e.style.transform;
      });
      return arr;
    })();
    goalElms.forEach(function(e) {
      e.style.transitionDuration = SHUFFLE_DURATION+'ms';
    });
    let i=0;
    let duration = SHUFFLE_DURATION;
    let justBefore = Date.now();
    fn();
    function fn() {
      const pickedIndex1 = Math.floor(Math.random() * self.data.vLines.length);
      const pickedIndex2 = (function() {
        const pickedIndex = Math.floor(Math.random() * (self.data.vLines.length-1));
        return pickedIndex < pickedIndex1 ? pickedIndex : pickedIndex + 1;
      })();
      const goalElm1 = goalElms[pickedIndex1];
      const goalElm2 = goalElms[pickedIndex2];
      const [,x1,y1] = goalElm1.style.transform.match(PARSE_TRANSLATE) as string[];
      const [,x2,y2] = goalElm2.style.transform.match(PARSE_TRANSLATE) as string[];
      goalElm1.style.transform = 'translate('+x2+','+y2+')';
      goalElm2.style.transform = 'translate('+x1+','+y1+')';
      setTimeout(function() {
        if (TIMES_OF_SHUFFLE<i++) {
          actualShuffle();
          return;
        }
        duration -= (10 - i/2)*10; // An = An-1 - 10 * (10 - (n-10)/2)  (A1 = 1000)
        const now = Date.now();
        console.log(i, now - justBefore, duration);
        justBefore = now;
        goalElms.forEach(function(e) {
          e.style.transitionDuration = duration+'ms';
        });
        fn();
      }, duration < SHUFFLE_DURATION_MIN ? SHUFFLE_DURATION_MIN : duration);
    }
    function actualShuffle() {
      goalElms.forEach(function(e, i) { // reset translate values
        e.style.transform = originalTransforms[i];
      });
      const goalTexts = document.querySelectorAll('.amida-goal-text') as NodeListOf<SVGElement>;
      goalTexts.forEach(function(textElm, idx) { // shuffle texts
        const pickedIdx = Math.floor(Math.random()*(goalTexts.length - idx));
        const tmp = goalTexts[pickedIdx].innerHTML;
        goalTexts[pickedIdx].innerHTML = goalTexts[idx].innerHTML;
        goalTexts[idx].innerHTML = tmp;
      });
    }
  }
  public readonly showResult = () => {
    const goalBlindElms = document.querySelectorAll('.amida-goal-blind') as NodeListOf<SVGElement>;
    goalBlindElms.forEach(function(e) {
      e.style.display = 'none';
    });
  }
  private readonly calcPath = ({ players, vLines, hLines } : AmidaData) => {
    return players.map((p, idx) => {
      p.path.push({ x: vLines[idx].position.x, y: 0 });
      const self = this;
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
      p.path.push({ x: vLines[finIdx].position.x, y: self.vLineHeight });
      p.goalIdx = finIdx;
      return p;
    });
  }
  private readonly renderPathGradually = async (path: Path, idx: number) => {
    let command = `M ${path[0].x} ${path[0].y}`;
    let cnt = 1;
    const pathElm = document.getElementById(`amida-player${idx}-path`) as Element;
    pathElm.setAttribute('stroke', this.colors[idx%this.colors.length]);
    pathElm.setAttribute('stroke-width', '3');
    const promise = new Promise(resolve => {
      const intervalId = global.setInterval(() => {
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
  private readonly draggablify = (hLineElm: Element) => {
    hLineElm.addEventListener('mousedown', dragStart);
    hLineElm.addEventListener('touchstart', dragStart, {passive: true});
    const self = this;
    function dragStart(strtEvt: MouseEvent | TouchEvent) {
      if (strtEvt instanceof MouseEvent && strtEvt.button !== 0) return;
      const initialPointX = (strtEvt instanceof MouseEvent ? strtEvt.clientX : strtEvt.touches[0].clientX);
      const initialPointY = (strtEvt instanceof MouseEvent ? strtEvt.clientY : strtEvt.touches[0].clientY);
      const key = (strtEvt.currentTarget as Element).id;
      const hLine = self.data.hLines[key];
      const initialPosition = hLine.position;
      self.data.activeVlineIdx = hLine.ownerIdx
      self.removeRoute(self.data.vLines, hLine);
      logger.log(JSON.parse(JSON.stringify(self.data)));
      let vLine = self.data.vLines[hLine.ownerIdx];
      const indicator = document.getElementById('amida-indicator') as unknown as SVGElement;
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
          VLINE_CONTENT_MIN_POS: self.vLineContentMinPos,
          VLINE_CONTENT_MAX_POS: self.vLineContentMaxPos,
        })
        const offsetFromAmidaLeft = hLineElm.getBoundingClientRect().left - (document.getElementById('amida-vline0') as Element).getBoundingClientRect().left;
        if (offsetFromAmidaLeft < vLine.boundary.x1) {
          if (0 < hLine.ownerIdx) {
            hLine.ownerIdx--
            vLine = self.data.vLines[hLine.ownerIdx]
            self.data.activeVlineIdx = hLine.ownerIdx
          } else {
            self.data.activeVlineIdx = self.NO_INDICATOR
          }
        } else if (vLine.boundary.x2 < offsetFromAmidaLeft) {
          if (hLine.ownerIdx < self.data.vLines.length - 2) {
            hLine.ownerIdx++
            vLine = self.data.vLines[hLine.ownerIdx]
            self.data.activeVlineIdx = hLine.ownerIdx
          } else {
            self.data.activeVlineIdx = self.NO_INDICATOR
          }
        } else if (vLine.boundary.x1 < offsetFromAmidaLeft || offsetFromAmidaLeft < vLine.boundary.x2) {
          self.data.activeVlineIdx = hLine.ownerIdx
        }
        hLineElm.setAttribute('transform', `translate(${hLine.position.x},${hLine.position.y})`)
        if (self.data.activeVlineIdx === self.NO_INDICATOR) {
          indicator.style.display = 'none';
        } else {
          indicator.style.display = '';
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
        if (self.data.activeVlineIdx === self.NO_INDICATOR) {
          delete self.data.hLines[key];
          (hLineElm.parentNode as Node).removeChild(hLineElm);
        } else {
          hLine.position.y = hLine.position.adjustedY;
          self.addRoute(self.data.vLines, hLine, self.data.hLines); // old route is already removed at mousedown, so just add it
          hLineElm.setAttribute('transform', `translate(${vLine.position.x},${hLine.position.y})`)
          indicator.style.display = 'none';
        }
        logger.log(JSON.parse(JSON.stringify(self.data)));
      }
    }
  }
  private readonly addRoute = (vls: VLine[], newHLine: HLine, hLines: HLines) => {
    recursive(vls[newHLine.ownerIdx].startRoute, vls[newHLine.ownerIdx], 1, newHLine, hLines);
    recursive(vls[newHLine.ownerIdx+1].startRoute, vls[newHLine.ownerIdx+1], -1, newHLine, hLines);
    function recursive(currentKey: string | null, vl: VLine, lr: VLineRouteLR, newHLine: HLine, hLines: HLines) {
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
        logger.log('first.vl', JSON.parse(JSON.stringify(vl)));
        logger.log('first.newHLine.key', newHLine.key);
        logger.log('first.prevKey', null);
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
        logger.log('last.vl', JSON.parse(JSON.stringify(vl)));
        logger.log('last.newHLine.key', newHLine.key);
        logger.log('last.currentKey', currentKey);
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
        logger.log('middle.vl', JSON.parse(JSON.stringify(vl)));
        logger.log('middle.newHLine.key', newHLine.key);
        logger.log('middle.currentKey', currentKey);
        vl.routes[currentRoute.nextKey].prevKey = newHLine.key;
        vl.routes[newHLine.key] = { nextKey: currentRoute.nextKey, prevKey: currentKey, lr };
        currentRoute.nextKey = newHLine.key;
        return;
      }
      recursive(currentRoute.nextKey, vl, lr, newHLine, hLines);
    }
  }
  private readonly removeRoute = (vls: VLine[], hl: HLine) => {
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
}

export default Amida;

