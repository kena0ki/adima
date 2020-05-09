import './config.js';
import Amida from '../dist/index.js';
const root = document.getElementById('root') as Element;
const amida = new Amida(root);
document.addEventListener('DOMContentLoaded', function() {
  amida.init();
});

