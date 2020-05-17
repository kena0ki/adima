import adima from './init.js'

export const settings = [
  'height',
  'width',
  'headerHeight',
  'footerHeight',
  'numVLines',
  'numHLines',
]
const options = {}
document.addEventListener('DOMContentLoaded', function() {
  settings.forEach(function(key, idx) {
    const inputElms = document.querySelectorAll('.settings-input');
    const valueElms = document.querySelectorAll('.settings-value');
    inputElms[idx].addEventListener('input', function(evt) {
      options[key] = +(evt.target as HTMLInputElement).value;
      valueElms[idx].textContent = (evt.target as HTMLInputElement).value;
    });
  });
});

const btnElm = document.getElementById('rerender-btn') as Element;
btnElm.addEventListener('click', function() {
  adima.init(options);
});

