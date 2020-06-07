# Adima
[![codecov](https://codecov.io/gh/kena0ki/adima/branch/master/graph/badge.svg)](https://codecov.io/gh/kena0ki/adima)  

This is a fast, lightweight, no dependency, not so impressive, and completely useless library for [Amidakuji](https://en.wikipedia.org/wiki/Ghost_Leg) ;-)  

## Basic usage
### Use with installation.
Install by npm
```shell
npm install adima
```
and use it.
```javascript
import Adima from 'adima';

const container = document.getElementById('some-container');
const adima = new Adima(container);
adima.init();
```

### Use without installation
```html
<script type="module" >
  import Adima from 'https://unpkg.com/adima@latest/dist/index.js';

  const container = document.getElementById('some-container');
  const adima = new Adima(container);
  adima.init();
</script>
```

## Demo
Demo page is [here](https://adima.netlify.app/)  
![demo](https://raw.githubusercontent.com/kena0ki/adima/master/assets/readme-demo.gif)

## API
API is [here](https://kena0ki.github.io/adima/)  

## Lisence
MIT

