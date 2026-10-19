/* ============================================================
   COMPONENTS — хедер и футер определены здесь один раз.
   Чтобы изменить навигацию — редактируй только этот файл.
   ============================================================ */

const HEADER = `
<header class="header">
  <div class="header__left">
    <a href="index.html" class="header__name">Heorhi Strechan</a>
    <span class="badge-version">
      <span class="badge-version__text">v1.0</span>
      <img src="img/venyl.svg" width="18" height="18" alt="" />
      <span class="badge-version__tooltip">
        <span class="badge-version__tooltip-line"><span data-i18n-en>Redesigned Oct 2026</span><span data-i18n-ru>Редизайн октябрь 2026</span></span>
      </span>
    </span>
  </div>
  <div class="header__center">
    <span class="header__timer" id="header-timer">00:00:00</span>
  </div>
  <button type="button" class="header__burger" aria-label="Menu" aria-expanded="false" aria-controls="header-menu"><span></span><span></span><span></span></button>
  <nav class="header__right" id="header-menu">
    <a href="cv.html"><span data-i18n-en>CV</span><span data-i18n-ru>Резюме</span></a>
    <a href="https://www.linkedin.com/in/heorhi-strechan-09a1552a1/" target="_blank" rel="noopener noreferrer">Linkedin</a>
    <a href="https://dribbble.com/HeorhiStrechan" target="_blank" rel="noopener noreferrer">Dribbble</a>
    <a href="https://t.me/goshast11" target="_blank" rel="noopener noreferrer">Telegram</a>
    <button type="button" class="lang-toggle" data-lang-toggle>RU</button>
    <p class="menu-meta"><span class="menu-meta__badge">v1.0</span><span data-i18n-en>Redesigned Oct 2026</span><span data-i18n-ru>Редизайн октябрь 2026</span></p>
  </nav>
  <div class="header__progress" id="header-progress"></div>
</header>
`;

const FOOTER = `
<footer class="footer">
  <p class="footer__prompt">heorhi@portfolio <span class="footer__prompt-muted">~</span> % <span class="footer__prompt-muted">whoami</span><span class="cursor-blink"></span></p>
  <a href="https://t.me/goshast11" target="_blank" rel="noopener noreferrer" class="footer__write"><span data-i18n-en>Write me on Telegram</span><span data-i18n-ru>Написать мне в Telegram</span></a>
  <span class="footer__copy">// Portfolio ©2026</span>
</footer>
`;

const headerRoot = document.getElementById('header-root');
if (headerRoot) headerRoot.outerHTML = HEADER;

const footerRoot = document.getElementById('footer-root');
if (footerRoot) footerRoot.outerHTML = FOOTER;

// Session-таймер в хедере — считает время на сайте с момента загрузки страницы
// (не персистентно, сбрасывается при перезагрузке)
(() => {
  const timerEl = document.getElementById('header-timer');
  if (!timerEl) return;

  const start = Date.now();
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    timerEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  tick();
  setInterval(tick, 1000);
})();

// Переключатель языка (EN/RU) — кнопка показывает ТЕКУЩИЙ язык сайта,
// клик переключает на другой язык и меняет подпись. Выбор хранится в localStorage,
// применяется через атрибут data-lang на <html> и CSS-правила [data-i18n-en]/[data-i18n-ru]
(() => {
  const STORAGE_KEY = 'portfolio-lang';
  const btn = document.querySelector('[data-lang-toggle]');
  if (!btn) return;

  const applyLang = (lang) => {
    document.documentElement.setAttribute('data-lang', lang);
    btn.textContent = lang.toUpperCase();
  };

  const savedLang = localStorage.getItem(STORAGE_KEY);
  applyLang(savedLang === 'ru' ? 'ru' : 'en');

  btn.addEventListener('click', () => {
    const nextLang = document.documentElement.getAttribute('data-lang') === 'ru' ? 'en' : 'ru';
    localStorage.setItem(STORAGE_KEY, nextLang);
    applyLang(nextLang);
  });
})();

// Прогресс-бар скролла — тонкая полоса внизу хедера
(() => {
  const progressEl = document.getElementById('header-progress');
  if (!progressEl) return;

  const updateProgress = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
    progressEl.style.transform = `scaleX(${progress})`;
  };

  let progressTicking = false;
  window.addEventListener('scroll', () => {
    if (progressTicking) return;
    progressTicking = true;
    requestAnimationFrame(() => {
      updateProgress();
      progressTicking = false;
    });
  }, { passive: true });
  updateProgress();
})();

// Кнопка «Наверх»: появляется после прокрутки и плавно возвращает в начало страницы
(function () {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Back to top / Наверх');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);
  const update = () => btn.classList.toggle('is-visible', window.scrollY > 700);
  window.addEventListener('scroll', update, { passive: true });
  update();
  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();


// Мобильное меню: бургер открывает полноэкранную страницу со всеми ссылками шапки
(() => {
  const header = document.querySelector('.header');
  const burger = document.querySelector('.header__burger');
  if (!header || !burger) return;
  const setOpen = (open) => {
    header.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setOpen(!header.classList.contains('is-menu-open')));
  header.querySelectorAll('.header__right a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 641px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
})();
