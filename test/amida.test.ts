// globalThis.isDevelopment = true;
import Amida from '../src/amida';
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
  const amida = new Amida(root);
  amida.init();
  expect(document.body).toMatchSnapshot('init');
  expect(document.body).toMatchSnapshot('drag hline beyond right edge of amida');
  const hLineElms = document.querySelectorAll('.amida-hline');
  const firstHLineElm = hLineElms[0];
  drag(firstHLineElm,{x:0,y:0},{x:amida.LINE_SPAN/2,y:0});
  expect(document.body).toMatchSnapshot('drag hline within span');
  drag(firstHLineElm,{x:0,y:0},{x:amida.LINE_SPAN/2 + 1,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond right edge');
  drag(firstHLineElm,{x:amida.LINE_SPAN/2 + 1,y:0},{x:0,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond left edge of span');
  drag(firstHLineElm,{x:amida.LINE_SPAN/2 + 1,y:0},{x:0,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond left edge of amida');
  const lastHLineElm = hLineElms[hLineElms.length-1];
  drag(lastHLineElm,{x:0,y:0},{x:amida.LINE_SPAN/2 + 1,y:0});
  expect(document.body).toMatchSnapshot('drag hline beyond right edge of amida');
  function drag(hLineElm: Element, startPos: Pos, endPos: Pos) {
    const mdEvt = new MouseEvent('mousedown', {clientX: startPos.x, clientY: startPos.y});
    hLineElm.dispatchEvent(mdEvt);
    const mmEvt = new MouseEvent('mousemove', {clientX: endPos.x, clientY: endPos.y});
    document.dispatchEvent(mmEvt);
    const muEvt = new MouseEvent('mouseup');
    document.dispatchEvent(muEvt);
  }
  amida.addVLine();
  expect(document.body).toMatchSnapshot('addVLine');
  amida.addHLine();
  expect(document.body).toMatchSnapshot('addHLine');
  const clckEvt = new MouseEvent('click');
  const playerTxtElm = document.querySelector('.amida-player-text') as Element;
  playerTxtElm.dispatchEvent(clckEvt);
  expect(document.body).toMatchSnapshot('edit player text');
  const blrEvt = new FocusEvent('blur');
  const playerEdtElm = document.querySelector('.amida-player-editable-element') as Element;
  playerEdtElm.dispatchEvent(blrEvt);
  expect(document.body).toMatchSnapshot('edit player text done');
  const goalTxtElm = document.querySelector('.amida-goal-text') as Element;
  goalTxtElm.dispatchEvent(clckEvt);
  expect(document.body).toMatchSnapshot('edit goal text');
  const goalEdtElm = document.querySelector('.amida-goal-editable-element') as Element
  goalEdtElm.dispatchEvent(blrEvt);
  expect(document.body).toMatchSnapshot('edit goal text done');
  const ctxEvt = new MouseEvent('contextmenu');
  const amidaMainElm = document.getElementById('amida-main-container') as Element
  amidaMainElm.dispatchEvent(ctxEvt);
  expect(document.body).toMatchSnapshot('show contextmenu');
  const mdEvt = new MouseEvent('mousedown');
  document.dispatchEvent(mdEvt);
  expect(document.body).toMatchSnapshot('hide contextmenu');
  const menuElms = document.querySelectorAll('.amida-menu-item');
  const menuItemIdxes = Object.keys(amida.menuItems).reduce((result,next,idx) => ({...result, [next]:idx}), {});
  // const shuffleGoalsTimerRunner = new TimerRunner();
  menuElms[menuItemIdxes['Shuffle goals']].dispatchEvent(mdEvt);
  // amida.shuffleGoals().then(function() {
  //   shuffleGoalsTimerRunner.isFullfilled = true;
  //   expect(document.body).toMatchSnapshot('shuffleGoals');
  // });
  while(amida.isShuffling) {
    await 0; // wait for other tasks being finishd
    jest.runAllTimers();
  }
  expect(document.body).toMatchSnapshot('shuffleGoals');
  // await shuffleGoalsTimerRunner.runAllTimersRecursive();
  // const startAmidaTimerRunner = new TimerRunner();
  // amida.startAmida().then(function() {
  //   startAmidaTimerRunner.isFullfilled = true;
  //   expect(document.body).toMatchSnapshot('startAmida');
  // });
  // await startAmidaTimerRunner.runAllTimersRecursive();
  menuElms[menuItemIdxes['Start']].dispatchEvent(mdEvt);
  while(amida.isRendering) {
    await 0; // wait for other tasks being finishd
    jest.runAllTimers();
  }
  expect(document.body).toMatchSnapshot('startAmida');
  amida.clearPath();
  expect(document.body).toMatchSnapshot('clearPath');

  Date.now = dateNow;
  Math.random = mathRandom;
});

// function TimerRunner() {
//   this.isFullfilled = false;
//   this.runAllTimersRecursive = async function () { // For those who need to be called jest.runAllTimers() multple times.
//     if (this.isFullfilled) return;
//     jest.runAllTimers();
//     await Promise.resolve().then(this.runAllTimersRecursive.bind(this)); // We use Promise (we can't use setTimeout() nor process.nextTick() because they are mocked) to go async in order for tasks in target function (e.g. startAmida()) to be called.
//   }
// }

// test('Init', function() {
//   document.body.innerHTML = '<div id="root"></div>';
//   const root = document.getElementById('root') as Element;
//   const amida = new Amida(root);
//   // document.addEventListener('DOMContentLoaded', function() {
//   //   amida.init();
//   // });
//   amida.init();
//   expect(document.body).toMatchSnapshot();
// });
// 
// test('Add a virtical line', function() {
//   document.body.innerHTML = '<div id="root"></div>';
//   const root = document.getElementById('root') as Element;
//   const amida = new Amida(root);
//   amida.init();
//   amida.addVLine();
//   expect(document.body).toMatchSnapshot();
// });
// 
// test('Add a horizontal line', function() {
//   document.body.innerHTML = '<div id="root"></div>';
//   const root = document.getElementById('root') as Element;
//   const amida = new Amida(root);
//   amida.init();
//   amida.addHLine();
//   expect(document.body).toMatchSnapshot();
// });
// 
// test('Start Amida', async function() {
//   document.body.innerHTML = '<div id="root"></div>';
//   const root = document.getElementById('root') as Element;
//   const amida = new Amida(root);
//   amida.init();
//   let fullfilled = false;
//   amida.startAmida().then(function() {
//     fullfilled = true;
//     expect(document.body).toMatchSnapshot();
//   });
//   await runAllTimersRecursive();
//   async function runAllTimersRecursive() { // startAmida() calls setInterval() several times. So we need to call jest.runAllTimers() multple times.
//     if (fullfilled) return;
//     jest.runAllTimers();
//     await Promise.resolve().then(runAllTimersRecursive); // So we use Promise (we can't use setTimeout() nor process.nextTick() because they are mocked) to go async in order for tasks in startAmida() to be called.
//   }
// });
