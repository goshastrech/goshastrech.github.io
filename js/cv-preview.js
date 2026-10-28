/* Резюме: при наведении на название проекта рядом с курсором показывается превью (баннер или видео с главной).
   Только для устройств с мышью; при «уменьшении движения» видео не запускается (остаётся картинка). */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var links = document.querySelectorAll('[data-preview]');
  if (!links.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // что показывать для каждого проекта: картинка (постер) и, если есть, видео — те же файлы, что на главной
  var MEDIA = {
    'trady':      { img: 'img/posters-video/trady-home-loop.webp', video: 'img/trady_home_loop_2026-10-05_17-16.mp4' },
    'polyranger': { img: 'img/posters-video/polyranger-home.webp', video: 'img/polyranger_home.mp4' },
    'big-board':  { img: 'img/big-board-banner.webp' },
    'c3tch':      { img: 'img/posters-video/c3tch-home.webp', video: 'img/c3tch_home.mp4' },
    'ftlb':       { img: 'img/ftlb-banner-closer.webp' },
    'shiro':      { img: 'img/strip/shiro.webp' },   // просто логотип на красном фоне
    'cryptorsy':  { img: 'img/Cryptorsy cover.webp', video: 'img/cryptorsy_banner.mp4' }
  };

  var box = document.createElement('div');
  box.className = 'cv-preview';
  box.setAttribute('aria-hidden', 'true');
  var img = document.createElement('img');
  img.alt = '';
  var vid = document.createElement('video');
  vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'none';
  vid.addEventListener('playing', function () { vid.classList.add('is-playing'); });
  box.appendChild(img); box.appendChild(vid);
  document.body.appendChild(box);

  var mx = 0, my = 0, raf = 0;
  function place() {
    raf = 0;
    var w = box.offsetWidth, h = box.offsetHeight, pad = 16, gap = 26;
    var x = mx + gap, y = my + gap;
    if (x + w > innerWidth - pad) x = mx - w - gap;     // у правого края — слева от курсора
    if (y + h > innerHeight - pad) y = innerHeight - pad - h;
    box.style.transform = 'translate3d(' + Math.max(pad, x) + 'px,' + Math.max(pad, y) + 'px,0)';
  }
  function move(e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(place); }

  function show(link, e) {
    var m = MEDIA[link.getAttribute('data-preview')];
    if (!m) return;
    img.src = encodeURI(m.img);
    vid.classList.remove('is-playing');
    vid.removeAttribute('src');
    if (m.video && !reduce) { vid.src = encodeURI(m.video); var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    if (e && e.clientX !== undefined) { mx = e.clientX; my = e.clientY; }
    else { var r = link.getBoundingClientRect(); mx = r.right; my = r.top; }
    place();
    box.classList.add('is-on');
  }
  function hide() {
    box.classList.remove('is-on');
    vid.pause(); vid.removeAttribute('src'); vid.load();
  }

  // превью показываем только когда ссылка уже проявилась: пока текст «Обо мне» появляется, курсор может стоять над ещё невидимым названием
  function visible(a) { return parseFloat(getComputedStyle(a).opacity) > 0.9 && !!a.closest('.w') === a.classList.contains('in') || (!a.classList.contains('w') && parseFloat(getComputedStyle(a).opacity) > 0.9); }
  var active = null;

  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('mouseenter', function (e) { if (visible(a)) { active = a; show(a, e); } });
    a.addEventListener('mousemove', function (e) {
      if (active === a) { move(e); return; }
      if (visible(a)) { active = a; show(a, e); }   // курсор стоял на месте, ссылка проявилась, мышь сдвинули — показываем
    });
    a.addEventListener('mouseleave', function () { active = null; hide(); });
    a.addEventListener('focus', function () { if (visible(a)) { active = a; show(a); } });   // клавиатура: превью рядом со ссылкой
    a.addEventListener('blur', function () { active = null; hide(); });
  });
})();
