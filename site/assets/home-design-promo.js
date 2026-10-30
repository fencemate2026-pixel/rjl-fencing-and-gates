/* A small, isolated before/after demo; the real design tools open via normal links. */
(function () {
  'use strict';
  document.querySelectorAll('[data-design-compare]').forEach(function (preview) {
    var range = preview.querySelector('input[type="range"]');
    if (!range) return;
    var frame = 0;
    function reveal(value) {
      preview.style.setProperty('--reveal', value + '%');
      range.value = String(value);
      range.setAttribute('aria-valuetext', Math.round(value) + ' percent of the fence design shown');
    }
    function stop() { cancelAnimationFrame(frame); }
    range.addEventListener('pointerdown', stop);
    range.addEventListener('keydown', stop);
    range.addEventListener('input', function () { stop(); reveal(Number(range.value)); });
    reveal(Number(range.value));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var start;
    function demonstrate(time) {
      if (start === undefined) start = time;
      var progress = Math.min((time - start) / 1900, 1);
      reveal(55 + Math.sin(progress * Math.PI * 2) * 18 * Math.sin(progress * Math.PI));
      if (progress < 1) frame = requestAnimationFrame(demonstrate);
    }
    frame = requestAnimationFrame(demonstrate);
  });
})();
