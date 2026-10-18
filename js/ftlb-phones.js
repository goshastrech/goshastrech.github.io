// Подставляет img/ftlb/<data-shot>.(webp|png|jpg) в экран телефона.
// Если файла нет — остаётся тёмная заглушка. Работает и по file://.
(function () {
  const exts = ['webp', 'png', 'jpg'];
  document.querySelectorAll('.phone__screen[data-shot]').forEach((screen) => {
    const alt = screen.dataset.alt || '';
    const tryExt = (i) => {
      if (i >= exts.length) return;
      const img = new Image();
      img.alt = alt;
      img.draggable = false;
      img.onload = () => {
        screen.replaceChildren(img);
        // Прокручиваемым экранам добавляем неподвижную «шапку» (статус-бар + остров):
        // копия верха той же картинки, прилипшая к верху экрана (sticky).
        if (screen.getAttribute('role') === 'region') {
          const bar = document.createElement('div');
          bar.className = 'phone__bar';
          bar.setAttribute('aria-hidden', 'true');
          bar.style.backgroundImage = `url("${img.src}")`;
          screen.insertBefore(bar, img);
        }
      };
      img.onerror = () => tryExt(i + 1);
      img.src = `img/ftlb/${screen.dataset.shot}.${exts[i]}`;
    };
    tryExt(0);
  });
})();
