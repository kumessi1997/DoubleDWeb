/**
 * components.js — Shared Nav & Footer for doubledmedia.vn
 * Inject vào các trang qua:
 *   <div id="nav-placeholder"></div>
 *   <div id="footer-placeholder"></div>
 * Phải load TRƯỚC lang.js để i18n áp dụng lên cả component.
 */
(function () {

  // ─── NAV ──────────────────────────────────────────────────────────────────
  var NAV_HTML = `
<nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/5">
  <div class="flex h-16 max-w-7xl mr-auto ml-auto pr-6 pl-6 items-center justify-between">

    <a href="index.html" class="flex items-center gap-2 group">
      <img src="logo/logo doubled.svg" alt="Double D Media"
           class="h-8 w-auto transition-opacity hover:opacity-80" />
    </a>

    <!-- Desktop links -->
    <div class="hidden md:flex items-center space-x-8 text-[11px] font-medium tracking-widest text-neutral-400 uppercase">
      <a href="our-services.html" class="dd-nav-link hover:text-white transition-colors" data-nav="our-services" data-i18n="nav.services">Our Services</a>
      <a href="showcase.html"     class="dd-nav-link hover:text-white transition-colors" data-nav="showcase"     data-i18n="nav.showcase">Showcase</a>
      <a href="blog.html"         class="dd-nav-link hover:text-white transition-colors" data-nav="blog"         data-i18n="nav.blog">Blog</a>
      <a href="rive-wiki.html"    class="dd-nav-link hover:text-white transition-colors" data-nav="rive-wiki"    data-i18n="nav.wiki">Wiki</a>

      <!-- Language toggle -->
      <div class="flex items-center gap-2 border-l border-white/10 pl-6 ml-2">
        <button onclick="setLanguage('en')" class="lang-toggle-btn transition-colors hover:text-white cursor-pointer" data-lang="en">EN</button>
        <span class="text-white/10">|</span>
        <button onclick="setLanguage('vi')" class="lang-toggle-btn transition-colors hover:text-white cursor-pointer" data-lang="vi">VI</button>
      </div>
    </div>

    <!-- Desktop CTA -->
    <a href="contact-us.html"
       class="hidden md:flex items-center gap-2 text-[11px] uppercase hover:bg-neutral-200 transition-colors font-bold text-black tracking-tight bg-white rounded-sm pt-1.5 pr-4 pb-1.5 pl-4">
      <span data-i18n="nav.contact">CONTACT US</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 7h10v10M7 17L17 7"></path>
      </svg>
    </a>

    <!-- Mobile hamburger -->
    <button id="dd-mobile-menu-btn" class="md:hidden text-white p-2" aria-label="Open menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6"  x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- Mobile full-screen overlay -->
  <div id="dd-mobile-menu"
       class="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl hidden flex-col items-center justify-center space-y-8 opacity-0 transition-opacity duration-300">

    <button id="dd-close-menu-btn" class="absolute top-6 right-6 text-white p-2" aria-label="Close menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6"  x2="6"  y2="18"></line>
        <line x1="6"  y1="6"  x2="18" y2="18"></line>
      </svg>
    </button>

    <a href="index.html"        class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.home">Home</a>
    <a href="our-services.html" class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.services">Our Services</a>
    <a href="showcase.html"     class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.showcase">Showcase</a>
    <a href="blog.html"         class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.blog">Blog</a>
    <a href="rive-wiki.html"    class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.wiki">Wiki</a>
    <a href="contact-us.html"   class="text-2xl font-bold text-white uppercase tracking-widest hover:text-[#f7941d] transition-colors" data-i18n="nav.contact">Contact Us</a>

    <div class="flex items-center gap-6 pt-8 border-t border-white/10 w-2/3 justify-center">
      <button onclick="setLanguage('en')" class="lang-toggle-btn text-xl font-bold transition-colors" data-lang="en">EN</button>
      <span class="text-white/20 text-2xl">|</span>
      <button onclick="setLanguage('vi')" class="lang-toggle-btn text-xl font-bold transition-colors" data-lang="vi">VI</button>
    </div>
  </div>
</nav>`;

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  var FOOTER_HTML = `
<footer class="border-t border-white/5 bg-black py-16">
  <div class="max-w-7xl mx-auto px-6 text-[10px] text-neutral-600 uppercase tracking-widest
              flex flex-col md:flex-row justify-between items-center text-center md:text-left">
    <div class="flex flex-col gap-1">
      <span class="text-white font-bold">Double D Media</span>
      <span>doubledlab1002@gmail.com</span>
      <span>+ 84 337 735 004</span>
    </div>
    <div class="mt-6 md:mt-0 flex gap-6 items-center">
      <a href="coming-soon.html" class="hover:text-white transition-colors" data-i18n="footer.privacy">Privacy</a>
      <a href="coming-soon.html" class="hover:text-white transition-colors" data-i18n="footer.terms">Terms</a>
      <span>© 2025 Double D Media. <span data-i18n="footer.status">All Systems Operational.</span></span>
    </div>
  </div>
</footer>`;

  // ─── ACTIVE NAV ───────────────────────────────────────────────────────────
  function setActiveNav() {
    var path = window.location.pathname.toLowerCase();
    var filename = decodeURIComponent(path.split('/').pop().replace(/\.html$/, '')) || 'index';

    document.querySelectorAll('.dd-nav-link[data-nav]').forEach(function (link) {
      var key = link.getAttribute('data-nav');
      if (filename === key || filename.indexOf(key) !== -1) {
        link.classList.remove('text-neutral-400');
        link.classList.add('text-[#f7941d]');
        link.classList.remove('hover:text-white');
      }
    });
  }

  // ─── MOBILE MENU ──────────────────────────────────────────────────────────
  function initMobileMenu() {
    var btn   = document.getElementById('dd-mobile-menu-btn');
    var close = document.getElementById('dd-close-menu-btn');
    var menu  = document.getElementById('dd-mobile-menu');
    if (!btn || !menu) return;

    function open() {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
      void menu.offsetWidth;               // force reflow for transition
      menu.classList.remove('opacity-0');
      document.body.style.overflow = 'hidden';
    }
    function close_() {
      menu.classList.add('opacity-0');
      setTimeout(function () {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
        document.body.style.overflow = '';
      }, 300);
    }

    btn.addEventListener('click', open);
    if (close) close.addEventListener('click', close_);
  }

  // ─── INJECT ───────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // Nav
    var navSlot = document.getElementById('nav-placeholder');
    if (navSlot) {
      navSlot.outerHTML = NAV_HTML;
      setActiveNav();
      initMobileMenu();
    }

    // Footer
    var footerSlot = document.getElementById('footer-placeholder');
    if (footerSlot) {
      footerSlot.outerHTML = FOOTER_HTML;
    }

    // Re-apply i18n over injected content (lang.js may have run before us)
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }
  });

})();
