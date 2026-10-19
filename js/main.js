// Scroll animations — запускает .fade-in когда элемент появляется в viewport
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  },
  // threshold 0: срабатывает, как только верх блока вошёл в окно (у очень высоких блоков долю 8% не набрать)
  { threshold: 0, rootMargin: '0px 0px -8% 0px' }
);

document.querySelectorAll('.fade-in').forEach((el) => {
  if (reduceMotion) el.classList.add('visible'); // без анимации — показываем сразу
  else observer.observe(el);
});

// Project rail — боковая навигация по проектам, подсветка активного при скролле
const projectRail = document.querySelector('.project-rail');
if (projectRail) {
  const dots = Array.from(projectRail.querySelectorAll('.project-rail__dot'));
  const sections = dots
    .map((dot) => document.getElementById(dot.dataset.target))
    .filter(Boolean);

  const setActive = (id) => {
    dots.forEach((dot) => {
      dot.classList.toggle('project-rail__dot--active', dot.dataset.target === id);
    });
  };

  if (sections.length) setActive(sections[0].id);

  const railObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => railObserver.observe(section));
}

// Header blur on scroll
const header = document.querySelector('.header');
let headerScrollTicking = false;
window.addEventListener('scroll', () => {
  if (headerScrollTicking) return;
  headerScrollTicking = true;
  requestAnimationFrame(() => {
    header.classList.toggle('header--scrolled', window.scrollY > 8);
    headerScrollTicking = false;
  });
}, { passive: true });

// Skeleton-заглушка для фото проектов, пока картинка не загрузилась
document.querySelectorAll('.card__image img').forEach((img) => {
  const wrapper = img.closest('.card__image');
  if (!wrapper) return;

  const markLoaded = () => {
    wrapper.classList.remove('is-loading');
    img.classList.add('is-loaded');
  };

  if (img.complete && img.naturalWidth > 0) {
    img.classList.add('is-loaded');
  } else {
    wrapper.classList.add('is-loading');
    img.addEventListener('load', markLoaded, { once: true });
  }
});

// Stack demo — клик по задней карточке меняет её местами с главной
const stack = document.querySelector('.stack');
if (stack) {
  const posClasses = ['stack__card--main', 'stack__card--back-1', 'stack__card--back-2', 'stack__card--back-3'];

  stack.querySelectorAll('.stack__card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('stack__card--main')) return;

      const mainCard = stack.querySelector('.stack__card--main');
      const clickedPosClass = posClasses.find((c) => card.classList.contains(c));

      mainCard.classList.remove('stack__card--main');
      mainCard.classList.add(clickedPosClass);

      card.classList.remove(clickedPosClass);
      card.classList.add('stack__card--main');
    });
  });
}

// Typing-эффект на карточке "My Stack" — строки печатаются посимвольно при появлении
const codeCard = document.querySelector('.stack-code .code-card');
if (codeCard) {
  const lines = Array.from(codeCard.querySelectorAll('.code-line__content'));

  const splitIntoChars = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'ch';
          span.textContent = ch;
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('cursor-blink')) {
        const text = child.textContent;
        child.textContent = '';
        [...text].forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'ch';
          span.textContent = ch;
          child.appendChild(span);
        });
      }
    });
  };

  lines.forEach(splitIntoChars);

  const cursor = codeCard.querySelector('.cursor-blink');

  const typeLine = (contentEl, msPerChar) => {
    const chars = contentEl.querySelectorAll('.ch');
    chars.forEach((c, i) => {
      setTimeout(() => {
        c.classList.add('visible');
        if (cursor) c.insertAdjacentElement('afterend', cursor);
      }, i * msPerChar);
    });
  };

  const msPerChar = 18;
  const linePause = 100;

  const runTyping = () => {
    let delay = 0;

    // курсор стартует перед первым символом первой строки
    if (cursor && lines[0]) lines[0].insertBefore(cursor, lines[0].firstChild);

    lines.forEach((line) => {
      setTimeout(() => typeLine(line, msPerChar), delay);
      delay += line.querySelectorAll('.ch').length * msPerChar + linePause;
    });

    return delay; // сколько всего займёт печать целиком
  };

  const codeObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runTyping();
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  codeObserver.observe(codeCard);
}

