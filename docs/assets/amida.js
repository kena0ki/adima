var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var VLine = /** @class */ (function () {
    function VLine(props) {
        var _this = this;
        this.routes = {};
        Object.keys(props).forEach(function (key) {
            _this[key] = props[key];
        });
    }
    Object.defineProperty(VLine.prototype, "boundary", {
        get: function () {
            return { x1: this.position.x - (this.LINE_SPAN / 2), x2: this.position.x + (this.LINE_SPAN / 2) };
        },
        enumerable: true,
        configurable: true
    });
    return VLine;
}());
var HLinePos = /** @class */ (function () {
    function HLinePos(props) {
        var _this = this;
        Object.keys(props).forEach(function (key) {
            _this[key] = props[key];
        });
    }
    Object.defineProperty(HLinePos.prototype, "adjustedY", {
        get: function () {
            return this.y < this.VLINE_CONTENT_MIN_POS ? this.VLINE_CONTENT_MIN_POS :
                (this.VLINE_CONTENT_MAX_POS < this.y ? this.VLINE_CONTENT_MAX_POS : this.y);
        },
        enumerable: true,
        configurable: true
    });
    return HLinePos;
}());
(function (global) {
    'use strict';
    var PRODUCTION = false;
    var NO_INDICATOR = -1;
    var DEFAULT_VLINES = 6;
    var DEFAULT_HLINES = 10;
    var VLINE_HEIGHT = 200;
    var VLINE_MARGIN_HEIGHT_RATIO = .1;
    var VLINE_MARGIN_HEIGHT = VLINE_HEIGHT * VLINE_MARGIN_HEIGHT_RATIO;
    var VLINE_CONTENT_HEIGHT = VLINE_HEIGHT - VLINE_MARGIN_HEIGHT;
    var VLINE_CONTENT_MIN_POS = VLINE_MARGIN_HEIGHT / 2;
    var VLINE_CONTENT_MAX_POS = VLINE_HEIGHT - VLINE_CONTENT_MIN_POS;
    var LINE_SPAN = 40;
    var AMIDA_CONTAINER_MARGIN_RATIO = .2;
    var COLORS = [
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
    var CHAR_A = 65;
    initializeLogger(PRODUCTION);
    var vLines = (function () {
        var vLines = [];
        for (var i = 0; i < DEFAULT_VLINES; i++) {
            var posX = i * LINE_SPAN;
            vLines.push(new VLine({ position: { x: posX }, LINE_SPAN: LINE_SPAN }));
        }
        return vLines;
    })();
    var hLines = (function () {
        var hLines = {};
        var timestamp = Date.now();
        for (var i = 0, j = 0; i < DEFAULT_HLINES; i++, j++) {
            if (j >= DEFAULT_VLINES - 1)
                j = 0;
            var key = 'hline' + timestamp + i;
            var y = Math.floor(Math.random() * VLINE_CONTENT_HEIGHT) + (VLINE_CONTENT_MIN_POS);
            var newHLine = {
                key: key,
                position: new HLinePos({ x: vLines[j].position.x, y: y, VLINE_CONTENT_MAX_POS: VLINE_CONTENT_MAX_POS, VLINE_CONTENT_MIN_POS: VLINE_CONTENT_MIN_POS }),
                ownerIdx: j,
            };
            hLines[key] = newHLine;
            addRoute(vLines, newHLine, hLines);
        }
        return hLines;
    })();
    var players = (function (p) {
        for (var i = 0; i < vLines.length; i++)
            p.push({ name: '' + i, path: [], startVLineIdx: i });
        return p;
    })([]);
    var goals = (function (g) {
        for (var i = CHAR_A; i < vLines.length; i++)
            g.push(String.fromCharCode(i));
        return g;
    })([]);
    var menuItems = [
        'Start',
        'Add a virtical line',
        'Add a horizontal line',
        'Clear',
    ];
    var svg = "\n  <svg id=\"amida-svg\" height=\"" + (VLINE_HEIGHT + 10) + "\" width=\"" + (LINE_SPAN * (DEFAULT_VLINES - 1) + 10) + "\" xmlns=\"http://www.w3.org/2000/svg\" >\n    <g style=\"stroke:rgb(0,0,0);stroke-width:2\" transform=\"translate(5, 5)\" >";
    svg += vLines.reduce(function (result, next, idx) {
        return result + "\n      <g id=\"vline" + idx + "\" transform=\"translate(" + next.position.x + ",0)\" >\n        <line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"" + VLINE_HEIGHT + "\" />\n      </g>";
    }, '');
    svg += Object.keys(hLines).reduce(function (result, next) {
        var h = hLines[next];
        return result + "\n      <g id=\"" + h.key + "\" class=\"hline\" transform=\"translate(" + h.position.x + "," + h.position.y + ")\" >\n        <line x1=\"0\" y1=\"0\" x2=\"" + LINE_SPAN + "\" y2=\"0\" />\n      </g>";
    }, '');
    svg += players.reduce(function (result, next, idx) {
        return result + "\n      <g id=\"players" + idx + "-path-container\">\n        <path id=\"players" + idx + "-path\" fill=\"transparent\"/>\n      </g>";
    }, '');
    svg += "\n      <g id=\"indicator\" class=\"inactive\">\n        <circle cx=\"4\" cy=\"4\" r=\"4\" fill=\"blue\" />\n      </g>\n    </g>\n    Sorry, your browser does not support inline SVG.\n  </svg>";
    var menu = "\n  <div id=\"amida-menu\" class=\"amida-menu-container\" style=\"display: none\">\n    " + menuItems.reduce(function (result, next) { return result + "\n    <div class=\"amida-menu-item\" >\n      <span class=\"amida-menu-item-text\">" + next + "</span>\n    </div>"; }, '') + "\n  </div>";
    document.addEventListener('DOMContentLoaded', function () {
        var rootElm = document.getElementById('root');
        rootElm.innerHTML = svg + menu;
        var amida = {
            pageX: rootElm.children[0].getBoundingClientRect().left + scrollX,
            pageY: rootElm.children[0].getBoundingClientRect().top + scrollY,
            vLines: vLines,
            hLines: hLines,
            innerHTML: rootElm.innerHTML,
            activeVlineIdx: NO_INDICATOR,
            players: players,
            goals: goals,
        };
        global.amida = amida;
        global.log(JSON.parse(JSON.stringify(amida)));
        var svgElm = document.getElementById('amida-svg'); // https://github.com/microsoft/TypeScript/issues/32822
        var menuElm = document.getElementById('amida-menu');
        svgElm.addEventListener('contextmenu', function (cEvt) {
            cEvt.preventDefault();
            menuElm.style.left = cEvt.pageX + 'px';
            menuElm.style.top = cEvt.pageY + 'px';
            menuElm.style.display = '';
            var clearCtxMenu = function () {
                menuElm.style.display = 'none';
                document.removeEventListener('mousedown', clearCtxMenu);
            };
            document.addEventListener('mousedown', clearCtxMenu);
        });
        var startElm = menuElm.children[0];
        startElm.addEventListener('mousedown', function () {
            if (amida.players[0].path.length > 0)
                return; // Already rendered result
            amida.players = calcPath(amida);
            (function afn() {
                return __awaiter(this, void 0, void 0, function () {
                    var i;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < amida.players.length)) return [3 /*break*/, 4];
                                return [4 /*yield*/, renderPathGradually(amida.players[i].path, i)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3:
                                i++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            })();
        });
        function calcPath(_a) {
            var players = _a.players, vLines = _a.vLines;
            return players.map(function (p, idx) {
                p.path.push({ x: vLines[p.startVLineIdx].position.x, y: 0 });
                var finIdx = (function setMidwayPathAndGetFinIdx(routeKey, i) {
                    if (!routeKey)
                        return i;
                    var hl = hLines[routeKey];
                    var vl = vLines[i];
                    p.path.push({ x: vl.position.x, y: hl.position.y });
                    var route = vl.routes[routeKey];
                    var nextVl = vLines[i + route.lr];
                    p.path.push({ x: nextVl.position.x, y: hl.position.y });
                    return setMidwayPathAndGetFinIdx(nextVl.routes[routeKey].nextKey, i + route.lr);
                })(vLines[p.startVLineIdx].startRoute, idx);
                p.path.push({ x: vLines[finIdx].position.x, y: VLINE_HEIGHT });
                return p;
            });
        }
        function renderPathGradually(path, idx) {
            return __awaiter(this, void 0, void 0, function () {
                var command, cnt, pathElm, promise;
                return __generator(this, function (_a) {
                    command = "M " + path[0].x + " " + path[0].y;
                    cnt = 1;
                    pathElm = document.getElementById("players" + idx + "-path");
                    pathElm.setAttribute('stroke', COLORS[idx % COLORS.length]);
                    pathElm.setAttribute('stroke-width', '3');
                    promise = new Promise(function (resolve) {
                        var intervalId = global.setInterval(function () {
                            if (cnt >= path.length) {
                                global.clearInterval(intervalId);
                                resolve();
                                return;
                            }
                            command = command + " L " + path[cnt].x + " " + path[cnt].y;
                            cnt++;
                            pathElm.setAttribute('d', command);
                        }, 100);
                    });
                    return [2 /*return*/, promise];
                });
            });
        }
        var addVLineElm = menuElm.children[1];
        addVLineElm.addEventListener('mousedown', function () {
            var prevLastVLineIdx = amida.vLines.length - 1;
            var prevLastVLine = amida.vLines[prevLastVLineIdx];
            var newVLine = new VLine({ position: { x: prevLastVLine.position.x + LINE_SPAN }, LINE_SPAN: LINE_SPAN });
            amida.vLines.push(newVLine);
            var prevLastPlayersIdx = amida.players.length - 1;
            amida.players.push({ name: '' + amida.players.length, path: [], startVLineIdx: amida.players.length });
            amida.goals.push(String.fromCharCode(CHAR_A + goals.length)); //TODO why should I cast it to never?
            var lastVLineElm = document.getElementById('vline' + prevLastVLineIdx);
            var cloneV = lastVLineElm.cloneNode(true);
            cloneV.id = 'vline' + (amida.vLines.length - 1);
            cloneV.setAttribute('transform', "translate(" + newVLine.position.x + ", 0)");
            lastVLineElm.parentNode.insertBefore(cloneV, lastVLineElm.nextSibling);
            svgElm.setAttribute('width', '' + LINE_SPAN * amida.vLines.length * (1 + AMIDA_CONTAINER_MARGIN_RATIO));
            var lastPathContainerElm = document.getElementById("players" + prevLastPlayersIdx + "-path-container");
            var cloneP = lastPathContainerElm.cloneNode(true);
            cloneP.id = "players" + (amida.players.length - 1) + "-path-container";
            cloneP.children[0].id = "players" + (amida.players.length - 1) + "-path";
            lastPathContainerElm.parentNode.insertBefore(cloneP, lastPathContainerElm.nextSibling);
        });
        var addHLineElm = menuElm.children[2]; // cast is needed, otherwise mdEvt is not recognized as MouseEvent
        addHLineElm.addEventListener('mousedown', function (mdEvt) {
            global.log('x:', mdEvt.pageX - amida.pageX);
            var ownerIdx = (function () {
                var i = (amida.vLines.findIndex(function (v) {
                    return (menuElm.getBoundingClientRect().left + scrollX - amida.pageX) < v.position.x;
                }));
                var isLeftEnd = i === 0;
                var isRightEnd = i === -1;
                return isLeftEnd ? 0 : (isRightEnd ? amida.vLines.length - 2 : i - 1);
            })();
            var y = (menuElm.getBoundingClientRect().top + scrollY - amida.pageY);
            var key = "hline" + Date.now() + "1";
            var newHLine = {
                key: key,
                position: new HLinePos({ x: amida.vLines[ownerIdx].position.x, y: y, VLINE_CONTENT_MIN_POS: VLINE_CONTENT_MIN_POS, VLINE_CONTENT_MAX_POS: VLINE_CONTENT_MAX_POS }),
                ownerIdx: ownerIdx,
            };
            newHLine.position.y = newHLine.position.adjustedY; // New horizontal line should be placed at valid position, so let's immediately overwrite it
            amida.hLines[key] = newHLine;
            addRoute(amida.vLines, newHLine, amida.hLines);
            global.log(JSON.parse(JSON.stringify(amida)));
            var hLineElm = document.querySelector('[id^=hline]');
            var clone = hLineElm.cloneNode(true);
            clone.id = key;
            clone.setAttribute('transform', "translate(" + newHLine.position.x + ", " + newHLine.position.y + ")");
            hLineElm.parentNode.insertBefore(clone, hLineElm.nextSibling);
            draggablify(clone, amida);
        });
        var clearElm = menuElm.children[3];
        clearElm.addEventListener('mousedown', function () {
            amida.players = amida.players.map(function (p) { return (__assign(__assign({}, p), { path: [] })); });
            amida.players.forEach(function (p, i) {
                var pathElm = document.getElementById("players" + i + "-path");
                pathElm.removeAttribute('stroke');
                pathElm.removeAttribute('stroke-width');
                pathElm.removeAttribute('d');
            });
        });
        document.querySelectorAll('[id^="hline"]').forEach(function (n) {
            draggablify(n, amida);
        });
    });
    function draggablify(hLineElm, amida) {
        var pntrX = 0, pntrY = 0;
        hLineElm.addEventListener('mousedown', dragStart);
        function dragStart(mdEvt) {
            if (mdEvt.button !== 0)
                return;
            pntrX = +mdEvt.clientX;
            pntrY = +mdEvt.clientY;
            var key = mdEvt.target.parentElement.id;
            var hLine = amida.hLines[key];
            amida.activeVlineIdx = hLine.ownerIdx;
            removeRoute(amida.vLines, hLine);
            global.log(JSON.parse(JSON.stringify(amida)));
            var vLine = amida.vLines[hLine.ownerIdx];
            var indicator = document.getElementById('indicator');
            indicator.setAttribute('class', 'active');
            indicator.setAttribute('transform', "translate(" + vLine.position.x + "," + hLine.position.y + ")");
            document.addEventListener('mousemove', dragging);
            function dragging(mmEvt) {
                var diffX = +mmEvt.clientX - pntrX;
                var diffY = +mmEvt.clientY - pntrY;
                pntrX = +mmEvt.clientX;
                pntrY = +mmEvt.clientY;
                hLine.position = new HLinePos({
                    x: hLine.position.x + diffX,
                    y: hLine.position.y + diffY,
                    VLINE_CONTENT_MIN_POS: VLINE_CONTENT_MIN_POS,
                    VLINE_CONTENT_MAX_POS: VLINE_CONTENT_MAX_POS,
                });
                var offsetFromAmidaLeft = (hLineElm.getBoundingClientRect().left + scrollX) - amida.pageX;
                if (offsetFromAmidaLeft < vLine.boundary.x1) {
                    if (0 < hLine.ownerIdx) {
                        hLine.ownerIdx--;
                        vLine = amida.vLines[hLine.ownerIdx];
                        amida.activeVlineIdx = hLine.ownerIdx;
                    }
                    else {
                        amida.activeVlineIdx = NO_INDICATOR;
                    }
                }
                else if (vLine.boundary.x2 < offsetFromAmidaLeft) {
                    if (hLine.ownerIdx < amida.vLines.length - 2) {
                        hLine.ownerIdx++;
                        vLine = amida.vLines[hLine.ownerIdx];
                        amida.activeVlineIdx = hLine.ownerIdx;
                    }
                    else {
                        amida.activeVlineIdx = NO_INDICATOR;
                    }
                }
                else if (vLine.boundary.x1 < offsetFromAmidaLeft || offsetFromAmidaLeft < vLine.boundary.x2) {
                    amida.activeVlineIdx = hLine.ownerIdx;
                }
                hLineElm.setAttribute('transform', "translate(" + hLine.position.x + "," + hLine.position.y + ")");
                if (amida.activeVlineIdx === NO_INDICATOR) {
                    indicator.setAttribute('class', 'inactive');
                }
                else {
                    indicator.setAttribute('class', 'active');
                    indicator.setAttribute('transform', "translate(" + vLine.position.x + "," + hLine.position.adjustedY + ")");
                }
            }
            document.addEventListener('mouseup', dragEnd);
            function dragEnd() {
                document.removeEventListener('mousemove', dragging);
                document.removeEventListener('mouseup', dragEnd);
                if (amida.activeVlineIdx === NO_INDICATOR) {
                    delete amida.hLines[key];
                    hLineElm.parentNode.removeChild(hLineElm);
                }
                else {
                    hLine.position.y = hLine.position.adjustedY;
                    addRoute(amida.vLines, hLine, amida.hLines); // old route is already removed at mousedown, so just add it
                    hLineElm.setAttribute('transform', "translate(" + vLine.position.x + "," + hLine.position.y + ")");
                    indicator.setAttribute('class', 'inactive');
                }
                global.log(JSON.parse(JSON.stringify(amida)));
            }
        }
    }
    function addRoute(vls, newHLine, hLines) {
        recursive(vls[newHLine.ownerIdx].startRoute, vls[newHLine.ownerIdx], 1, newHLine, hLines);
        recursive(vls[newHLine.ownerIdx + 1].startRoute, vls[newHLine.ownerIdx + 1], -1, newHLine, hLines);
        function recursive(currentKey, vl, lr, newHLine, hLines) {
            if (!currentKey) { // initialize
                /**
                 * Before:
                 *  [Start] -> [End]
                 * After:
                 *  [Start] -> |newKey| -> [End]
                 */
                vl.startRoute = newHLine.key;
                vl.routes[newHLine.key] = { nextKey: null, prevKey: null, lr: lr };
                return;
            }
            var currentRoute = vl.routes[currentKey];
            // @ts-ignore vl.startRoute shouldn't be undefined, because initialize block would be executed beforehand
            var startHLine = hLines[vl.startRoute];
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
                vl.routes[newHLine.key] = { nextKey: currentKey, prevKey: null, lr: lr };
                return;
            }
            else if (!currentRoute.nextKey) { // addToLast
                /**
                 * Before:
                 *  |currentKey| -> [End]
                 * After:
                 *  |currentKey| -> |newKey| -> [End]
                 */
                global.log('last.vl', JSON.parse(JSON.stringify(vl)));
                global.log('last.newHLine.key', newHLine.key);
                global.log('last.currentKey', currentKey);
                vl.routes[newHLine.key] = { nextKey: null, prevKey: currentKey, lr: lr };
                currentRoute.nextKey = newHLine.key;
                return;
            }
            else if (newHLine.position.y <= hLines[currentRoute.nextKey].position.y) { // addToMiddle
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
                vl.routes[newHLine.key] = { nextKey: currentRoute.nextKey, prevKey: currentKey, lr: lr };
                currentRoute.nextKey = newHLine.key;
                return;
            }
            recursive(currentRoute.nextKey, vl, lr, newHLine, hLines);
        }
    }
    function removeRoute(vls, hl) {
        fn(hl.ownerIdx);
        fn(hl.ownerIdx + 1);
        function fn(idx) {
            var routes = vls[idx].routes;
            var route = routes[hl.key];
            if (route.prevKey)
                routes[route.prevKey].nextKey = route.nextKey;
            else
                vls[idx].startRoute = route.nextKey;
            if (route.nextKey)
                routes[route.nextKey].prevKey = route.prevKey;
            delete routes[hl.key];
        }
    }
    function initializeLogger(isProduction) {
        if (isProduction)
            global.log = function () { };
        else
            global.log = console.log;
    }
})(Function('return this')());
