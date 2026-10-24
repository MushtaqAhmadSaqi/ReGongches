# update_index.py
import re

hero_html = """    <!-- 1. HERO (Full-Viewport Cinematic Mountain Video & SVG Thread Drawing) -->
    <section class="rg-hero" id="hero-banner-section">
      <div class="rg-hero__media" aria-hidden="true">
        <video class="rg-hero__video" id="rg-hero-video" autoplay muted loop playsinline preload="auto"
          poster="assets/img/banners/hero-video-poster.webp">
          <source src="assets/video/hero-mountain-heritage.mp4" type="video/mp4">
          <img src="assets/img/banners/hero-video-poster.webp"
            alt="Snow-capped Karakoram and Hunza Valley peaks with traditional hand-woven wool shawl and Gilgiti cap"
            class="rg-hero__bg-img">
        </video>
        <img src="assets/img/banners/hero-video-poster.webp" alt="" class="rg-hero__fallback-img"
          id="rg-hero-fallback-img">
      </div>

      <div class="rg-hero__overlay"></div>

      <svg class="rg-hero__thread-svg" viewBox="0 0 1440 180" fill="none" aria-hidden="true">
        <path class="rg-hero__thread-path" d="M-20 130 C240 20, 460 170, 740 70 C1020 -20, 1220 140, 1460 40"
          stroke="#B8913A" stroke-width="2.5" stroke-linecap="round" />
      </svg>

      <div class="rg-container rg-hero__content">
        <span class="rg-badge rg-badge--handmade" style="margin-block-end:16px;">From the valleys of
          Gilgit-Baltistan</span>
        <h1 class="rg-hero__title">Threads of Mountain Heritage</h1>
        <p class="rg-hero__subline">
          Traditional clothing, shawls and caps made by artisans in Hunza, Gilgit, Skardu and beyond, with the maker,
          material and origin shown on every piece.
        </p>
        <div class="rg-hero__ctas">
          <a href="shop.html" class="rg-btn rg-btn--primary">Shop the Collection</a>
          <a href="artisans.html" class="rg-btn rg-btn--outline" style="color:#F7F4EE;border-color:#F7F4EE;">Meet the
            makers</a>
        </div>
        <div class="rg-hero__trust">
          <span>Origin shown on every product</span>
          <span>·</span>
          <span>Size guidance for every fit</span>
          <span>·</span>
          <span>Tracked delivery across Pakistan</span>
          <span>·</span>
          <span>Cash on Delivery</span>
        </div>
      </div>

      <!-- Banner Video Controls Toolbar -->
      <div class="rg-hero__video-controls" role="toolbar" aria-label="Banner Video Controls">
        <button type="button" class="rg-hero__video-btn" id="rg-hero-play-pause-btn" aria-label="Pause background video"
          title="Pause / Play background video">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="rg-icon-pause"
            aria-hidden="true">
            <rect x="5" y="4" width="4.5" height="16" rx="1.5"></rect>
            <rect x="14.5" y="4" width="4.5" height="16" rx="1.5"></rect>
          </svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="rg-icon-play"
            aria-hidden="true" style="display:none;">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
          </svg>
          <span class="rg-hero__video-btn-text" id="rg-hero-play-pause-label">Pause</span>
        </button>

        <div class="rg-hero__video-switcher" role="group" aria-label="Switch Banner Video Scene">
          <button type="button" class="rg-hero__scene-btn is-active"
            data-video-src="assets/video/hero-mountain-heritage.mp4"
            data-video-poster="assets/img/banners/hero-video-poster.webp"
            title="Switch to Karakoram Valley Mountain &amp; Shawl scene">
            <span>Karakoram Valley</span>
          </button>
          <button type="button" class="rg-hero__scene-btn" data-video-src="assets/video/artisan-hunza-loom.mp4"
            data-video-poster="assets/img/banners/hero-artisan-poster.webp"
            title="Switch to Hunza Artisan Frame-Loom Weaving scene">
            <span>Hunza Artisan Loom</span>
          </button>
        </div>
      </div>
    </section>"""

