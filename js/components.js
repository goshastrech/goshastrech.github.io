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
        <span class="badge-version__tooltip-line"><span data-i18n-en>Redesigned Jul 5, 2026</span><span data-i18n-ru>Редизайн 5 июля 2026</span></span>
      </span>
    </span>
  </div>
  <div class="header__center">
    <span class="header__timer" id="header-timer">00:00:00</span>
  </div>
  <nav class="header__right">
    <a href="cv.html"><span data-i18n-en>CV</span><span data-i18n-ru>Резюме</span></a>
    <a href="https://www.linkedin.com/in/heorhi-strechan-09a1552a1/" target="_blank" rel="noopener noreferrer">Linkedin</a>
    <a href="https://dribbble.com/HeorhiStrechan" target="_blank" rel="noopener noreferrer">Dribbble</a>
    <button type="button" class="lang-toggle" data-lang-toggle>RU</button>
  </nav>
  <div class="header__progress" id="header-progress"></div>
</header>
`;

const FOOTER = `
<footer class="footer">
  <p class="footer__prompt">heorhi@portfolio <span class="footer__prompt-muted">~</span> % <span class="footer__prompt-muted">whoami</span><span class="cursor-blink"></span></p>
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
