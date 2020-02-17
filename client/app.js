function draggablify(elm) {
  const regex = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/
  let posX = 0, posY = 0;
  elm.onmousedown = function(lEvt) {
    console.log(11)
    posX = lEvt.clientX;
    posY = lEvt.clientY;
    document.onmousemove = function(dEvt) {
        dEvt = dEvt || window.event;
        const diffX = dEvt.clientX - posX;
        const diffY = dEvt.clientY - posY;
        posX = dEvt.clientX;
        posY = dEvt.clientY;
        const xforms = elm.getAttribute('transform');
        const [, offsetX, offsetY] = regex.exec(xforms);
        elm.setAttribute('transform', 'translate(' + (+offsetX + +diffX) + ',' + (+offsetY + +diffY) + ')' )
        console.log(12)
    }
    document.onmouseup = function() {
      document.onmousemove = null
      document.onmouseup = null
      console.log(13)
    }
  }
}
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('[id^="hline"]').forEach(function(n) {
    console.log(n)
    draggablify(n)
  })
})