shop_by_craft_html = """    <!-- 2. SHOP BY CRAFT — Interactive Scene Rail (Hanging Garments on Curved Rod) -->
    <style>
      /* ── Shop by Craft: Scene Rail ──────────────────────────────────── */
      .sr-craft-section {
        background: #f7f5f0;
        border-top: 1px solid #ebe5dc;
        border-bottom: 1px solid #ebe5dc;
        padding-top: clamp(40px, 5vw, 64px);
        padding-bottom: clamp(44px, 5vw, 68px);
        overflow: hidden;
        position: relative;
      }

      .sr-craft-section .rg-section__eyebrow {
        color: #8A282B;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        display: block;
        margin-bottom: 8px;
      }

      .sr-craft-section h2 {
        font-family: var(--font-display);
        font-size: clamp(2rem, 3.8vw, 3rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #1a1410;
        margin: 0;
        line-height: 1.15;
      }

      /* Stage: holds the curved rod and hanging items */
      .sr-stage {
        position: relative;
        width: 100%;
        min-height: 480px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding-top: 24px;
      }

      /* Curved rod */
      .sr-rod {
        position: absolute;
        top: 24px;
        left: 0;
        width: 100%;
        height: 80px;
        pointer-events: none;
        z-index: 2;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
      }

      /* Rail scroll container */
      .sr-rail {
        display: flex;
        align-items: flex-start;
        gap: 0;
        overflow-x: auto;
        overflow-y: visible;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: 20px 48px 60px;
        cursor: grab;
        user-select: none;
        position: relative;
        z-index: 3;
      }

      .sr-rail::-webkit-scrollbar {
        display: none;
      }

      .sr-rail.is-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
      }

      /* Individual craft garment item */
      .sr-item {
        flex: 0 0 auto;
        width: 124px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        text-decoration: none;
        padding: 0 8px;
      }

      .sr-item:hover,
      .sr-item.is-focused {
        transform: translateY(-22px) scale(1.03);
      }

      /* Hanger wire + hook */
      .sr-item__hanger {
        width: 52px;
        height: 38px;
        margin-bottom: -4px;
        position: relative;
        z-index: 4;
        transition: filter 0.25s;
      }

      .sr-item:hover .sr-item__hanger {
        filter: drop-shadow(0 2px 6px rgba(184, 145, 58, 0.6));
      }

      /* Garment card / silhouette */
      .sr-item__card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .sr-item__img-wrap {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 8px 24px rgba(26, 20, 16, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.35s, transform 0.35s;
      }

      .sr-item:hover .sr-item__img-wrap {
        box-shadow: 0 20px 36px rgba(26, 20, 16, 0.2), 0 4px 10px rgba(184, 145, 58, 0.25);
      }

      .sr-item__img {
        width: 108px;
        height: 156px;
        object-fit: cover;
        display: block;
        transition: transform 0.4s ease;
      }

      .sr-item:hover .sr-item__img {
        transform: scale(1.06);
      }

      /* Craft Tag below piece */
      .sr-item__craft-tag {
        margin-top: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #5a4f43;
        text-align: center;
        white-space: nowrap;
        background: #ede8df;
        padding: 3px 10px;
        border-radius: 12px;
        letter-spacing: 0.02em;
        transition: background 0.2s, color 0.2s;
      }

      .sr-item:hover .sr-item__craft-tag {
        background: #1a1410;
        color: #f7f4ee;
      }

      /* Bottom info row */
      .sr-bottom {
        padding: 20px 48px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        border-top: 1px solid #ebe5dc;
        position: relative;
        z-index: 5;
        flex-wrap: wrap;
      }

      .sr-bottom__info {
        display: flex;
        align-items: baseline;
        gap: 16px;
      }

      .sr-bottom__name {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        color: #1a1410;
        letter-spacing: -0.01em;
      }

      .sr-bottom__price {
        font-size: 16px;
        font-weight: 600;
        color: #B8913A;
      }

      .sr-bottom__hint {
        font-size: 12px;
        color: #8c8275;
        margin-top: 3px;
      }

      /* Progress dots */
      .sr-dots {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .sr-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #d6cfc4;
        transition: all 0.25s;
        cursor: pointer;
      }

      .sr-dot.is-active {
        width: 22px;
        border-radius: 4px;
        background: #1a1410;
      }

      .sr-bottom__right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .sr-bottom__tagline {
        font-size: 12px;
        color: #7a6e60;
        text-align: right;
        line-height: 1.4;
      }

      .sr-bottom__cta {
        padding: 10px 22px;
        border-radius: 24px;
        background: #1a1410;
        color: #F7F4EE;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transition: background 0.2s, transform 0.15s;
      }

      .sr-bottom__cta:hover {
        background: #B8913A;
        transform: translateY(-1px);
      }

      /* ── Quick View Modal ─────────────────────────────────────────── */
      .sr-qv-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(19, 36, 59, 0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .sr-qv-overlay.is-open {
        opacity: 1;
        pointer-events: auto;
      }

      .sr-qv {
        background: #fff;
        border-radius: 20px;
        width: 100%;
        max-width: 820px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        overflow: hidden;
        box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
        position: relative;
        transform: scale(0.95) translateY(12px);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        max-height: 90vh;
      }

      .sr-qv-overlay.is-open .sr-qv {
        transform: scale(1) translateY(0);
      }

      .sr-qv__close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f4f2ef;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #1a1410;
        z-index: 10;
        transition: background 0.2s, transform 0.15s;
      }

      .sr-qv__close:hover {
        background: #1a1410;
        color: #fff;
        transform: rotate(90deg);
      }

      .sr-qv__img-panel {
        background: #f7f5f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        position: relative;
      }

      .sr-qv__counter {
        position: absolute;
        top: 20px;
        left: 24px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: #a09282;
      }

      .sr-qv__main-img {
        max-width: 250px;
        max-height: 330px;
        object-fit: contain;
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12));
        margin-bottom: 16px;
        transition: opacity 0.3s;
      }

      .sr-qv__view-tabs {
        display: flex;
        gap: 8px;
      }

      .sr-qv__view-tab {
        padding: 5px 16px;
        border-radius: 20px;
        border: 1.5px solid #dcd6cc;
        background: #fff;
        font-size: 12px;
        font-weight: 600;
        color: #777;
        cursor: pointer;
        transition: all 0.2s;
      }

      .sr-qv__view-tab.is-active {
        background: #1a1410;
        color: #fff;
        border-color: #1a1410;
      }

      .sr-qv__info-panel {
        padding: 36px 32px 32px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 14px;
        overflow-y: auto;
      }

      .sr-qv__craft-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fdf5e7;
        color: #8A282B;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 4px 12px;
        border-radius: 20px;
        width: fit-content;
      }

      .sr-qv__name {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        color: #1a1410;
        margin: 0;
        line-height: 1.2;
      }

      .sr-qv__price {
        font-size: 18px;
        font-weight: 600;
        color: #B8913A;
      }

      .sr-qv__desc {
        font-size: 13px;
        line-height: 1.5;
        color: #665f56;
      }

      .sr-qv__size-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #888;
        margin-bottom: 6px;
      }

      .sr-qv__sizes {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .sr-qv__size-btn {
        padding: 6px 14px;
        border-radius: 16px;
        border: 1.5px solid #e0e0e0;
        background: #fff;
        font-size: 12px;
        font-weight: 600;
        color: #555;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.18s;
      }

      .sr-qv__size-btn:hover {
        border-color: #B8913A;
        color: #B8913A;
      }

      .sr-qv__size-btn.is-selected {
        background: #1a1410;
        border-color: #1a1410;
        color: #fff;
      }

      .sr-qv__atc {
        width: 100%;
        padding: 14px;
        border-radius: 40px;
        border: none;
        background: #1a1410;
        color: #F7F4EE;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.04em;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 4px;
      }

      .sr-qv__atc:hover {
        background: #B8913A;
        transform: scale(1.01);
      }

      .sr-qv__meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #999;
        padding-top: 8px;
        border-top: 1px solid #f0ece5;
      }

      .sr-qv__view-page {
        color: #B8913A;
        font-weight: 600;
        text-decoration: none;
        font-size: 12px;
      }

      .sr-qv__view-page:hover {
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        .sr-rail {
          padding: 10px 20px 40px;
        }

        .sr-item {
          width: 95px;
        }

        .sr-item__img {
          width: 82px;
          height: 124px;
        }

        .sr-bottom {
          padding: 16px 20px 0;
        }

        .sr-qv {
          grid-template-columns: 1fr;
        }

        .sr-qv__img-panel {
          display: none;
        }
      }
    </style>

    <section class="rg-section sr-craft-section" id="shop-by-craft-section" aria-label="Shop by craft — Interactive Clothing Rail">
      <div class="rg-container">
        <div class="rg-section__header">
          <div>
            <span class="rg-section__eyebrow">Eight traditions of cloth, from everyday caps to wedding wear.</span>
            <h2>Shop by craft</h2>
          </div>
          <a href="shop.html" class="rg-btn rg-btn--outline rg-btn--sm">View All 27 Pieces →</a>
        </div>
      </div>

      <!-- Scene Rail Stage -->
      <div class="sr-stage" id="sr-stage">

        <!-- Curved rod drawn via SVG -->
        <svg class="sr-rod" id="sr-rod-svg" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path id="sr-rod-path" d="M-20,60 Q720,-10 1460,60" stroke="#B8913A" stroke-width="3.5" fill="none"
            stroke-linecap="round" />
        </svg>

        <!-- Scrollable Rail of craft pieces -->
        <div class="sr-rail" id="sr-rail" role="list" aria-label="Handcrafted pieces hanging on rail">
          <!-- Items injected by JS -->
        </div>

        <!-- Bottom info bar -->
        <div class="sr-bottom">
          <div>
            <div class="sr-bottom__info">
              <div class="sr-bottom__name" id="sr-active-name">Hover a craft piece</div>
              <div class="sr-bottom__price" id="sr-active-price">PKR 2,500</div>
            </div>
            <div class="sr-bottom__hint" id="sr-hint">Hover a craft piece to lift · click to look closer</div>
          </div>

          <!-- Progress dots -->
          <div class="sr-dots" id="sr-dots" aria-hidden="true"></div>

          <div class="sr-bottom__right">
            <div class="sr-bottom__tagline">Hand-crafted in Gilgit-Baltistan.<br>Made to last generations.</div>
            <a href="shop.html" class="sr-bottom__cta">Shop all crafts →</a>
          </div>
        </div>

      </div>
    </section>

    <!-- Quick-View Modal (Scene Rail) -->
    <div class="sr-qv-overlay" id="sr-qv-overlay" role="dialog" aria-modal="true" aria-label="Product Quick View">
      <div class="sr-qv" id="sr-qv">
        <button class="sr-qv__close" id="sr-qv-close" aria-label="Close quick view">✕</button>

        <!-- Left: image panel -->
        <div class="sr-qv__img-panel">
          <span class="sr-qv__counter" id="sr-qv-counter">01 / 08</span>
          <img src="" alt="" class="sr-qv__main-img" id="sr-qv-img">
          <div class="sr-qv__view-tabs">
            <button class="sr-qv__view-tab is-active" data-qv-view="front">Front</button>
            <button class="sr-qv__view-tab" data-qv-view="back">Back</button>
          </div>
        </div>

        <!-- Right: info panel -->
        <div class="sr-qv__info-panel">
          <div class="sr-qv__craft-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span id="sr-qv-region">Hunza Valley</span>
          </div>
          <h2 class="sr-qv__name" id="sr-qv-name">Traditional Gilgiti Cap</h2>
          <div class="sr-qv__price" id="sr-qv-price">PKR 2,500</div>
          <div class="sr-qv__desc" id="sr-qv-desc">Rolled wool Gilgiti caps, embroidered caps and headwear, sized by head circumference.</div>
          <div>
            <div class="sr-qv__size-label">Size / Fit</div>
            <div class="sr-qv__sizes" id="sr-qv-sizes">
              <button class="sr-qv__size-btn" data-size="S">S</button>
              <button class="sr-qv__size-btn is-selected" data-size="M">M</button>
              <button class="sr-qv__size-btn" data-size="L">L</button>
              <button class="sr-qv__size-btn" data-size="XL">XL</button>
            </div>
          </div>
          <button class="sr-qv__atc" id="sr-qv-atc">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Add to Cart
          </button>
          <div class="sr-qv__meta-row">
            <span id="sr-qv-product-label">Caps &amp; Headwear</span>
            <a href="category.html?cat=Caps+%26+Headwear" class="sr-qv__view-page" id="sr-qv-product-link">Browse Category →</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Scene Rail JS -->
    <script>
      (function () {
        // ── 8 Crafts Data matching the 8 Craft Categories ─────────────────
        const SR_PRODUCTS = [
          {
            id: 'traditional-dresses',
            name: 'Karimabad Silk Kameez',
            craft: 'Traditional Dresses',
            desc: 'Embroidered dresses and regional outfits, made in limited runs and often to order.',
            region: 'Hunza Valley',
            price: 'PKR 14,000',
            img: 'assets/img/products/karimabad-silk-embroidered-kameez-1.webp',
            href: 'category.html?cat=Traditional+Dresses',
            sizes: ['XS', 'S', 'M', 'L'],
            defaultSize: 'S',
          },
          {
            id: 'gilgiti-cap',
            name: 'Traditional Gilgiti Cap',
            craft: 'Caps & Headwear',
            desc: 'Rolled wool Gilgiti caps, embroidered caps and headwear, sized by head circumference.',
            region: 'Gilgit District',
            price: 'PKR 2,500',
            img: 'assets/img/products/traditional-gilgiti-cap-1.webp',
            href: 'category.html?cat=Caps+%26+Headwear',
            sizes: ['S', 'M', 'L', 'XL'],
            defaultSize: 'M',
          },
          {
            id: 'embroidered-shawl',
            name: 'Embroidered Wool Shawl',
            craft: 'Shawls & Scarves',
            desc: 'Hand-woven wool shawls and embroidered stoles for warmth, ceremony and everyday wear.',
            region: 'Nagar Valley',
            price: 'PKR 8,500',
            img: 'assets/img/products/embroidered-shawl-1.webp',
            href: 'category.html?cat=Shawls+%26+Scarves',
            sizes: ['Standard', 'Oversized'],
            defaultSize: 'Standard',
          },
          {
            id: 'traditional-waistcoat',
            name: 'Traditional Pattu Waistcoat',
            craft: 'Waistcoats & Outerwear',
            desc: 'Tailored waistcoats, wool jackets and long coats, cut for layering over shalwar kameez.',
            region: 'Skardu, Baltistan',
            price: 'PKR 6,200',
            img: 'assets/img/products/traditional-waistcoat-1.webp',
            href: 'category.html?cat=Waistcoats+%26+Outerwear',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            defaultSize: 'L',
          },
          {
            id: 'textile-accessories',
            name: 'Embroidered Mountain Bag',
            craft: 'Textile Accessories',
            desc: 'Embroidered bags, purses, belts and fabric jewellery, perfect as gifts or for daily use.',
            region: 'Gojal Valley',
            price: 'PKR 4,800',
            img: 'assets/img/products/embroidered-handbag-1.webp',
            href: 'category.html?cat=Textile+Accessories',
            sizes: ['Standard'],
            defaultSize: 'Standard',
          },
          {
            id: 'home-textiles',
            name: 'Shigar Cushion Cover',
            craft: 'Home Textiles',
            desc: 'Cushion covers, runners and wall pieces that bring mountain craft into the home.',
            region: 'Shigar Valley',
            price: 'PKR 3,600',
            img: 'assets/img/products/shigar-lattice-embroidered-cushion-cover-1.webp',
            href: 'category.html?cat=Home+Textiles',
            sizes: ['16×16"', '18×18"', '20×20"'],
            defaultSize: '16×16"',
          },
          {
            id: 'heritage-gifts',
            name: 'Heritage Gift Set',
            craft: 'Heritage Gifts',
            desc: 'Ready-to-give sets with gift wrap and an authenticity card.',
            region: 'Gilgit-Baltistan',
            price: 'PKR 9,500',
            img: 'assets/img/products/heritage-gift-set-1.webp',
            href: 'gift-sets.html',
            sizes: ['Curated Box'],
            defaultSize: 'Curated Box',
          },
          {
            id: 'custom-festive',
            name: 'Custom Festive Chugha',
            craft: 'Custom & Festive Wear',
            desc: 'Made-to-measure pieces for weddings, Eid and cultural events. Book 3–5 weeks ahead.',
            region: 'Hunza Valley',
            price: 'PKR 22,000',
            img: 'assets/img/products/hunza-embroidered-festive-chugha-1.webp',
            href: 'custom-orders.html',
            sizes: ['Made to Measure', 'Bespoke'],
            defaultSize: 'Made to Measure',
          },
        ];

        const rail = document.getElementById('sr-rail');
        const activeName = document.getElementById('sr-active-name');
        const activePrice = document.getElementById('sr-active-price');
        const hint = document.getElementById('sr-hint');
        const dotsContainer = document.getElementById('sr-dots');

        // Render progress dots
        SR_PRODUCTS.forEach((p, i) => {
          const dot = document.createElement('div');
          dot.className = 'sr-dot' + (i === 0 ? ' is-active' : '');
          dot.addEventListener('click', () => {
            const items = rail.querySelectorAll('.sr-item');
            if (items[i]) {
              items[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              setActiveProduct(p, i);
            }
          });
          dotsContainer.appendChild(dot);
        });

        function setActiveDot(index) {
          const dots = dotsContainer.querySelectorAll('.sr-dot');
          dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
        }

        function setActiveProduct(p, index) {
          activeName.textContent = p.craft + ' — ' + p.name;
          activePrice.textContent = p.price;
          hint.textContent = p.region + ' · Click to inspect piece';
          setActiveDot(index);
        }

        // Render hanging garments on the rail
        SR_PRODUCTS.forEach((p, idx) => {
          const item = document.createElement('div');
          item.className = 'sr-item';
          item.setAttribute('role', 'listitem');
          item.setAttribute('tabindex', '0');
          item.setAttribute('aria-label', p.craft + ': ' + p.name + ', ' + p.price);

          // SVG hanger hook & wire
          item.innerHTML = `
            <svg class="sr-item__hanger" viewBox="0 0 52 38" fill="none" aria-hidden="true">
              <!-- Hook around rod -->
              <path d="M26,14 C26,5 29,1 32,1 C35,1 36,4 35,7 C33.5,11 26,15 26,19" stroke="#B8913A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <!-- Triangular hanger body -->
              <path d="M26,19 L3,36 L49,36 Z" stroke="#8a7350" stroke-width="2.2" stroke-linejoin="round" fill="rgba(184,145,58,0.12)"/>
              <!-- Swivel collar -->
              <circle cx="26" cy="19" r="2.5" fill="#B8913A"/>
            </svg>
            <div class="sr-item__card">
              <div class="sr-item__img-wrap">
                <img src="${p.img}" alt="${p.name}" class="sr-item__img" loading="lazy" width="108" height="156">
              </div>
              <div class="sr-item__craft-tag">${p.craft}</div>
            </div>
          `;

          // Hover interaction
          item.addEventListener('mouseenter', () => setActiveProduct(p, idx));
          item.addEventListener('focus', () => setActiveProduct(p, idx));

          // Click to open quick-view modal
          item.addEventListener('click', (e) => {
            if (isDragging) return;
            openQuickView(p, idx);
          });

          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openQuickView(p, idx);
            }
          });

          rail.appendChild(item);
        });

        // Drag to scroll
        let isDown = false;
        let startX, scrollLeft;
        let isDragging = false;

        rail.addEventListener('mousedown', (e) => {
          isDown = true;
          isDragging = false;
          rail.classList.add('is-dragging');
          startX = e.pageX - rail.offsetLeft;
          scrollLeft = rail.scrollLeft;
        });

        window.addEventListener('mouseup', () => {
          isDown = false;
          rail.classList.remove('is-dragging');
          setTimeout(() => { isDragging = false; }, 50);
        });

        rail.addEventListener('mousemove', (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - rail.offsetLeft;
          const walk = (x - startX) * 1.6;
          if (Math.abs(walk) > 5) isDragging = true;
          rail.scrollLeft = scrollLeft - walk;
        });

        // Wheel scroll
        rail.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          e.preventDefault();
          rail.scrollLeft += e.deltaY * 0.9;
        }, { passive: false });

        // Quick View modal
        const overlay = document.getElementById('sr-qv-overlay');
        const qvImg = document.getElementById('sr-qv-img');
        const qvName = document.getElementById('sr-qv-name');
        const qvPrice = document.getElementById('sr-qv-price');
        const qvDesc = document.getElementById('sr-qv-desc');
        const qvRegion = document.getElementById('sr-qv-region');
        const qvCounter = document.getElementById('sr-qv-counter');
        const qvSizes = document.getElementById('sr-qv-sizes');
        const qvProductLabel = document.getElementById('sr-qv-product-label');
        const qvProductLink = document.getElementById('sr-qv-product-link');
        const qvAtc = document.getElementById('sr-qv-atc');

        function openQuickView(p, idx) {
          qvImg.src = p.img;
          qvImg.alt = p.name;
          qvName.textContent = p.name;
          qvPrice.textContent = p.price;
          qvDesc.textContent = p.desc;
          qvRegion.textContent = p.region + ' · ' + p.craft;
          qvCounter.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(SR_PRODUCTS.length).padStart(2, '0');
          qvProductLabel.textContent = p.craft;
          qvProductLink.href = p.href;
          qvProductLink.textContent = 'Explore ' + p.craft + ' →';

          // Sizes
          qvSizes.innerHTML = '';
          p.sizes.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'sr-qv__size-btn' + (s === p.defaultSize ? ' is-selected' : '');
            btn.dataset.size = s;
            btn.textContent = s;
            btn.addEventListener('click', () => {
              qvSizes.querySelectorAll('.sr-qv__size-btn').forEach(b => b.classList.remove('is-selected'));
              btn.classList.add('is-selected');
            });
            qvSizes.appendChild(btn);
          });

          overlay.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        }

        function closeQuickView() {
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
        }

        document.getElementById('sr-qv-close').addEventListener('click', closeQuickView);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeQuickView(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQuickView(); });

        // View tab toggle
        document.querySelectorAll('[data-qv-view]').forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('[data-qv-view]').forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
          });
        });

        // ATC button feedback
        qvAtc.addEventListener('click', () => {
          const sel = qvSizes.querySelector('.is-selected');
          if (!sel) { qvAtc.textContent = 'Please select a size'; return; }
          qvAtc.innerHTML = '✓ Added to Cart';
          qvAtc.style.background = '#3a7c5a';
          setTimeout(() => {
            qvAtc.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart';
            qvAtc.style.background = '';
          }, 2000);
        });

        // Set initial active product
        if (SR_PRODUCTS.length > 0) {
          setActiveProduct(SR_PRODUCTS[0], 0);
        }
      })();
    </script>"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for current Hero (scene rail in hero) + Category tiles (Shop by craft)
# Starts with `<!-- 1. HERO` up to right before `<!-- 3. "NEW FROM THE MOUNTAINS"`
pattern = r'(\s*<!-- 1\. HERO.*?)(<!-- 3\. "NEW FROM THE MOUNTAINS")'

match = re.search(pattern, content, re.DOTALL)
if not match:
    print("ERROR: Could not find hero + category sections!")
else:
    print(f"Found match! Length: {len(match.group(1))}")
    replacement = "\n" + hero_html + "\n\n" + shop_by_craft_html + "\n\n    "
    new_content = content[:match.start(1)] + replacement + content[match.start(2):]
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated index.html!")
