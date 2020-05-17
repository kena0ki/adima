import Adima from '../dist/index.js';
import { settings } from './settings.js';

const root = document.getElementById('root') as Element;
const adima = new Adima(root);
document.addEventListener('DOMContentLoaded', function() {
  adima.init();
  const valueElms = document.querySelectorAll('.settings-value');
  const inputElms = document.querySelectorAll('.settings-input') as NodeListOf<HTMLInputElement>;
  settings.forEach(function(key,idx) {
    valueElms[idx].textContent = adima[key];
    inputElms[idx].value = adima[key];
  });
});
export default adima;

