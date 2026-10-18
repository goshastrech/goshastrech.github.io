/* Posters design: «колода-веер». Обычный скрипт, не модуль.
   Контракт с js/main.js сохранён: карточка = <button class="poster"> внутри .posters__grid.
   Клик по карточке (мышь, тач, Enter/Space) сразу открывает просмотр из main.js.
   Здесь только раскладка веера, наведение, клавиатура и появление из стопки. */
(function () {
  var root = document.querySelector('.posters__grid');
  if (!root) return;
  var cards = Array.prototype.slice.call(root.querySelectorAll('.poster'));
  var N = cards.length;
  if (!N) return;

  // ---- Подкрутка ----
  var CFG = {
    maxCard: 150,        // максимальная ширина карточки, px
    cardRatio: 0.16,     // ширина карточки = ширина блока * это
    cardRatioMobile: 0.21, // то же при ширине блока < 600
    minCard: 52,         // минимальная ширина карточки
    rotDesktop: 24,      // угол крайних карточек, градусы
    rotMobile: 20,       // то же при ширине блока < 600
    arc: 0.2,            // насколько края веера «опущены» (доля ширины карточки)
    hoverLift: 0.26,     // подъём карточки под курсором (доля ширины)
    hoverScale: 1.08,    // увеличение карточки под курсором
    hoverPush: 0.62,     // насколько соседи разъезжаются при наведении (доля ширины)
    enterStep: 50,       // шаг между карточками при появлении слева направо, мс (длительность и сдвиг — в css)
    gapTop: 60           // отступ от описания до самого высокого края карточек в покое, px
  };

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var RATIO = 1697 / 1199, RAD = Math.PI / 180;
  document.documentElement.classList.add('js-fan');

  var label = document.createElement('div');
  label.className = 'fan__label';
  label.setAttribute('aria-hidden', 'true');
  root.appendChild(label);

  var hov = -1, W = 0, introDone = false;
  var G = { cw: 150, ch: 212, rot: 24, pad: 60, H: 0, rest: [] };

  function ext(r) { // полуширина повёрнутой карточки
    var a = Math.abs(r) * RAD;
    return G.cw / 2 * Math.cos(a) + G.ch * Math.sin(a);
  }

  function layout() {
    W = root.clientWidth;
    if (!W) return;
    var cw = Math.max(CFG.minCard, Math.min(CFG.maxCard, Math.round(W * (W < 600 ? CFG.cardRatioMobile : CFG.cardRatio))));
    var ch = cw * RATIO, rot = W < 600 ? CFG.rotMobile : CFG.rotDesktop, half = W / 2;
    G.cw = cw; G.ch = ch; G.rot = rot;
    var spread = half - ext(rot) - 4;
    var pad = Math.round(cw * CFG.arc + cw / 2 * Math.sin(rot * RAD) + 34);

    // позиции «в покое» и самый высокий край веера
    var restTop = 0;
    G.rest = cards.map(function (c, i) {
      var t = (i - (N - 1) / 2) / ((N - 1) / 2);
      var o = { x: t * spread, y: t * t * cw * CFG.arc, r: t * rot };
      var a = Math.abs(o.r) * RAD;
      restTop = Math.max(restTop, ch * Math.cos(a) + cw / 2 * Math.sin(a) - o.y);
      return o;
    });
    G.pad = pad;
    G.H = Math.round(restTop + CFG.gapTop + pad);
    root.style.setProperty('--cw', cw + 'px');
    root.style.setProperty('--fan-pad', pad + 'px');
    root.style.setProperty('--fan-h', G.H + 'px');

    cards.forEach(function (c, i) {
      var o = G.rest[i], x = o.x, y = o.y, r = o.r, s = 1, z = i;
      if (introDone && hov >= 0) {
        var d = i - hov;
        if (d === 0) { y -= cw * CFG.hoverLift; r *= 0.15; s = CFG.hoverScale; z = 50; }
        else { x += (d > 0 ? 1 : -1) * cw * CFG.hoverPush / (Math.abs(d) * 0.75 + 0.25); }
      }
      var lim = half - ext(r) * s - 2;     // не выходим за края блока
      if (Math.abs(x) > lim) x = x < 0 ? -lim : lim;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + r.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
      c.style.zIndex = z;
    });
    label.textContent = hov >= 0 ? cards[hov].getAttribute('aria-label') : '';
  }

  // Какая карточка лежит под точкой в покое (верхняя видимая = с большим номером).
  // Считаем по позициям «в покое», чтобы раскрытие не дрожало, когда карточки разъезжаются.
  function hitRest(px, py) {
    var rect = root.getBoundingClientRect();
    var bx = rect.left + W / 2, by = rect.bottom - G.pad;
    for (var i = N - 1; i >= 0; i--) {
      var o = G.rest[i], dx = px - (bx + o.x), dy = py - (by + o.y);
      var a = -o.r * RAD, c = Math.cos(a), s = Math.sin(a);
      var lx = dx * c - dy * s, ly = dx * s + dy * c;
      if (Math.abs(lx) <= G.cw / 2 && ly <= 0 && ly >= -G.ch) return i;
    }
    return -1;
  }
  function inCurrent(px, py) { // курсор всё ещё над поднятой карточкой
    if (hov < 0) return false;
    var r = cards[hov].getBoundingClientRect();
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  }
  var raf = 0, lx = 0, ly = 0;
  function onMove(e) {
    if (e.pointerType === 'touch' || !introDone) return;
    lx = e.clientX; ly = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var h = hitRest(lx, ly);
      if (h < 0 && inCurrent(lx, ly)) h = hov;
      if (h !== hov) { hov = h; layout(); }
    });
  }
  document.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { if (hov !== -1) { hov = -1; layout(); } });

  // Клавиатура: фокус раскрывает веер, стрелки перемещают фокус
  cards.forEach(function (c, i) {
    c.addEventListener('focus', function () {
      var kb = true;
      try { kb = c.matches(':focus-visible'); } catch (_) {}
      if (kb && introDone) { hov = i; layout(); }
    });
    c.addEventListener('blur', function () { if (hov === i) { hov = -1; layout(); } });
  });
  root.addEventListener('keydown', function (e) {
    var lb = document.getElementById('poster-lightbox');
    if (lb && !lb.hidden) return;
    var k = e.key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End') return;
    var cur = cards.indexOf(document.activeElement);
    if (cur < 0) return;
    var n = k === 'Home' ? 0 : k === 'End' ? N - 1 : Math.max(0, Math.min(N - 1, cur + (k === 'ArrowRight' ? 1 : -1)));
    e.preventDefault();
    cards[n].focus();
  });

  // Появление слева направо, один раз
  function intro() {
    if (introDone) return;
    introDone = true;
    root.classList.remove('is-stack');
  }
  var lastW = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { if (root.clientWidth !== lastW) { lastW = root.clientWidth; layout(); } }).observe(root);
  } else {
    window.addEventListener('resize', layout);
  }
  if (RM.matches || !('IntersectionObserver' in window)) {
    introDone = true;
    layout();
  } else {
    cards.forEach(function (c, i) { c.style.setProperty('--d', (i * CFG.enterStep) + 'ms'); });
    root.classList.add('is-stack');
    layout();
    var io = new IntersectionObserver(function (en) {
      if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); intro(); }
    }, { threshold: 0.2 });
    io.observe(root);
  }
})();
