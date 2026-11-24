/* ==========================================================================
   ReGongches Motion & Scroll Interaction Module (assets/js/motion.js)
   Respects prefers-reduced-motion; handles reveal-on-scroll, counters, rails
   ========================================================================== */
(function (window, document) {
  'use strict';

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RGMotion = {
    init() {
      this.initScrollReveals();
      this.initCounters();
      this.initHorizontalRails();
      if (!prefersReducedMotion) {
        this.initHeroParallax();
      }
    },

    initScrollReveals() {
      const explicitEls = Array.from(document.querySelectorAll('[data-rg-reveal]'));
      const autoEls = Array.from(document.querySelectorAll('.rg-craft-step, .rg-cat-tile, .rg-review-card, #rg-newsletter-block'));
      const els = [...new Set([...explicitEls, ...autoEls])].filter((el) => !el.classList.contains('is-revealed'));
      if (!els.length) return;
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('is-revealed'));
        return;
      }
      els.forEach((el) => el.classList.add('rg-reveal-item'));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      els.forEach((el) => io.observe(el));
    },

    initCounters() {
      const counters = document.querySelectorAll('[data-rg-counter]');
      if (!counters.length) return;
      counters.forEach((el) => {
        const target = Number(el.getAttribute('data-rg-counter')) || 0;
        const suffix = el.getAttribute('data-rg-suffix') || '';
        if (prefersReducedMotion) {
          el.textContent = target + suffix;
          return;
        }
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 30));
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target + suffix;
            clearInterval(timer);
          } else {
            el.textContent = current + suffix;
          }
        }, 35);
      });
    },

    initHorizontalRails() {
      document.querySelectorAll('[data-rg-rail-wrap]').forEach((wrap) => {
        const rail = wrap.querySelector('.rg-rail');
        const prev = wrap.querySelector('[data-rg-rail-prev]');
        const next = wrap.querySelector('[data-rg-rail-next]');
        if (!rail) return;

        const updateBounds = () => {
          const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
          if (prev) prev.disabled = rail.scrollLeft <= 2;
          if (next) next.disabled = maxScroll <= 2 || rail.scrollLeft >= maxScroll - 2;
        };

        if (prev) {
          prev.addEventListener('click', () => {
            rail.scrollBy({ left: -320, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          });
        }
        if (next) {
          next.addEventListener('click', () => {
            rail.scrollBy({ left: 320, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          });
        }

        rail.addEventListener('scroll', updateBounds, { passive: true });
        window.addEventListener('resize', updateBounds, { passive: true });
        setTimeout(updateBounds, 120);
      });
    },

    initHeroParallax() {
      const hero = document.querySelector('.rg-hero');
      const threadPath = document.querySelector('.rg-hero__thread-path');
      if (!hero) return;

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < 900) {
            const media = hero.querySelector('.rg-hero__media') || hero.querySelector('.rg-hero__bg-img');
            if (media) media.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
          }
          if (threadPath) {
            const offset = Math.max(0, 1600 - (y * 2.2));
            threadPath.style.strokeDashoffset = String(offset * 0.15);
          }
          ticking = false;
        });
      }, { passive: true });
    }
  };

  window.RG = window.RG || {};
  window.RG.motion = RGMotion;
})(window, document);
