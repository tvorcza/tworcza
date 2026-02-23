/* site-animations.js */
(() => {
  'use strict';

  const CONFIG = {
    // Webflow: desktop dopiero powyżej 991px (jak w Twoim kodzie)
    desktopMaxWidth: 991,

    // Page fader
    faderId: 'page-fader',
    faderHideDelayMs: 20,
    transitionDelayMs: 120,

    // Jeśli ustawisz true, możesz USUNĄĆ tagi CDN GSAP/ScrollTrigger z Webflow,
    // bo ten plik doładuje je sam (tylko na desktop i tylko gdy animacje są włączone).
    autoLoadGSAP: true,
    gsapUrl: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',
    scrollTriggerUrl: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js',
  };

  const match = (q) => (window.matchMedia ? window.matchMedia(q) : null);

  function prefersReducedMotion() {
    const mq = match('(prefers-reduced-motion: reduce)');
    return !!(mq && mq.matches);
  }

  function isDesktop() {
    const mq = match(`(max-width: ${CONFIG.desktopMaxWidth}px)`);
    return !(mq && mq.matches);
  }

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function runWhenIdle(fn, timeout = 1500) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(fn, { timeout });
    } else {
      setTimeout(fn, 1);
    }
  }

  function loadScriptOnce(src, id) {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('Missing script src'));

      if (id && document.getElementById(id)) return resolve();

      // jeśli już istnieje taki src
      const scripts = document.scripts;
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src === src) return resolve();
      }

      const s = document.createElement('script');
      if (id) s.id = id;
      s.src = src;
      s.async = true; // równoległy download, nie blokuje parsera
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(s);
    });
  }

  async function ensureGSAP() {
    if (window.gsap && window.ScrollTrigger) return true;
    if (!CONFIG.autoLoadGSAP) return false;

    try {
      if (!window.gsap) await loadScriptOnce(CONFIG.gsapUrl, 'lib-gsap');
      if (!window.ScrollTrigger) await loadScriptOnce(CONFIG.scrollTriggerUrl, 'lib-scrolltrigger');
      return !!(window.gsap && window.ScrollTrigger);
    } catch {
      return false;
    }
  }

  function safeRegisterScrollTrigger() {
    if (!window.gsap || !window.ScrollTrigger) return;
    try {
      window.gsap.registerPlugin(window.ScrollTrigger);
    } catch {}
  }

  // 1) PAGE FADER (działa na wszystkich urządzeniach, bo to lekki UX)
  function initPageFader() {
    const fader = document.getElementById(CONFIG.faderId);
    if (!fader) return;

    const hideFader = () => fader.classList.add('is-hidden');

    const showFader = (cb) => {
      fader.classList.remove('is-hidden');
      if (typeof cb === 'function') setTimeout(cb, CONFIG.transitionDelayMs);
    };

    setTimeout(hideFader, CONFIG.faderHideDelayMs);

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) hideFader(); // bfcache
    });

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return; // tylko lewy klik
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest('a');
      if (!link) return;

      // opcjonalny opt-out na linku
      if (link.hasAttribute('data-no-fade')) return;

      const hrefAttr = link.getAttribute('href');
      if (!hrefAttr) return;

      if (hrefAttr.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(hrefAttr)) return;
      if (link.target === '_blank') return;
      if (link.hasAttribute('download')) return;

      let url;
      try {
        url = new URL(hrefAttr, window.location.href);
      } catch {
        return;
      }

      if (url.host !== window.location.host) return;

      // ignoruj tę samą stronę (z lub bez hash)
      const current = new URL(window.location.href);
      current.hash = '';
      url.hash = '';
      if (url.href === current.href) return;

      event.preventDefault();
      showFader(() => {
        window.location.href = url.href;
      });
    });
  }

  // 2) LENIS (tylko desktop + bez prefers-reduced-motion)
  function initLenis() {
    if (prefersReducedMotion() || !isDesktop()) return;

    // Nie inicjuj ponownie
    if (window.lenis && typeof window.lenis.raf === 'function') return;

    if (!window.Lenis) return; // Lenis musi być załadowany gdzieś osobno (jak u Ciebie)

    window.lenis = new window.Lenis({
      duration: 1.2,
      lerp: 0.08,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    if (window.ScrollTrigger && window.lenis && typeof window.lenis.on === 'function') {
      window.lenis.on('scroll', window.ScrollTrigger.update);
      requestAnimationFrame(() => window.ScrollTrigger.refresh());
    }

    const raf = (time) => {
      if (window.lenis) window.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  // 3) FOOTER PARALLAX (tylko desktop + bez prefers-reduced-motion)
  function initFooterParallax() {
    if (prefersReducedMotion() || !isDesktop()) return;

    const els = document.querySelectorAll('[data-footer-parallax]');
    if (!els.length) return;

    if (!window.gsap || !window.ScrollTrigger) return;

    safeRegisterScrollTrigger();

    els.forEach((el) => {
      const inner = el.querySelector('[data-footer-parallax-inner]');
      const dark = el.querySelector('[data-footer-parallax-dark]');
      if (!inner && !dark) return;

      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'clamp(top bottom)',
          end: 'clamp(top top)',
          scrub: true,
        },
      });

      if (inner) tl.from(inner, { yPercent: -25, ease: 'linear' }, 0);
      if (dark) tl.from(dark, { opacity: 0.5, ease: 'linear' }, 0);
    });
  }

  // BOOT
  onDomReady(() => {
    initPageFader();

    // Cięższe rzeczy odpalamy dopiero gdy przeglądarka ma “luz” (lepszy LCP/TTI)
    runWhenIdle(async () => {
      const shouldAnimate = !prefersReducedMotion() && isDesktop();

      // Jeśli GSAP potrzebujesz gdziekolwiek na desktop (nie tylko footer),
      // to zostaw to jako "shouldAnimate". Jeśli chcesz jeszcze mocniej optymalizować,
      // możesz sprawdzać np. czy istnieje [data-footer-parallax] zanim doładujesz GSAP.
      if (shouldAnimate) {
        const ok = await ensureGSAP();
        if (ok) safeRegisterScrollTrigger();
      }

      initLenis();
      initFooterParallax();
    });
  });
})();
