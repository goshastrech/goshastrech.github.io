/* Лента проектов: бегущая строка.
   - JS дублирует набор карточек (клоны скрыты от скринридеров и из Tab-порядка)
     и включает CSS-анимацию (класс is-marquee). Сама анимация — в css/project-strip.css.
   - Замедление: при наведении на карточку, фокусе внутри и касании скорость плавно падает до ~25% (лента не останавливается).
   - prefers-reduced-motion: клонов нет, движения нет, обычная горизонтальная прокрутка.
   - Без JS лента — обычный CSS-скролл, якоря работают. */
(function () {
  var nav = document.querySelector('.project-strip__nav');
  var list = nav && nav.querySelector('.project-strip__list');
  if (!nav || !list) return;

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var clones = [];

  function start() {
    if (nav.classList.contains('is-marquee')) return;
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(c.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', '-1'); });
      list.appendChild(c);
      clones.push(c);
    });
    nav.scrollLeft = 0;
    nav.classList.add('is-marquee');
  }
  function stop() {
    nav.classList.remove('is-marquee');
    clones.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
    clones = [];
  }
  function sync() { if (mq && mq.matches) stop(); else start(); }
  sync();
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
  }

  /* ---- плавное замедление вместо паузы ----
     Скорость анимации меняем через Web Animations API (playbackRate) и каждый кадр подтягиваем к цели:
     курсор на карточке / фокус внутри / палец на ленте → цель SLOW, иначе 1. */
  var SLOW = 0.25;        /* во сколько раз медленнее при наведении (0.25 = 25% скорости) */
  var EASE = 0.06;        /* плавность: меньше = мягче и дольше */
  var rate = 1, target = 1, raf = 0, touching = false, hovering = false;

  function getAnim() {
    var anims = list.getAnimations ? list.getAnimations() : [];
    return anims.length ? anims[0] : null;
  }
  function setTarget() {
    target = (hovering || touching || nav.matches(':focus-within')) ? SLOW : 1;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    raf = 0;
    var a = getAnim();
    if (!a) return;
    rate += (target - rate) * EASE;
    if (Math.abs(target - rate) < 0.003) rate = target;
    a.playbackRate = rate;
    if (rate !== target) raf = requestAnimationFrame(tick);
  }

  list.addEventListener('mouseover', function (e) {
    hovering = !!(e.target.closest && e.target.closest('.project-strip__card'));
    setTarget();
  });
  nav.addEventListener('mouseleave', function () { hovering = false; setTarget(); });
  nav.addEventListener('focusin', setTarget);
  nav.addEventListener('focusout', function () { setTimeout(setTarget, 0); });

  var holdTimer = null;
  nav.addEventListener('touchstart', function () { clearTimeout(holdTimer); touching = true; setTarget(); }, { passive: true });
  function release() {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { touching = false; setTarget(); }, 1500);
  }
  nav.addEventListener('touchend', release, { passive: true });
  nav.addEventListener('touchcancel', release, { passive: true });

  /* ---- в режиме обычной прокрутки: сфокусированную карточку центрируем ---- */
  nav.addEventListener('focusin', function (e) {
    if (nav.classList.contains('is-marquee')) return;
    var li = e.target.closest && e.target.closest('li');
    if (!li) return;
    var left = li.offsetLeft - (nav.clientWidth - li.offsetWidth) / 2;
    nav.scrollTo({ left: left, behavior: 'smooth' });
  });
})();
