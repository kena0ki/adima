// globalThis.isDevelopment = true;
import Adima from '../src/adima';
interface Pos {
  x,y: number;
}

jest.useFakeTimers();

test('Snapshot', async function() {
  const dateNow = Date.now;
  Date.now = (function() {
    let cnt = 0;
    const time = new Date(2000,0,1).getTime() - (new Date().getTimezoneOffset() * 60 * 1000);
    return function() {
      return time + cnt++;
    }
  })();
  const mathRandom = Math.random;
  Math.random = (function() {
    let cnt = 0;
    return function() {
      return (cnt*cnt++ % 10) / 10;
    }
  })();

  document.body.innerHTML = '<div id="root"></div>';
  const root = document.getElementById('root') as Element;
  const adima = new Adima(root);
  adima.init();
  expect(document.body).toMatchSnapshot('init');
  expect(document.body).toMatchSnapshot('drag hline beyond right edge of adima');
  const hLineElms = document.querySelectorAll('.adima-hline');
  const firstHLineElm = hLineElms[0];
  drag(firstHLineElm,{x:0,y:0},{x:adima.LINE_SPAN/2,y:0});
  expect(document.body).toMatchSnapshot('drag hline within span');
  drag(firstHLineElm,{x:0,y:0},{x:adima.LINE_SPAN/2 + 1,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond right edge');
  drag(firstHLineElm,{x:adima.LINE_SPAN/2 + 1,y:0},{x:0,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond left edge of span');
  drag(firstHLineElm,{x:adima.LINE_SPAN/2 + 1,y:0},{x:0,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond left edge of adima');
  const lastHLineElm = hLineElms[hLineElms.length-1];
  drag(lastHLineElm,{x:0,y:0},{x:adima.LINE_SPAN/2 + 1,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond right edge of adima');
  function drag(hLineElm: Element, startPos: Pos, endPos: Pos) {
    const mdEvt = new MouseEvent('mousedown', {clientX: startPos.x, clientY: startPos.y});
    hLineElm.dispatchEvent(mdEvt);
    const mmEvt = new MouseEvent('mousemove', {clientX: endPos.x, clientY: endPos.y});
    document.dispatchEvent(mmEvt);
    const muEvt = new MouseEvent('mouseup');
    document.dispatchEvent(muEvt);
  }
  adima.addVLine();
  expect(document.body).toMatchSnapshot('addVLine');
  adima.addHLine();
  expect(document.body).toMatchSnapshot('addHLine');
  const clckEvt = new MouseEvent('click');
  const playerTxtElm = document.querySelector('.adima-player-text') as Element;
  playerTxtElm.dispatchEvent(clckEvt);
  expect(document.body).toMatchSnapshot('edit player text');
  const blrEvt = new FocusEvent('blur');
  const playerEdtElm = document.querySelector('.adima-player-editable-element') as Element;
  playerEdtElm.dispatchEvent(blrEvt);
  expect(document.body).toMatchSnapshot('edit player text done');
  const goalTxtElm = document.querySelector('.adima-goal-text') as Element;
  goalTxtElm.dispatchEvent(clckEvt);
  expect(document.body).toMatchSnapshot('edit goal text');
  const goalEdtElm = document.querySelector('.adima-goal-editable-element') as Element
  goalEdtElm.dispatchEvent(blrEvt);
  expect(document.body).toMatchSnapshot('edit goal text done');
  const ctxEvt = new MouseEvent('contextmenu');
  const adimaMainElm = document.getElementById('adima-main-container') as Element
  adimaMainElm.dispatchEvent(ctxEvt);
  expect(document.body).toMatchSnapshot('show contextmenu');
  const mdEvt = new MouseEvent('mousedown');
  document.dispatchEvent(mdEvt);
  expect(document.body).toMatchSnapshot('hide contextmenu');
  const menuElms = document.querySelectorAll('.adima-menu-item');
  const menuItemIdxes = Object.keys(adima.menuItems).reduce((result,next,idx) => ({...result, [next]:idx}), {});
  menuElms[menuItemIdxes['Shuffle goals']].dispatchEvent(mdEvt);
  while(adima.isShuffling) {
    await 0; // wait for other tasks being finishd
    jest.runAllTimers();
  }
  expect(document.body).toMatchSnapshot('shuffleGoals');
  menuElms[menuItemIdxes['Start']].dispatchEvent(mdEvt);
  while(adima.isRendering) {
    await 0; // wait for other tasks being finishd
    jest.runAllTimers();
  }
  expect(document.body).toMatchSnapshot('startAdima');
  adima.clearPath();
  expect(document.body).toMatchSnapshot('clearPath');
  adima.revealGoals();
  expect(document.body).toMatchSnapshot('reveal goals');

  Date.now = dateNow;
  Math.random = mathRandom;
});
