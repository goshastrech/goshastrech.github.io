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
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'w'; w.textContent = part;
        words.push(w); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1) {
      if (node.classList.contains('about-ico')) { node.classList.add('w'); words.push(node); return; }
      Array.prototype.slice.call(node.childNodes).forEach(wrapText);
    }
  }
  texts.forEach(wrapText);

  // 2. группировка видимых слов по строкам (скрытые display:none дают пустой rect — пропускаем)
  var lines = [];
  function buildLines() {
    var rows = [];
    words.forEach(function (w) {
      if (!w.offsetParent) return; // display:none у неактивного языка
      var r = w.getBoundingClientRect();
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
    var trigger = window.scrollY + window.innerHeight * 0.9;
    var queue = 0;
    lines.forEach(function (line) {
      if (line.y > trigger) return;
      var fresh = line.words.filter(function (w) { return !w.classList.contains('in'); });
      if (!fresh.length) return;
      var delay = queue++ * 110;
      fresh.forEach(function (w) { w.style.transitionDelay = delay + 'ms'; w.classList.add('in'); });
    });
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  function init() { buildLines(); check(); }

  init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  window.addEventListener('load', init);
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
