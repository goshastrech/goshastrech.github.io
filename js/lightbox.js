// Lightbox для страниц кейсов: клик по экрану открывает его по центру на затемнённом фоне.
// Любой элемент с data-lb-group="имя" (и data-lb-title, data-lb-src по желанию) становится кликабельным;
// стрелки, клавиши ← → и свайп листают экраны внутри одной группы.
(function () {
  const items = Array.from(document.querySelectorAll('[data-lb-group]'));
  if (!items.length) return;

  const lb = document.createElement('div');
  lb.className = 'poster-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Screen preview');
  lb.hidden = true;
  lb.innerHTML =
    '<button type="button" class="poster-lightbox__close" aria-label="Close">✕</button>' +
    '<button type="button" class="poster-lightbox__nav poster-lightbox__nav--prev" aria-label="Previous">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<button type="button" class="poster-lightbox__nav poster-lightbox__nav--next" aria-label="Next">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button>' +
    '<p class="poster-lightbox__title"></p>' +
    '<div class="poster-lightbox__frame"></div>';
  document.body.appendChild(lb);

  const frame = lb.querySelector('.poster-lightbox__frame');
  const titleEl = lb.querySelector('.poster-lightbox__title');
  const closeBtn = lb.querySelector('.poster-lightbox__close');
  const prevBtn = lb.querySelector('.poster-lightbox__nav--prev');
  const nextBtn = lb.querySelector('.poster-lightbox__nav--next');

  let group = [];
  let current = 0;
  let opener = null; // элемент, открывший окно: туда вернём фокус
  const mqTablet = window.matchMedia('(max-width: 1024px)');

  // подпись: русская (data-lb-title-ru) при html[lang=ru], иначе data-lb-title
  const titleOf = (item) => {
    const ru = document.documentElement.lang === 'ru' && item.dataset.lbTitleRu;
    return ru || item.dataset.lbTitle || '';
  };

  // Стрелки стоят у краёв картинки: ширину берём у самой картинки
  const syncWidth = (img) => {
    const apply = () => lb.style.setProperty('--poster-w', frame.offsetWidth + 'px');
    if (img.tagName === 'VIDEO') {
      if (img.readyState >= 1) apply(); else img.addEventListener('loadedmetadata', apply, { once: true });
    } else if (img.complete) apply(); else img.addEventListener('load', apply, { once: true });
  };

  const render = (index) => {
    current = (index + group.length) % group.length;
    const item = group[current];
    const itemVideo = item.querySelector('video');
    let img;
    if (itemVideo && !item.dataset.lbSrc) {
      // экран-видео: такой же <video> в рамке просмотра
      img = document.createElement('video');
      img.src = itemVideo.getAttribute('src');
      if (itemVideo.getAttribute('poster')) img.poster = itemVideo.getAttribute('poster');
      img.autoplay = img.loop = img.muted = img.playsInline = true;
      img.setAttribute('autoplay', ''); img.setAttribute('loop', ''); img.setAttribute('muted', ''); img.setAttribute('playsinline', '');
      img.setAttribute('aria-label', titleOf(item));
      img.play().catch(() => {});
    } else {
      const source = item.dataset.lbSrc || item.querySelector('img').getAttribute('src');
      img = new Image();
      img.src = source;
      img.alt = titleOf(item);
    }
    // длинный мобильный экран (C3tch): корпус iPhone фиксированной высоты, экран внутри листается
    const scrollPhone = item.dataset.lbGroup === 'c3tch-mobile';
    if (scrollPhone) {
      const screen = document.createElement('div');
      screen.className = 'lb-phone-screen';
      screen.appendChild(img);
      frame.replaceChildren(screen);
    } else {
      frame.replaceChildren(img);
    }
    frame.classList.toggle('is-scrollphone', scrollPhone);
    frame.classList.toggle('is-clip', item.dataset.lbKind === 'clip'); // вертикальный ролик (Shiro)
    frame.classList.toggle('is-banner', item.dataset.lbKind === 'banner'); // горизонтальный баннер (Shiro)
    frame.classList.toggle('is-phone', item.classList.contains('iphone')); // экран телефона открываем в корпусе iPhone
    frame.classList.toggle('iphone--notch', item.classList.contains('iphone--notch'));
    frame.classList.toggle('iphone--light', item.classList.contains('iphone--light'));
    frame.classList.toggle('iphone--dark', item.classList.contains('iphone--dark'));
    titleEl.textContent = titleOf(item);
    lb.setAttribute('aria-label', titleOf(item) || 'Screen preview');
    // альбомная картинка на планшете/телефоне: окно прокручивается по горизонтали (стили в css)
    frame.classList.remove('is-wide');
    const special = scrollPhone || frame.classList.contains('is-clip') || frame.classList.contains('is-banner') || frame.classList.contains('is-phone');
    if (img.tagName === 'IMG' && !special) {
      const markWide = () => {
        if (frame.contains(img) && mqTablet.matches && img.naturalHeight && img.naturalWidth / img.naturalHeight > 1.2) frame.classList.add('is-wide');
      };
      if (img.complete) markWide(); else img.addEventListener('load', markWide, { once: true });
    }
    syncWidth(img);
  };

  const go = (step) => {
    if (group.length < 2) return;
    lb.classList.add('is-swapping');
    setTimeout(() => {
      render(current + step);
      lb.classList.remove('is-swapping');
    }, 150);
  };

  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; frame.replaceChildren(); }, 250);
    if (opener && document.contains(opener)) opener.focus(); else group[current].focus();
  };

  // элементы-кнопки (div с role=button) открываются и с клавиатуры
  items.forEach((el) => {
    if (el.getAttribute('role') === 'button') el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      opener = item;
      group = items.filter((el) => el.dataset.lbGroup === item.dataset.lbGroup);
      prevBtn.hidden = nextBtn.hidden = group.length < 2;
      lb.classList.remove('is-swapping');
      render(group.indexOf(item));
      lb.hidden = false;
      syncWidth(frame.querySelector('img, video')); // замер ширины только когда окно уже показано
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lb.classList.add('is-open'));
      closeBtn.focus();
    });
  });

  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target === closeBtn) close();
    else if (e.target.closest('.poster-lightbox__nav--prev')) go(-1);
    else if (e.target.closest('.poster-lightbox__nav--next')) go(1);
  });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Tab') {
      // фокус-ловушка: Tab ходит по кнопкам окна по кругу
      const f = Array.from(lb.querySelectorAll('button')).filter((b) => !b.hidden);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1)].focus();
    }
    else if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  window.addEventListener('resize', () => {
    const img = frame.querySelector('img, video');
    if (img && !lb.hidden) syncWidth(img);
  });
})();
