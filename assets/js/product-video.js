/* ==========================================================================
   ReGongches Product Video Showcase Component (assets/js/product-video.js)
   Reusable, performance-safe "Feel the Product" video player for cards & PDP.
   - Predictable path: assets/video/products/<product-slug>.mp4
   - Zero 404s: mounts <video> only when registered in RG_DATA.productVideos
     or explicitly provided on product.video
   - Poster = product's kept hero image (instant load, zero layout shift)
   - Lazy-loads via IntersectionObserver & pauses offscreen
   - Respects prefers-reduced-motion: reduce (static hero image only)
   - Tactile polish: hover-to-play on cards, subtle play/pause toggle on PDP
   ========================================================================== */
(function (window, document) {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function safeVideoUrl(url) {
    const raw = String(url || '').trim();
    if (!raw || raw.startsWith('//')) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      return /^https?:/i.test(raw) ? raw : '';
    }
    return raw;
  }

  let sharedObserver = null;

  function ensureObserver() {
    if (sharedObserver || typeof window.IntersectionObserver !== 'function') {
      return sharedObserver;
    }
    sharedObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!video) return;
        if (entry.isIntersecting) {
          hydrateVideoSrc(video);
          if (video.dataset.rgAutoplayVisible === 'true' && !prefersReducedMotion()) {
            playVideoElement(video);
          }
        } else if (!video.paused) {
          pauseVideoElement(video);
        }
      });
    }, { rootMargin: '120px 0px', threshold: 0.1 });
    return sharedObserver;
  }

  function hydrateVideoSrc(video) {
    if (!video || video.dataset.rgVideoFailed === 'true') return false;
    const pendingSrc = video.getAttribute('data-rg-video-src');
    if (pendingSrc && !video.getAttribute('src')) {
      video.setAttribute('src', pendingSrc);
      if (typeof video.load === 'function') {
        try { video.load(); } catch (e) {}
      }
    }
    return Boolean(video.getAttribute('src'));
  }

  function setToggleState(container, isPlaying) {
    if (!container) return;
    const btn = container.querySelector('[data-rg-pdp-video-toggle]');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(isPlaying));
    btn.classList.toggle('is-playing', isPlaying);
    const labelEl = btn.querySelector('[data-rg-video-toggle-label]');
    if (labelEl) {
      labelEl.textContent = isPlaying ? 'Pause Showcase' : 'Feel the Craft';
    }
    const iconEl = btn.querySelector('[data-rg-video-toggle-icon]');
    if (iconEl) {
      iconEl.innerHTML = isPlaying
        ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
  }

  function playVideoElement(video) {
    if (!video || prefersReducedMotion() || video.dataset.rgVideoFailed === 'true') return;
    if (!hydrateVideoSrc(video)) return;
    const container = video.closest('[data-rg-video-host]');
    const markPlaying = () => {
      video.classList.add('is-playing');
      if (container) {
        container.classList.add('is-video-playing');
        setToggleState(container, true);
      }
    };
    const p = typeof video.play === 'function' ? video.play() : null;
    if (p && typeof p.then === 'function') {
      p.then(markPlaying).catch(() => {});
    } else {
      markPlaying();
    }
  }

  function pauseVideoElement(video) {
    if (!video) return;
    if (typeof video.pause === 'function' && !video.paused) {
      video.pause();
    }
    video.classList.remove('is-playing');
    const container = video.closest('[data-rg-video-host]');
    if (container) {
      container.classList.remove('is-video-playing');
      setToggleState(container, false);
    }
  }

  function handleVideoError(video) {
    if (!video) return;
    video.dataset.rgVideoFailed = 'true';
    pauseVideoElement(video);
    const container = video.closest('[data-rg-video-host]');
    if (container) {
      const btn = container.querySelector('[data-rg-pdp-video-toggle]');
      if (btn) btn.hidden = true;
      const badge = container.querySelector('.rg-product-video-badge');
      if (badge) badge.hidden = true;
    }
    video.hidden = true;
  }

  const RGProductVideo = {
    /** Returns predictable path assets/video/products/<slug>.mp4 */
    getPredictablePath(product) {
      if (!product || !product.slug) return '';
      const base = (window.RG_DATA && window.RG_DATA.productVideoBase) || 'assets/video/products/';
      return `${base}${encodeURIComponent(String(product.slug))}.mp4`;
    },

    /** Returns { src, poster, title } only if a real video is registered/configured */
    getVideoSpec(product) {
      if (!product) return null;
      const hero = product.images && product.images[0] && product.images[0].src ? product.images[0].src : '';
      const registry = (window.RG_DATA && window.RG_DATA.productVideos) || {};
      const entry = product.slug ? registry[product.slug] : null;

      let rawSrc = '';
      let title = `${product.name || 'Product'} showcase video`;

      if (product.video && product.video.src) {
        rawSrc = product.video.src;
        if (product.video.title) title = product.video.title;
      } else if (entry) {
        rawSrc = (typeof entry === 'object' && entry.src) ? entry.src : this.getPredictablePath(product);
        if (typeof entry === 'object' && entry.title) title = entry.title;
      }

      const safeSrc = safeVideoUrl(rawSrc);
      if (!safeSrc) return null;

      const poster = (product.video && product.video.poster) || (typeof entry === 'object' && entry && entry.poster) || hero;
      return { src: safeSrc, poster, title };
    },

    /** Renders optional video layer inside a product card media box */
    renderCardVideoLayer(product) {
      const spec = this.getVideoSpec(product);
      if (!spec || prefersReducedMotion()) return '';
      return `
        <video
          class="rg-product-video rg-product-video--card"
          data-rg-video-el="card"
          data-rg-video-src="${escHtml(spec.src)}"
          ${spec.poster ? `poster="${escHtml(spec.poster)}"` : ''}
          muted
          loop
          playsinline
          preload="none"
          aria-hidden="true"
        ></video>
        <span class="rg-product-video-badge" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Feel
        </span>
      `;
    },

    /** Renders optional video layer + play/pause toggle for PDP gallery main box */
    renderPdpVideoOverlay(product) {
      const spec = this.getVideoSpec(product);
      if (!spec || prefersReducedMotion()) return '';
      return `
        <video
          class="rg-product-video rg-product-video--pdp"
          data-rg-video-el="pdp"
          data-rg-video-src="${escHtml(spec.src)}"
          data-rg-autoplay-visible="false"
          ${spec.poster ? `poster="${escHtml(spec.poster)}"` : ''}
          muted
          loop
          playsinline
          preload="none"
          aria-label="${escHtml(spec.title)}"
        ></video>
        <button
          type="button"
          class="rg-pdp-video-toggle"
          data-rg-pdp-video-toggle
          aria-pressed="false"
          aria-label="Toggle product showcase video"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" data-rg-video-toggle-icon aria-hidden="true">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span data-rg-video-toggle-label>Feel the Craft</span>
        </button>
      `;
    },

    /** Wires lazy-loading, hover-to-play, PDP toggle, and error fallback within root */
    mount(root = document) {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      const videos = Array.from(root.querySelectorAll('[data-rg-video-el]'));
      if (!videos.length) return;

      if (prefersReducedMotion()) {
        videos.forEach((v) => { v.hidden = true; });
        root.querySelectorAll('[data-rg-pdp-video-toggle], .rg-product-video-badge').forEach((el) => {
          el.hidden = true;
        });
        return;
      }

      const observer = ensureObserver();

      videos.forEach((video) => {
        if (video.dataset.rgVideoBound === 'true') return;
        video.dataset.rgVideoBound = 'true';

        video.addEventListener('error', () => handleVideoError(video));

        if (observer) {
          observer.observe(video);
        } else {
          hydrateVideoSrc(video);
        }

        const host = video.closest('[data-rg-video-host]');
        if (!host) return;

        if (video.dataset.rgVideoEl === 'card') {
          const card = host.closest('li.product') || host;
          card.addEventListener('mouseenter', () => playVideoElement(video));
          card.addEventListener('mouseleave', () => pauseVideoElement(video));
          card.addEventListener('focusin', () => playVideoElement(video));
          card.addEventListener('focusout', (e) => {
            if (!card.contains(e.relatedTarget)) pauseVideoElement(video);
          });
        } else if (video.dataset.rgVideoEl === 'pdp') {
          const toggleBtn = host.querySelector('[data-rg-pdp-video-toggle]');
          if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (video.paused) {
                playVideoElement(video);
              } else {
                pauseVideoElement(video);
              }
            });
          }
        }
      });
    }
  };

  window.RG = window.RG || {};
  window.RG.productVideo = RGProductVideo;
})(window, document);
