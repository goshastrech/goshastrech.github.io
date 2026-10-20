/* «Обо мне»: построчное проявление текста при прокрутке.
   Логика 1-в-1 как в Big Board (.about-content): слова -> строки по реальному переносу -> проявление.
   Двуязычность: разбиваем оба спана, строки считаем только по видимому. */
(function () {
  var texts = document.querySelectorAll('.about-me__big');
  if (!texts.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('js-reveal-about');

  // 1. каждое слово -> <span class="w">
  var words = [];
  function wrapText(node) {
    if (node.nodeType === 3) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/([ \t\r\n\f]+)/).forEach(function (part) {
        if (!part) return;
        if (/^[ \t\r\n\f]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'w'; w.textContent = part;
        words.push(w); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1) {
      // ссылки, картинки и svg-значки не режем на слова: целиком проявляются как одно «слово»
      var tag = node.tagName.toLowerCase();
      if (tag === 'a' || tag === 'img' || tag === 'svg' || node.classList.contains('about-ico')) {
        node.classList.add('w'); words.push(node); return;
      }
      Array.prototype.slice.call(node.childNodes).forEach(wrapText);
    }
  }
  texts.forEach(wrapText);
  texts.forEach(function (t) { t.classList.add('is-split'); });   // слова обёрнуты — блок можно показывать (до этого он скрыт CSS, без «вспышки»)
  // блок «фото + имя» (если есть на странице) проявляется первой строкой, как текст ниже
  var idBlock = document.querySelector('.about-me .about-id');
  if (idBlock) { idBlock.classList.add('w'); words.unshift(idBlock); }
  // нижний ряд ссылок проявляется как последняя «строка» после абзацев (без JS он просто виден)
  var linksRow = document.querySelector('.about-me .about-links');
  if (linksRow) { linksRow.classList.add('w'); words.push(linksRow); }

  // 2. группировка видимых слов по строкам (скрытые display:none дают пустой rect — пропускаем)
  // значки (img/svg) в разных браузерах садятся на строку по-разному (baseline, высота) — свою строку они бы получили
  // и проявились раньше текста. Поэтому строку значка берём у ближайшего соседнего слова, а не у самого значка
  function isIcon(w) { var t = w.tagName.toLowerCase(); return t === 'img' || t === 'svg'; }
  function textNeighbor(idx) {
    for (var d = 1; d < 4; d++) {
      var a = words[idx - d], b = words[idx + d];
      if (a && !isIcon(a) && a.getClientRects().length && a.getBoundingClientRect().height) return a;
      if (b && !isIcon(b) && b.getClientRects().length && b.getBoundingClientRect().height) return b;
    }
    return null;
  }
  var lines = [];
  function buildLines() {
    var rows = [];
    words.forEach(function (w, idx) {
      if (!w.getClientRects().length) return; // display:none у неактивного языка (у svg нет offsetParent, поэтому проверяем rects)
      var ref = isIcon(w) ? (textNeighbor(idx) || w) : w;
      var r = ref.getBoundingClientRect();
      if (!r.height) return;
      var y = Math.round(r.top + r.height / 2 + window.scrollY);
      var last = rows[rows.length - 1];
      if (last && Math.abs(last.y - y) < r.height * 0.6) last.words.push(w);
      else rows.push({ y: y, words: [w] });
    });
    lines = rows;
  }

  // 3. проявляем строки выше линии-триггера (90% высоты окна), по очереди с шагом 110 мс
  var ticking = false;
  function check() {
    ticking = false;
    if (!ready) return;
    var trigger = window.scrollY + window.innerHeight * 0.9;
    var queue = 0;
    lines.forEach(function (line) {
      if (line.y > trigger) return;
      var fresh = line.words.filter(function (w) { return !w.classList.contains('in'); });
      if (!fresh.length) return;
      var delay = queue++ * 110;
      // внутри строки слова/ссылки/скобки/значки идут друг за другом (шаг 35 мс) в порядке чтения
      fresh.forEach(function (w, i) {
        var d = delay + i * 35;
        w.style.transitionDelay = d + 'ms'; w.classList.add('in');
        // после проявления задержку убираем, чтобы hover у ссылок срабатывал сразу
        setTimeout(function () { w.style.transitionDelay = ''; }, d + 800);
      });
    });
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  // пока шрифты не загрузились, переносы строк «плавают»: проявлять рано нельзя —
  // значки (Midjourney, Banana…) успевали проявиться на старой раскладке и оставались видны, когда текст уезжал вниз
  var ready = !(document.fonts && document.fonts.ready);
  function init() { buildLines(); if (ready) check(); }
  function go() { ready = true; init(); }

  init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(go); });
  setTimeout(go, 1500);   // запасной вариант, если шрифты не отвечают
  window.addEventListener('load', function () { if (ready) init(); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { buildLines(); schedule(); });
  // перенос строк может «устояться» чуть позже (смена языка, шрифты): следим за высотой блока
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { buildLines(); schedule(); });
    ro.observe(document.querySelector('.about-me'));
  }
  // переключение EN/RU: меняется data-lang у <html> -> пересчитать строки видимого языка
  if (window.MutationObserver) {
    new MutationObserver(function () { requestAnimationFrame(init); setTimeout(init, 350); })
      .observe(root, { attributes: true, attributeFilter: ['data-lang'] });
  }
})();
