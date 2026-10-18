// Каскадное появление плиток «All work» (если JS не работает — плитки видны сразу)
(function () {
  var sec = document.getElementById('all-work');
  if (!sec) return;
  var tiles = Array.prototype.slice.call(sec.querySelectorAll('.all-work__tile'));
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('all-work--js');
  var grid = sec.querySelector('.all-work__grid');
  var io = new IntersectionObserver(function (entries) {
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var i = tiles.indexOf(e.target) % cols;
      e.target.style.transitionDelay = (i * 40) + 'ms';
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  tiles.forEach(function (t) { io.observe(t); });
})();
