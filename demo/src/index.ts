import './config.js';
import Adima from '../dist/index.js';
const root = document.getElementById('root') as Element;
const adima = new Adima(root);
document.addEventListener('DOMContentLoaded', function() {
  adima.init();
});