// Posters — клик по постеру открывает его по центру экрана на затемнённом фоне
const posterGrid = document.querySelector('.posters__grid');
const lightbox = document.getElementById('poster-lightbox');
if (posterGrid && lightbox) {
  const frame = lightbox.querySelector('.poster-lightbox__frame');
  const closeBtn = lightbox.querySelector('.poster-lightbox__close');
  const titleEl = lightbox.querySelector('.poster-lightbox__title');

  // В веере лежат лёгкие миниатюры (400px, ~30 КБ) — они грузятся лениво, когда блок подъезжает к экрану.
  // Полный постер (1199px, ~380 КБ) грузится только при открытии просмотра. Всё как слои в Figma:
  // в списке — превью, при открытии — оригинал.
  const THUMB_W = 400, THUMB_H = 566;
  posterGrid.querySelectorAll('.poster').forEach((btn) => {
    const img = new Image();
    img.alt = btn.getAttribute('aria-label');
    img.width = THUMB_W;
    img.height = THUMB_H;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => { img.remove(); if (!btn.firstChild) btn.innerHTML = '<span class="poster__ph"></span>'; };
    img.src = `img/posters/thumbs/${btn.dataset.slug}.webp`;
    btn.replaceChildren(img);
  });

  const posters = Array.from(posterGrid.querySelectorAll('.poster'));
  let current = 0;

  // Полные картинки: кэш по slug, чтобы соседние постеры были готовы заранее
  const fullCache = new Map();
  const fullSrc = (btn) => `img/posters/${btn.dataset.slug}.webp`;
  const preloadFull = (btn) => {
    if (!btn) return null;
    let im = fullCache.get(btn.dataset.slug);
    if (!im) {
      im = new Image();
      im.decoding = 'async';
      im.src = fullSrc(btn);
      fullCache.set(btn.dataset.slug, im);
    }
    return im;
  };

  const render = (index) => {
    current = (index + posters.length) % posters.length;
    const btn = posters[current];
    const thumb = btn.querySelector('img');
    if (thumb) {
      // сначала показываем миниатюру (растянутую до размера просмотра), потом подменяем на полную без мигания
      const view = new Image();
      view.alt = thumb.alt;
      view.className = 'poster-lightbox__img';
      view.src = thumb.currentSrc || thumb.src;
      frame.replaceChildren(view);
      const full = preloadFull(btn);
      const swap = () => {
        if (posters[current] !== btn || view.parentNode !== frame) return;
        view.src = full.src;
      };
      if (full.complete && full.naturalWidth) swap();
      else if (full.decode) full.decode().then(swap, () => {});
      else full.addEventListener('load', swap, { once: true });
      // листание станет мгновенным: заранее тянем соседей
      const idle = () => {
        preloadFull(posters[(current + 1) % posters.length]);
        preloadFull(posters[(current - 1 + posters.length) % posters.length]);
      };
      if (full.complete) idle(); else full.addEventListener('load', idle, { once: true });
    } else {
      frame.replaceChildren(document.createElement('span'));
    }
    titleEl.textContent = btn.getAttribute('aria-label');
  };

  // Стрелки, клавиши и свайп: старый постер гаснет, затем проявляется новый
  const go = (step) => {
    lightbox.classList.add('is-swapping');
    setTimeout(() => {
      render(current + step);
      lightbox.classList.remove('is-swapping');
    }, 150);
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lightbox.hidden = true; frame.replaceChildren(); }, 250);
    posters[current].focus();
  };

  posterGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.poster');
    if (!btn) return;
    lightbox.classList.remove('is-swapping');
    render(posters.indexOf(btn));
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    closeBtn.focus();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === closeBtn) close();
    else if (e.target.closest('.poster-lightbox__nav--prev')) go(-1);
    else if (e.target.closest('.poster-lightbox__nav--next')) go(1);
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  let touchX = null;
  lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });
}

// Видео играют только когда видны на экране: иначе браузер декодирует все ролики сразу и страница подлагивает.
// У роликов preload="none" + poster: файл не качается, пока ролик не приблизится к экрану (запас 200px),
// play() сам запускает загрузку. Ушло с экрана — пауза.
// Вместо autoplay в HTML стоит data-autoplay: Chrome с атрибутом autoplay качает видео сразу, игнорируя preload="none".
const autoVideos = document.querySelectorAll('video[autoplay], video[data-autoplay]');
if (autoVideos.length && reduceMotion) {
  // reduced motion: ролики не запускаем, остаётся постер
  autoVideos.forEach((video) => { video.removeAttribute('autoplay'); video.pause(); });
} else if (autoVideos.length && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    });
  }, { threshold: 0.1, rootMargin: '200px 0px' });

  autoVideos.forEach((video) => videoObserver.observe(video));
}

// Бесконечные анимации (мигающий курсор, «скелетон»-мерцание) стоят на паузе, пока элемент вне экрана
const loopAnimEls = document.querySelectorAll('.cursor-blink, .card__image.is-loading');
if (loopAnimEls.length && 'IntersectionObserver' in window) {
  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  });
  loopAnimEls.forEach((el) => animObserver.observe(el));
}

// Пока открыт просмотр (лайтбокс), колесо мыши и свайп не прокручивают страницу за ним.
// Исключение: внутри самого окна можно прокручивать широкую картинку или экран телефона.
(function () {
  function blocked(e) {
    var box = document.querySelector('.poster-lightbox:not([hidden])');
    if (!box || !box.contains(e.target)) return false;
    return !e.target.closest('.is-wide, .is-scrollphone, .lb-phone-screen');
  }
  ['wheel', 'touchmove'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (blocked(e)) e.preventDefault(); }, { passive: false });
  });
})();

// «Другие проекты»: лента по кругу. Стрелки листают на одну карточку, на краю перескакивают в другой конец
// (на любом проекте можно дойти до всех остальных в обе стороны); мышью ленту можно тянуть, на телефоне — свайп.
(function () {
  var box = document.querySelector('.more-projects');
  if (!box) return;
  var track = box.querySelector('.more-projects__track');
  var prev = box.querySelector('[data-dir="-1"]'), next = box.querySelector('[data-dir="1"]');
  function step() { var c = track.querySelector('.more-projects__card'); return c ? c.getBoundingClientRect().width + 20 : 300; }
  function maxLeft() { return track.scrollWidth - track.clientWidth; }
  function go(dir) {
    var x = track.scrollLeft, max = maxLeft();
    if (dir > 0 && x >= max - 4) { track.scrollTo({ left: 0, behavior: 'smooth' }); return; }
    if (dir < 0 && x <= 4) { track.scrollTo({ left: max, behavior: 'smooth' }); return; }
    track.scrollBy({ left: step() * dir, behavior: 'smooth' });
  }
  [prev, next].forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.dir); }); });
  // перетаскивание мышью (на тач-экранах работает обычная прокрутка пальцем)
  var down = false, startX = 0, startLeft = 0, moved = false;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false; track.classList.remove('is-dragging');
    if (moved) { var snap = Math.round(track.scrollLeft / step()) * step(); track.scrollTo({ left: snap, behavior: 'smooth' }); }
  });
  track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();
