/* ==========================================================================
   ReGongches Single Product Page Controller (assets/js/product.js)
   Handles gallery + magnifier lens, colour-linked gallery, size buttons,
   live dispatch countdown timer, city delivery estimator, flippable ORIGIN CARD,
   "Complete the look" bundle builder, interactive review filter, and JSON-LD.
   ========================================================================== */
(function (window, document) {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function formatFutureDate(daysToAdd) {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
  }

  function getDispatchCountdownText() {
    const cfg = window.RG.data.getConfig();
    const cutoff = cfg.dispatchCutoffHourPKT || 16;
    const now = new Date();
    const pktHour = (now.getUTCHours() + 5) % 24;
    const pktMin = now.getUTCMinutes();
    let hoursLeft = cutoff - pktHour - 1;
    let minsLeft = 60 - pktMin;
    if (hoursLeft < 0) {
      hoursLeft += 24;
    }
    return `Order within ${hoursLeft}h ${minsLeft}m for next-batch dispatch from our northern desk.`;
  }

  const RGProductPage = {
    init() {
      const container = document.getElementById('rg-single-product-container');
      if (!container) return;

      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id') || '1';
      const product = window.RG.data.getProductById(idParam);
      if (!product) return;

      window.RG.wishlist.addRecentlyViewed(product.id);
      this.renderProduct(container, product);
      this.injectJsonLd(product);
    },

    renderProduct(container, product) {
      const fmt = window.RG.data.formatPKR;
      const artisan = window.RG.data.getArtisanById(product.artisan_id);
      const reviews = window.RG.data.getReviews(product.id);
      const cfg = window.RG.data.getConfig();

      const breadcrumbEl = document.getElementById('rg-product-breadcrumb-current');
      if (breadcrumbEl) breadcrumbEl.textContent = product.name;
      document.title = (product.seo && product.seo.title) || `${product.name} (${product.region}) — ReGongches`;

      const sizes = (product.attributes && product.attributes.size) || ['Standard'];
      const unavail = (product.attributes && product.attributes.unavailable_sizes) || [];
      const colours = (product.attributes && product.attributes.colour) || ['Default'];

      const minD = product.dispatch_days ? product.dispatch_days[0] : 1;
      const maxD = product.dispatch_days ? product.dispatch_days[1] : 2;
      const estRange = `${formatFutureDate(minD)} – ${formatFutureDate(maxD)}`;

      const waText = encodeURIComponent(`Hi ReGongches, I have a question about ${product.name} (SKU: ${product.sku})`);
      const waFloat = document.querySelector('.rg-whatsapp-float');
      if (waFloat) {
        waFloat.href = `https://wa.me/${cfg.whatsappNumber}?text=${waText}`;
      }

      const pairIds = (product.pairs_with && product.pairs_with.length) ? product.pairs_with : [1, 2, 16].filter((id) => id !== product.id).slice(0, 2);
      const pairProducts = pairIds.map((id) => window.RG.data.getProductById(id)).filter(Boolean);

      // Clean 1-paragraph summary from description_html or short_description
      let cleanCraftSummary = product.short_description;
      if (product.description_html) {
        const pMatch = product.description_html.match(/<p>(.*?)<\/p>/i);
        if (pMatch && pMatch[1]) {
          cleanCraftSummary = pMatch[1].replace(/<[^>]+>/g, '').trim();
        }
      }

      const materialText = (product.specs && product.specs.material) ||
        (product.attributes && product.attributes.material && product.attributes.material.join(', ')) ||
        '100% Handcrafted Mountain Craft';

      const images = Array.isArray(product.images) ? product.images.filter((im) => im && im.src) : [];
      const hasImages = images.length > 0;
      const heroImg = hasImages ? images[0] : null;
      const videoSpec = window.RG.productVideo ? window.RG.productVideo.getVideoSpec(product) : product.video;
      const totalThumbCount = images.length + (videoSpec ? 1 : 0);
      const showThumbStrip = totalThumbCount > 1;
      const thumbsClass = totalThumbCount > 0 && totalThumbCount < 5
        ? 'woocommerce-product-gallery__thumbs is-compact'
        : 'woocommerce-product-gallery__thumbs';
      const pdpVideoHtml = (hasImages && window.RG.productVideo)
        ? window.RG.productVideo.renderPdpVideoOverlay(product)
        : '';

      const mainGalleryHtml = hasImages
        ? `
            <div class="woocommerce-product-gallery__main" id="rg-gallery-main" data-rg-video-host title="Hover to magnify · Click to open full lightbox">
              <img src="${escHtml(heroImg.src)}" alt="${escHtml(heroImg.alt || product.name)}" id="rg-gallery-main-img" width="640" height="800">
              ${pdpVideoHtml}
              <div class="rg-magnifier-lens" id="rg-magnifier-lens"></div>
              <span class="rg-badge rg-badge--hand-finished" id="rg-gallery-badge-illustrative" style="position:absolute;inset-block-end:12px;inset-inline-start:12px;">Illustrative image</span>
              <span class="rg-badge rg-badge--hand-finished" id="rg-gallery-badge-zoom" style="position:absolute;inset-block-end:12px;inset-inline-end:12px;">Hover / Click Zoom</span>
            </div>
          `
        : `
            <div class="woocommerce-product-gallery__main is-media-pending" id="rg-gallery-main">
              ${window.RG.ui.renderMediaPlaceholder(product, 'gallery')}
            </div>
          `;

      const thumbStripHtml = showThumbStrip
        ? `
            <div class="${thumbsClass}">
              ${images.map((img, idx) => `
                <button type="button" class="woocommerce-product-gallery__thumb ${idx === 0 ? 'is-active' : ''}" data-rg-thumb="${escHtml(img.src)}" data-rg-thumb-alt="${escHtml(img.alt || product.name)}" data-rg-thumb-colour="${escHtml(img.colour || '')}">
                  <img src="${escHtml(img.src)}" alt="${escHtml(img.alt || product.name)}" width="120" height="120">
                </button>
              `).join('')}
              ${videoSpec ? `
                <button type="button" class="woocommerce-product-gallery__thumb rg-thumb--video" id="rg-video-thumb-btn" data-rg-video-src="${escHtml(videoSpec.src)}" data-rg-video-poster="${escHtml(videoSpec.poster || (heroImg ? heroImg.src : ''))}" title="Watch Craft Demonstration Video" style="position:relative;border:2px solid var(--rg-antique-gold);">
                  <img src="${escHtml(videoSpec.poster || (heroImg ? heroImg.src : ''))}" alt="Watch craft video" width="120" height="120" style="filter:brightness(0.7);">
                  <span style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFFFFF;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-block-end:2px;"><path d="M8 5v14l11-7z"/></svg>
                    ▶ Video
                  </span>
                </button>
              ` : ''}
            </div>
          `
        : '';

      container.innerHTML = `
        <div class="rg-single-product-grid">
          <!-- Gallery Column (.woocommerce-product-gallery) -->
          <div class="woocommerce-product-gallery">
            ${mainGalleryHtml}
            ${thumbStripHtml}
          </div>

          <!-- Summary Column (.summary.entry-summary) -->
          <div class="summary entry-summary">
            <!-- Badges -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-block-end:12px;">
              <a href="region.html?region=${product.region.toLowerCase()}" class="rg-badge rg-badge--new">${product.region} Origin</a>
              <span class="rg-badge rg-badge--handmade">${product.craft_type}</span>
              ${product.availability === 'made-to-order' ? '<span class="rg-badge rg-badge--mto">Made to order</span>' : '<span class="rg-badge rg-badge--verified">In Stock · Ready to ship</span>'}
            </div>

            <!-- Product Title -->
            <h1 class="product_title entry-title" style="margin-block-end:8px;font-size:clamp(1.6rem, 2.5vw, 2.2rem);line-height:1.25;">${product.name}</h1>

            <!-- Rating & SKU -->
            <div style="display:flex;align-items:center;gap:16px;margin-block-end:16px;font-size:var(--text-sm);">
              <a href="#tab-reviews" class="star-rating">★ ${product.rating.toFixed(1)} (${product.review_count} reviews)</a>
              <span style="color:var(--text-secondary);">SKU: ${product.sku}</span>
            </div>

            <!-- Price Display -->
            <div style="margin-block-end:14px;">
              <p class="price" style="font-size:var(--text-xl);margin:0;display:flex;align-items:baseline;gap:10px;">
                ${product.sale_price ? `<span style="font-size:1.85rem;font-weight:700;color:var(--brand-secondary);">${fmt(product.sale_price)}</span> <del style="font-size:var(--text-base);color:var(--text-secondary);">${fmt(product.regular_price)}</del>` : `<span class="woocommerce-Price-amount amount" style="font-size:1.85rem;font-weight:700;color:var(--brand-secondary);">${fmt(product.price)}</span>`}
              </p>
            </div>

            <!-- Crisp Short Description -->
            <div class="woocommerce-product-details__short-description" style="margin-block-end:16px;">
              <p style="font-size:var(--text-sm);line-height:1.6;color:var(--text-secondary);margin:0;">${product.short_description}</p>
            </div>

            <!-- Top 3 Key Highlights -->
            ${(product.highlights && product.highlights.length) ? `
              <ul style="list-style:none;padding:0;margin:0 0 20px 0;display:grid;gap:6px;">
                ${product.highlights.slice(0, 3).map((h) => `
                  <li style="display:flex;align-items:flex-start;gap:8px;font-size:var(--text-xs);color:var(--text-primary);line-height:1.4;">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#2E7D32" style="flex-shrink:0;transform:translateY(2px);"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    <span>${h}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}

            <form class="cart" id="rg-single-product-form">
              <div class="variations">
                <!-- Size Selector -->
                <div class="rg-size-selector" style="margin-block:0 16px;">
                  <div class="rg-size-selector__header">
                    <label style="font-weight:700;font-size:var(--text-sm);">Size: <span id="rg-selected-size-label">${sizes[0]}</span></label>
                    <button type="button" class="rg-btn rg-btn--outline rg-btn--sm" data-rg-open-size-guide="${product.size_guide_type}" style="min-height:30px;padding:3px 10px;font-size:12px;">
                      <svg width="14" height="14" aria-hidden="true"><use href="#icon-ruler"></use></svg>
                      Size Guide
                    </button>
                  </div>
                  <div class="rg-size-buttons" role="radiogroup" aria-label="Select size">
                    ${sizes.map((s, idx) => `
                      <button type="button" class="rg-size-btn ${idx === 0 ? 'is-selected' : ''}" data-rg-size-btn="${s}">${s}</button>
                    `).join('')}
                    ${unavail.map((u) => `
                      <button type="button" class="rg-size-btn is-disabled" disabled title="Currently out of stock in ${u}">${u}</button>
                    `).join('')}
                  </div>
                </div>

                <!-- Colour Swatches -->
                <div style="margin-block-end:20px;">
                  <label style="font-weight:700;font-size:var(--text-sm);display:block;margin-block-end:8px;">
                    Colour: <span id="rg-selected-colour-label">${colours[0]}</span>
                  </label>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${colours.map((c, idx) => `
                      <button type="button" class="rg-btn rg-btn--sm ${idx === 0 ? 'rg-btn--secondary' : 'rg-btn--outline'}" data-rg-colour-btn="${c}" data-rg-colour-idx="${idx}">
                        ${c.replace(/\s*\(#[0-9A-Fa-f]{6}\)/, '')}
                      </button>
                    `).join('')}
                  </div>
                </div>

                ${product.customisable ? `
                <!-- Optional Customisation -->
                <details style="background:var(--bg-secondary);padding:12px 16px;border-radius:var(--radius-card);border:1px solid var(--rg-border);margin-block-end:20px;">
                  <summary style="font-weight:600;font-size:var(--text-sm);cursor:pointer;">
                    + Optional Custom Tailoring Note
                  </summary>
                  <div style="margin-block-start:10px;display:grid;gap:8px;">
                    <input type="text" id="rg-custom-note-input" placeholder="E.g., Head 57.5cm, or preferred border thread colour" style="padding:8px 12px;border:1px solid var(--rg-border-strong);border-radius:var(--radius-editorial);background:var(--bg-elevated);font-size:var(--text-xs);">
                  </div>
                </details>
                ` : ''}
              </div>

              <!-- Add to Cart Row -->
              <div class="rg-cart-actions-row">
                <div class="quantity">
                  <button type="button" id="rg-qty-dec" aria-label="Decrease quantity">−</button>
                  <input type="number" id="rg-qty-input" class="input-text qty text" value="1" min="1" max="20" aria-label="Product quantity">
                  <button type="button" id="rg-qty-inc" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="single_add_to_cart_button button alt" id="rg-main-add-to-cart" style="flex:1;min-height:48px;font-size:var(--text-sm);font-weight:700;">
                  Add to Cart — ${fmt(product.price)}
                </button>
                <button type="button" class="rg-btn rg-btn--outline ${window.RG.wishlist && window.RG.wishlist.has(product.id) ? 'is-active' : ''}" data-rg-wishlist-toggle="${product.id}" aria-label="Add to Wishlist" aria-pressed="${window.RG.wishlist && window.RG.wishlist.has(product.id) ? 'true' : 'false'}" style="width:48px;height:48px;padding:0;display:inline-flex;align-items:center;justify-content:center;">
                  <svg width="20" height="20" aria-hidden="true"><use href="#icon-heart"></use></svg>
                </button>
              </div>

              <!-- Trust & Value Assurance Strip -->
              <div style="background:var(--bg-elevated);border:1px solid var(--rg-border);border-radius:var(--radius-card);padding:14px 16px;margin-block:18px 12px;display:grid;gap:10px;">
                <div style="display:flex;align-items:center;gap:10px;font-size:var(--text-xs);">
                  <svg width="18" height="18" aria-hidden="true" style="color:var(--brand-secondary);flex-shrink:0;"><use href="#icon-truck"></use></svg>
                  <span><strong>Tracked Delivery:</strong> Dispatches in 1–2 days · Free over PKR 5,000</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:var(--text-xs);">
                  <svg width="18" height="18" aria-hidden="true" style="color:var(--brand-secondary);flex-shrink:0;"><use href="#icon-shield"></use></svg>
                  <span><strong>7-Day Easy Exchange:</strong> Hassle-free size & fit replacement guarantee</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:var(--text-xs);">
                  <svg width="18" height="18" aria-hidden="true" style="color:var(--brand-secondary);flex-shrink:0;"><use href="#icon-sparkles"></use></svg>
                  <span><strong>Cash on Delivery (COD):</strong> Available nationwide</span>
                </div>
              </div>

              <!-- Gift wrap & WhatsApp -->
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding-block-start:4px;">
                <label style="font-size:var(--text-xs);display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--text-secondary);">
                  <input type="checkbox" id="rg-product-giftwrap"> Add heritage gift wrap (+PKR 300)
                </label>
                <a href="https://wa.me/${cfg.whatsappNumber}?text=${waText}" target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs);font-weight:600;color:#1E7E48;display:inline-flex;align-items:center;gap:4px;">
                  <svg width="15" height="15" aria-hidden="true"><use href="#icon-whatsapp"></use></svg> Need size help? WhatsApp Us
                </a>
              </div>
            </form>
          </div>
        </div>

        <!-- The Origin Card (.rg-origin-card) -->
        <aside class="rg-origin-card" aria-label="Product Origin & Provenance Card">
          <div class="rg-origin-card__header">
            <div class="rg-origin-card__title">
              <svg width="20" height="20" aria-hidden="true" style="color:var(--brand-secondary);"><use href="#icon-sparkles"></use></svg>
              <span>The Origin Card — ${escHtml(product.region)}</span>
              ${product.verified ? '<span class="rg-badge rg-badge--verified">✓ Verified Provenance</span>' : '<span class="rg-badge rg-badge--hand-finished">Regional Review in Progress</span>'}
            </div>
            <button type="button" class="rg-btn rg-btn--outline rg-btn--sm" id="rg-origin-flip-btn" aria-expanded="false">Flip to Valley Map ↻</button>
          </div>

          <div id="rg-origin-front">
            <div class="rg-origin-card__grid">
              <div class="rg-origin-card__item">
                <span class="rg-origin-card__label">01 · Who Made It</span>
                <span class="rg-origin-card__value">${artisan ? escHtml(artisan.name) : `${escHtml(product.region)} Partner Guild`}</span>
              </div>
              <div class="rg-origin-card__item">
                <span class="rg-origin-card__label">02 · Where It's From</span>
                <span class="rg-origin-card__value">${escHtml(product.district || product.region)}, Gilgit-Baltistan</span>
              </div>
              <div class="rg-origin-card__item">
                <span class="rg-origin-card__label">03 · What It's Made Of</span>
                <span class="rg-origin-card__value">${escHtml(materialText)}</span>
              </div>
              <div class="rg-origin-card__item">
                <span class="rg-origin-card__label">04 · Estimated Dispatch</span>
                <span class="rg-origin-card__value rg-tabular">${escHtml(estRange)}</span>
              </div>
            </div>
            ${artisan ? `
              <div class="rg-origin-card__artisan">
                <img src="${artisan.avatar}" alt="${escHtml(artisan.name)}" width="56" height="56">
                <div style="flex:1;min-width:0;">
                  <strong style="display:block;font-size:var(--text-sm);">${escHtml(artisan.name)}</strong>
                  <span style="font-size:var(--text-xs);color:var(--text-secondary);display:block;">${escHtml(artisan.craft)} · ${escHtml(artisan.valley || product.region)}</span>
                </div>
                <a href="artisan.html?id=${encodeURIComponent(artisan.id)}" class="rg-btn rg-btn--outline rg-btn--sm">Meet Maker →</a>
              </div>
            ` : ''}
          </div>

          <div id="rg-origin-back" hidden>
            <div class="rg-origin-card__item" style="margin-block-end:var(--space-4);">
              <span class="rg-origin-card__label">04 · What It Means (Cultural Context)</span>
              <p style="margin:6px 0 0;font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${escHtml(product.cultural_story)}</p>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
              <span style="font-size:var(--text-xs);color:var(--text-secondary);">Craft Classification: <strong style="color:var(--text-primary);">${escHtml(product.craft_type)}</strong> · SKU <span class="rg-tabular">${escHtml(product.sku)}</span></span>
              <a href="region.html?region=${encodeURIComponent(product.region.toLowerCase())}" class="rg-btn rg-btn--secondary rg-btn--sm">Explore ${escHtml(product.region)} Valley →</a>
            </div>
          </div>
        </aside>

        <!-- Clean 3-Tab Section (.woocommerce-tabs.wc-tabs-wrapper) -->
        <div class="woocommerce-tabs wc-tabs-wrapper">
          <ul class="tabs wc-tabs" role="tablist">
            <li class="active" data-rg-tab-li="specs" role="presentation"><button type="button" role="tab" id="rg-tab-btn-specs" aria-selected="true" aria-controls="rg-tab-panel-specs" tabindex="0" data-rg-tab-btn="specs">Product Details & Specs</button></li>
            <li data-rg-tab-li="shipping" role="presentation"><button type="button" role="tab" id="rg-tab-btn-shipping" aria-selected="false" aria-controls="rg-tab-panel-shipping" tabindex="-1" data-rg-tab-btn="shipping">Shipping & Returns</button></li>
            <li data-rg-tab-li="maker" role="presentation"><button type="button" role="tab" id="rg-tab-btn-maker" aria-selected="false" aria-controls="rg-tab-panel-maker" tabindex="-1" data-rg-tab-btn="maker">Artisan & Heritage</button></li>
          </ul>

          <!-- Tab 1: Specs -->
          <div class="woocommerce-Tabs-panel" role="tabpanel" id="rg-tab-panel-specs" aria-labelledby="rg-tab-btn-specs" data-rg-tab-panel="specs">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;align-items:start;">
              <div>
                <h3 style="font-size:var(--text-md);margin-block-end:10px;">About This Piece</h3>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-block-end:16px;">
                  ${cleanCraftSummary}
                </p>
                <h4 style="font-size:var(--text-sm);margin-block-end:8px;">Care Instructions</h4>
                <ul style="list-style:disc;padding-inline-start:18px;font-size:var(--text-xs);color:var(--text-secondary);display:grid;gap:6px;">
                  ${(product.care || ['Air outdoors in shade to refresh the natural fibers', 'Spot-clean marks with mild wool shampoo or dry clean']).map((c) => `<li>${c}</li>`).join('')}
                </ul>
              </div>

              <div>
                <h3 style="font-size:var(--text-md);margin-block-end:10px;">Technical Specifications</h3>
                <table class="shop_table cart">
                  <tbody>
                    <tr><th>Material</th><td>${materialText}</td></tr>
                    <tr><th>Technique</th><td>${(product.specs && product.specs.technique) || product.craft_type}</td></tr>
                    <tr><th>Dimensions</th><td>${(product.specs && product.specs.dimensions) || sizes.join(' · ')}</td></tr>
                    ${product.specs && product.specs.weight ? `<tr><th>Weight</th><td>${product.specs.weight}</td></tr>` : ''}
                    <tr><th>Origin</th><td>${product.district || product.region}, Gilgit-Baltistan</td></tr>
                    ${product.specs && product.specs.lining ? `<tr><th>Lining</th><td>${product.specs.lining}</td></tr>` : ''}
                    ${product.specs && product.specs.closure ? `<tr><th>Closure</th><td>${product.specs.closure}</td></tr>` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tab 2: Shipping & Returns -->
          <div class="woocommerce-Tabs-panel" role="tabpanel" id="rg-tab-panel-shipping" aria-labelledby="rg-tab-btn-shipping" data-rg-tab-panel="shipping" hidden>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-block-end:24px;">
              <div style="background:var(--bg-secondary);padding:18px 20px;border-radius:var(--radius-card);border:1px solid var(--rg-border);">
                <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-block-end:8px;color:var(--text-primary);">
                  <svg width="20" height="20" aria-hidden="true" style="color:var(--brand-secondary);"><use href="#icon-truck"></use></svg>
                  <span>Tracked Nationwide Delivery</span>
                </div>
                <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin:0;">
                  Dispatched within 1–2 working days. Major cities (Karachi, Lahore, Islamabad, Rawalpindi) arrive in 2–3 days via Leopards / TCS Tracked Courier.
                </p>
              </div>

              <div style="background:var(--bg-secondary);padding:18px 20px;border-radius:var(--radius-card);border:1px solid var(--rg-border);">
                <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-block-end:8px;color:var(--text-primary);">
                  <svg width="20" height="20" aria-hidden="true" style="color:var(--brand-secondary);"><use href="#icon-shield"></use></svg>
                  <span>Free Delivery Over PKR 5,000</span>
                </div>
                <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin:0;">
                  All domestic orders with a bag value of PKR 5,000 or above automatically qualify for free standard shipping.
                </p>
              </div>

              <div style="background:var(--bg-secondary);padding:18px 20px;border-radius:var(--radius-card);border:1px solid var(--rg-border);">
                <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-block-end:8px;color:var(--text-primary);">
                  <svg width="20" height="20" aria-hidden="true" style="color:var(--brand-secondary);"><use href="#icon-rotate-ccw"></use></svg>
                  <span>7-Day Easy Exchange Policy</span>
                </div>
                <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin:0;">
                  If the size doesn't feel right, contact our team within 7 days of delivery for a seamless exchange.
                </p>
              </div>
            </div>

            <!-- City Delivery Estimator -->
            <div style="background:var(--bg-elevated);border:1px solid var(--rg-border-strong);border-radius:var(--radius-card);padding:18px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:var(--text-xs);">
              <label for="rg-city-estimator" style="font-weight:700;color:var(--text-primary);">Calculate Delivery Estimate:</label>
              <select id="rg-city-estimator" style="padding:6px 12px;border:1px solid var(--rg-border-strong);border-radius:var(--radius-editorial);background:var(--bg-primary);font-size:var(--text-xs);">
                ${Object.keys(cfg.deliveryEstimates || {}).map((city) => `<option value="${city}">${city}</option>`).join('')}
              </select>
              <span id="rg-city-estimate-output" style="color:var(--brand-secondary);font-weight:600;">
                2–3 working days via Leopards / TCS Tracked
              </span>
            </div>
          </div>

          <!-- Tab 3: Artisan & Heritage -->
          <div class="woocommerce-Tabs-panel" role="tabpanel" id="rg-tab-panel-maker" aria-labelledby="rg-tab-btn-maker" data-rg-tab-panel="maker" hidden>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:start;">
              ${artisan ? `
                <div style="background:var(--bg-secondary);padding:20px;border-radius:var(--radius-card);border:1px solid var(--rg-border);display:flex;gap:16px;align-items:center;">
                  <img src="${artisan.avatar}" alt="${artisan.name}" width="64" height="64" style="border-radius:50%;object-fit:cover;border:2px solid var(--brand-secondary);">
                  <div>
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--brand-secondary);font-weight:700;">Crafted By</span>
                    <h4 style="margin:2px 0 4px;font-size:var(--text-base);"><a href="artisan.html?id=${artisan.id}">${artisan.name}</a></h4>
                    <p style="font-size:var(--text-xs);color:var(--text-secondary);margin:0 0 6px;">${artisan.craft} · ${artisan.experienceYears || '15+'} Years Experience</p>
                    <span class="rg-badge rg-badge--verified" style="font-size:11px;">✓ Fair-Wage Verified Workshop</span>
                  </div>
                </div>
              ` : ''}

              <div>
                <h4 style="font-size:var(--text-base);margin-block-end:8px;">Cultural Heritage · ${product.region}</h4>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin:0;">
                  ${product.cultural_story}
                </p>
                <div style="margin-block-start:12px;">
                  <a href="region.html?region=${product.region.toLowerCase()}" class="rg-btn rg-btn--outline rg-btn--sm" style="font-size:12px;">
                    Explore All ${product.region} Heritage Pieces →
                  </a>
                </div>
              </div>
            </div>

            ${product.faqs ? `
              <div style="margin-block-start:24px;">
                <h4 style="font-size:var(--text-base);margin-block-end:12px;">Frequently Asked Questions</h4>
                <div style="display:grid;gap:10px;">
                  ${product.faqs.map((fq) => `
                    <details style="background:var(--bg-secondary);padding:12px 16px;border-radius:var(--radius-card);border:1px solid var(--rg-border);">
                      <summary style="font-weight:600;font-size:var(--text-sm);cursor:pointer;">${fq.q}</summary>
                      <p style="margin:8px 0 0;font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5;">${fq.a}</p>
                    </details>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        ${pairProducts.length ? `
        <!-- Frequently Bought Together Ensemble -->
        <section style="background:var(--bg-elevated);border:1px solid var(--rg-border);border-radius:var(--radius-card);padding:24px;margin-block:28px;" aria-label="Frequently Bought Together">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-block-end:16px;">
            <div>
              <span class="rg-section__eyebrow" style="margin:0;">Curated Pairing</span>
              <h3 style="font-size:var(--text-lg);margin:0;">Frequently Bought Together</h3>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:var(--text-sm);color:var(--text-secondary);">Total Price:</span>
              <strong id="rg-bundle-total-price" style="font-size:var(--text-lg);color:var(--brand-secondary);">${fmt(product.price + pairProducts.reduce((s, p) => s + p.price, 0))}</strong>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;align-items:center;margin-block-end:20px;">
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-card);border:1px solid var(--rg-border);">
              ${heroImg
                ? `<img src="${escHtml(heroImg.src)}" alt="${escHtml(product.name)}" width="54" height="66" style="width:54px;height:66px;object-fit:cover;border-radius:6px;">`
                : `<span style="width:54px;height:66px;flex:0 0 54px;border-radius:6px;overflow:hidden;border:1px solid var(--rg-border);">${window.RG.ui.renderMediaPlaceholder(product, 'thumb')}</span>`}
              <div>
                <strong style="font-size:var(--text-xs);display:block;">${product.name}</strong>
                <span style="font-size:12px;color:var(--brand-secondary);font-weight:700;">${fmt(product.price)}</span>
                <span class="rg-badge rg-badge--verified" style="font-size:10px;margin-block-start:4px;">This Item</span>
              </div>
            </div>

            ${pairProducts.map((pp) => {
              const ppImg = pp.images && pp.images[0] && pp.images[0].src;
              return `
              <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-card);border:1px solid var(--rg-border);cursor:pointer;">
                <input type="checkbox" checked data-rg-bundle-check="${pp.id}" data-rg-bundle-price="${pp.price}" style="width:16px;height:16px;accent-color:var(--brand-secondary);">
                ${ppImg
                  ? `<img src="${escHtml(ppImg)}" alt="${escHtml(pp.name)}" width="54" height="66" style="width:54px;height:66px;object-fit:cover;border-radius:6px;">`
                  : `<span style="width:54px;height:66px;flex:0 0 54px;border-radius:6px;overflow:hidden;border:1px solid var(--rg-border);">${window.RG.ui.renderMediaPlaceholder(pp, 'thumb')}</span>`}
                <div style="flex:1;">
                  <strong style="font-size:var(--text-xs);display:block;">${pp.name}</strong>
                  <span style="font-size:12px;color:var(--brand-secondary);font-weight:700;">${fmt(pp.price)}</span>
                  <span style="font-size:11px;color:var(--text-secondary);display:block;">${pp.region}</span>
                </div>
              </label>
            `;
            }).join('')}
          </div>

          <button type="button" class="rg-btn rg-btn--secondary" id="rg-add-bundle-btn" style="width:100%;min-height:44px;font-size:var(--text-sm);">
            Add Selected Ensemble to Cart
          </button>
        </section>
        ` : ''}

        <!-- Reviews Section with Interactive Star Filter -->
        <section id="tab-reviews" style="padding-block:var(--space-8);border-block-start:1px solid var(--rg-border);">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px;margin-block-end:20px;">
            <div>
              <span class="rg-section__eyebrow">Customer Ratings</span>
              <h2>Customer Reviews</h2>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:4px 0 0;">Fit Meter Consensus: <strong>92% say True to Size</strong> (Runs small: 4% · Runs large: 4%)</p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="rg-btn rg-btn--secondary rg-btn--sm" data-rg-rev-filter="all" aria-pressed="true">All Stars</button>
              <button type="button" class="rg-btn rg-btn--outline rg-btn--sm" data-rg-rev-filter="5" aria-pressed="false">5 ★ Only</button>
              <button type="button" class="rg-btn rg-btn--outline rg-btn--sm" data-rg-rev-filter="4" aria-pressed="false">4 ★ Only</button>
              <button type="button" class="rg-btn rg-btn--outline rg-btn--sm" id="rg-toggle-review-form" aria-expanded="false">Write a Review</button>
            </div>
          </div>

          <form id="rg-demo-review-form" hidden style="background:var(--bg-secondary);padding:20px;border-radius:var(--radius-card);margin-block-end:24px;display:grid;gap:12px;">
            <h4>Submit a Customer Review</h4>
            <div class="rg-review-form-grid">
              <input type="text" aria-label="Your Name and City" placeholder="Your Name & City" required style="padding:10px;border:1px solid var(--rg-border-strong);border-radius:var(--radius-editorial);background:var(--bg-elevated);color:var(--text-primary);">
              <select aria-label="Star rating" style="padding:10px;border:1px solid var(--rg-border-strong);border-radius:var(--radius-editorial);background:var(--bg-elevated);color:var(--text-primary);">
                <option value="5">★★★★★ (5/5)</option>
                <option value="4">★★★★☆ (4/5)</option>
              </select>
            </div>
            <textarea rows="3" aria-label="Review comment" placeholder="Share how the size fit and what you thought of the wool/embroidery quality..." required style="padding:10px;border:1px solid var(--rg-border-strong);border-radius:var(--radius-editorial);background:var(--bg-elevated);color:var(--text-primary);"></textarea>
            <button type="submit" class="rg-btn rg-btn--primary rg-btn--sm" style="justify-self:start;">Submit Review</button>
          </form>

          <div class="rg-grid rg-grid--3" id="rg-pdp-reviews-list">
            ${reviews.map((r) => window.RG.ui.renderReviewCard(r)).join('')}
          </div>
          <p id="rg-pdp-reviews-empty" hidden style="text-align:center;padding:24px;background:var(--bg-elevated);border:1px solid var(--rg-border);border-radius:var(--radius-card);color:var(--text-secondary);">No reviews match that star rating filter yet.</p>
        </section>

        <!-- Sticky Add-to-Cart Bar on Scroll -->
        <div class="rg-sticky-pdp-bar" id="rg-sticky-pdp-bar">
          <div class="rg-container" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${heroImg
                ? `<img src="${escHtml(heroImg.src)}" alt="" width="40" height="48" style="width:40px;height:48px;object-fit:cover;border-radius:4px;">`
                : `<span style="width:40px;height:48px;flex:0 0 40px;border-radius:4px;overflow:hidden;border:1px solid var(--rg-border);">${window.RG.ui.renderMediaPlaceholder(product, 'thumb')}</span>`}
              <div>
                <strong style="font-size:var(--text-sm);display:block;">${product.name}</strong>
                <span style="font-size:12px;color:var(--text-secondary);">${product.region} · ${fmt(product.price)}</span>
              </div>
            </div>
            <button type="button" class="rg-btn rg-btn--primary rg-btn--sm" id="rg-sticky-add-btn">Add to Cart — ${fmt(product.price)}</button>
          </div>
        </div>
      `;

      this.bindProductInteractions(container, product, pairProducts);
      this.renderRelatedAndRecent(product);
    },

    bindProductInteractions(container, product, pairProducts) {
      const mainImg = document.getElementById('rg-gallery-main-img');
      const mainBox = document.getElementById('rg-gallery-main');
      const lens = document.getElementById('rg-magnifier-lens');

      // Hover Magnifier Lens
      if (mainBox && mainImg && lens) {
        mainBox.addEventListener('mousemove', (e) => {
          const rect = mainBox.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          lens.style.display = 'block';
          lens.style.left = `${Math.max(0, Math.min(rect.width - 150, x - 75))}px`;
          lens.style.top = `${Math.max(0, Math.min(rect.height - 150, y - 75))}px`;
          lens.style.backgroundImage = `url('${mainImg.src}')`;
          lens.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;
          lens.style.backgroundPosition = `-${x * 2 - 75}px -${y * 2 - 75}px`;
        });
        mainBox.addEventListener('mouseleave', () => {
          lens.style.display = 'none';
        });
      }

      // Gallery thumbnails & Video Toggle
      const videoThumbBtn = document.getElementById('rg-video-thumb-btn');

      const restoreImageGallery = () => {
        if (!mainBox) return;
        const overlayVideo = mainBox.querySelector('[data-rg-video-el="pdp"]');
        if (overlayVideo) {
          if (!overlayVideo.paused) overlayVideo.pause();
          overlayVideo.classList.remove('is-playing');
          mainBox.classList.remove('is-video-playing');
        }
        const currentVideo = mainBox.querySelector('video:not([data-rg-video-el])');
        if (currentVideo) currentVideo.remove();
        if (mainImg) mainImg.style.display = 'block';
        if (lens) lens.style.display = 'none';
        const illBadge = document.getElementById('rg-gallery-badge-illustrative');
        const zoomBadge = document.getElementById('rg-gallery-badge-zoom');
        if (illBadge) illBadge.style.display = 'inline-flex';
        if (zoomBadge) zoomBadge.style.display = 'inline-flex';
      };

      container.querySelectorAll('[data-rg-thumb]').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.woocommerce-product-gallery__thumb').forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          restoreImageGallery();
          if (mainImg) {
            mainImg.src = btn.getAttribute('data-rg-thumb');
            mainImg.alt = btn.getAttribute('data-rg-thumb-alt') || product.name;
          }
        });
      });

      // Mobile swipe gesture for main gallery
      if (mainBox) {
        let touchStartX = 0;
        let touchStartY = 0;
        mainBox.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }, { passive: true });

        mainBox.addEventListener('touchend', (e) => {
          if (!e.changedTouches || e.changedTouches.length === 0) return;
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;
          // Trigger when horizontal swipe is dominant and exceeds 35px threshold
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
            const thumbs = Array.from(container.querySelectorAll('.woocommerce-product-gallery__thumb'));
            if (thumbs.length > 1) {
              const activeIndex = thumbs.findIndex((t) => t.classList.contains('is-active'));
              let targetIndex = activeIndex;
              if (diffX < 0) {
                // Swipe left -> Next image
                targetIndex = (activeIndex + 1) % thumbs.length;
              } else {
                // Swipe right -> Previous image
                targetIndex = (activeIndex - 1 + thumbs.length) % thumbs.length;
              }
              thumbs[targetIndex].click();
            }
          }
        }, { passive: true });
      }

      if (videoThumbBtn) {
        videoThumbBtn.addEventListener('click', () => {
          container.querySelectorAll('.woocommerce-product-gallery__thumb').forEach((b) => b.classList.remove('is-active'));
          videoThumbBtn.classList.add('is-active');
          const overlayToggle = mainBox && mainBox.querySelector('[data-rg-pdp-video-toggle]');
          if (overlayToggle) {
            overlayToggle.click();
            return;
          }
          const vSrc = videoThumbBtn.getAttribute('data-rg-video-src');
          const vPoster = videoThumbBtn.getAttribute('data-rg-video-poster');
          if (!vSrc || !mainBox) return;

          if (mainImg) mainImg.style.display = 'none';
          if (lens) lens.style.display = 'none';

          const illBadge = document.getElementById('rg-gallery-badge-illustrative');
          const zoomBadge = document.getElementById('rg-gallery-badge-zoom');
          if (illBadge) illBadge.style.display = 'none';
          if (zoomBadge) zoomBadge.style.display = 'none';

          let vidEl = mainBox.querySelector('video');
          if (!vidEl) {
            vidEl = document.createElement('video');
            vidEl.src = vSrc;
            vidEl.poster = vPoster || '';
            vidEl.controls = true;
            vidEl.muted = true;
            vidEl.autoplay = true;
            vidEl.loop = true;
            vidEl.playsInline = true;
            vidEl.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--radius-card);display:block;';
            mainBox.appendChild(vidEl);
          } else {
            vidEl.play().catch(() => {});
          }
        });
      }

      // Lightbox zoom
      if (mainBox && mainImg) {
        mainBox.addEventListener('click', () => {
          const modal = document.getElementById('rg-quickview-modal');
          const body = document.getElementById('rg-quickview-body');
          if (modal && body) {
            body.innerHTML = `<img src="${mainImg.src}" alt="${mainImg.alt}" style="width:100%;max-height:78vh;object-fit:contain;margin-inline:auto;"><p style="text-align:center;font-size:12px;color:var(--text-secondary);margin-block-start:8px;">Illustrative image — ${product.name}</p>`;
            window.RG.ui.openModal('rg-quickview-modal');
          }
        });
      }

      // Size buttons
      container.querySelectorAll('[data-rg-size-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('[data-rg-size-btn]').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          const lbl = document.getElementById('rg-selected-size-label');
          if (lbl) lbl.textContent = btn.getAttribute('data-rg-size-btn');
        });
      });

      // Colour buttons (Colour-linked gallery swap)
      container.querySelectorAll('[data-rg-colour-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('[data-rg-colour-btn]').forEach((b) => {
            b.classList.remove('rg-btn--secondary');
            b.classList.add('rg-btn--outline');
          });
          btn.classList.add('rg-btn--secondary');
          btn.classList.remove('rg-btn--outline');
          const lbl = document.getElementById('rg-selected-colour-label');
          if (lbl) lbl.textContent = btn.getAttribute('data-rg-colour-btn');
          const colLabel = String(btn.getAttribute('data-rg-colour-btn') || '').replace(/\s*\(#[0-9A-Fa-f]{6}\)/, '').trim().toLowerCase();
          const images = Array.isArray(product.images) ? product.images.filter((im) => im && im.src) : [];
          const matchedIdx = images.findIndex((im) => im.colour && im.colour.toLowerCase() === colLabel);
          if (matchedIdx >= 0 && images[matchedIdx] && mainImg) {
            restoreImageGallery();
            const thumbs = container.querySelectorAll('.woocommerce-product-gallery__thumb[data-rg-thumb]');
            thumbs.forEach((b, bIdx) => b.classList.toggle('is-active', bIdx === matchedIdx));
            const vThumb = document.getElementById('rg-video-thumb-btn');
            if (vThumb) vThumb.classList.remove('is-active');
            mainImg.src = images[matchedIdx].src;
            mainImg.alt = images[matchedIdx].alt || product.name;
          }
        });
      });

      // Origin Card Flip
      const flipBtn = document.getElementById('rg-origin-flip-btn');
      const front = document.getElementById('rg-origin-front');
      const back = document.getElementById('rg-origin-back');
      if (flipBtn && front && back) {
        flipBtn.addEventListener('click', () => {
          const showingFront = !front.hidden;
          front.hidden = showingFront;
          back.hidden = !showingFront;
          flipBtn.setAttribute('aria-expanded', String(showingFront));
          flipBtn.textContent = showingFront ? 'Back to Origin Details ↺' : 'Flip to Valley Map ↻';
        });
      }

      // Bundle Builder
      const bundleChecks = container.querySelectorAll('[data-rg-bundle-check]');
      const bundleTotalEl = document.getElementById('rg-bundle-total-price');
      const addBundleBtn = document.getElementById('rg-add-bundle-btn');
      if (bundleChecks.length && bundleTotalEl) {
        const recalc = () => {
          let sum = product.price;
          bundleChecks.forEach((chk) => {
            if (chk.checked) sum += Number(chk.getAttribute('data-rg-bundle-price')) || 0;
          });
          bundleTotalEl.textContent = window.RG.data.formatPKR(sum);
        };
        bundleChecks.forEach((c) => c.addEventListener('change', recalc));
      }
      if (addBundleBtn) {
        addBundleBtn.addEventListener('click', () => {
          window.RG.cart.addItem(product.id, 1);
          bundleChecks.forEach((chk) => {
            if (chk.checked) window.RG.cart.addItem(Number(chk.getAttribute('data-rg-bundle-check')), 1);
          });
          window.RG.ui.openDrawer('rg-minicart-drawer');
          window.RG.ui.toast(`Added to your cart: ${product.name} ensemble.`, { viewCart: true });
        });
      }

      // City estimator
      const citySel = document.getElementById('rg-city-estimator');
      const cityOut = document.getElementById('rg-city-estimate-output');
      if (citySel && cityOut) {
        citySel.addEventListener('change', () => {
          const est = (window.RG.data.getConfig().deliveryEstimates || {})[citySel.value];
          if (est) cityOut.textContent = `${est.ready} via ${est.courier}`;
        });
      }

      // Quantity stepper
      const qtyInput = document.getElementById('rg-qty-input');
      const decBtn = document.getElementById('rg-qty-dec');
      const incBtn = document.getElementById('rg-qty-inc');
      if (qtyInput && decBtn && incBtn) {
        decBtn.addEventListener('click', () => {
          qtyInput.value = String(Math.max(1, Number(qtyInput.value) - 1));
        });
        incBtn.addEventListener('click', () => {
          qtyInput.value = String(Math.min(20, Number(qtyInput.value) + 1));
        });
      }

      // Main Add to Cart
      const triggerMainAdd = () => {
        const sizeEl = container.querySelector('[data-rg-size-btn].is-selected');
        const colEl = container.querySelector('[data-rg-colour-btn].rg-btn--secondary');
        const customEl = document.getElementById('rg-custom-note-input');
        const wrapEl = document.getElementById('rg-product-giftwrap');
        const rawQty = qtyInput ? Math.trunc(Number(qtyInput.value)) : 1;
        const qty = Number.isFinite(rawQty) ? Math.max(1, Math.min(20, rawQty)) : 1;
        if (qtyInput && Number(qtyInput.value) !== qty) qtyInput.value = String(qty);

        const availableSizes = (product.attributes && product.attributes.size) || ['Standard'];
        if (availableSizes.length > 1 && !sizeEl) {
          window.RG.ui.toast('Please choose a size. Not sure? Open the size guide.');
          return;
        }
        const size = sizeEl ? sizeEl.getAttribute('data-rg-size-btn') : 'Standard';
        const colour = colEl ? colEl.getAttribute('data-rg-colour-btn') : 'Default';
        const customNote = customEl ? customEl.value.trim() : '';

        window.RG.cart.addItem(product.id, qty, { size, colour, customNote });
        if (wrapEl && wrapEl.checked) {
          window.RG.cart.setGiftWrap(true);
        }
        window.RG.ui.openDrawer('rg-minicart-drawer');
        window.RG.ui.toast(`Added to your cart: ${product.name}, ${size}. View cart`, { viewCart: true });
        document.querySelectorAll('[data-rg-cart-count]').forEach((b) => {
          b.classList.add('is-bouncing');
          setTimeout(() => b.classList.remove('is-bouncing'), 400);
        });
      };

      const addBtn = document.getElementById('rg-main-add-to-cart');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          window.RG.ui.animateFlyToCart(addBtn);
          triggerMainAdd();
        });
      }

      const stickyAddBtn = document.getElementById('rg-sticky-add-btn');
      if (stickyAddBtn) {
        stickyAddBtn.addEventListener('click', triggerMainAdd);
      }

      // Sticky PDP bar visibility on scroll
      const stickyBar = document.getElementById('rg-sticky-pdp-bar');
      if (stickyBar && addBtn) {
        window.addEventListener('scroll', () => {
          const rect = addBtn.getBoundingClientRect();
          stickyBar.classList.toggle('is-visible', rect.bottom < 0);
        }, { passive: true });
      }

      // Tabs (WAI-ARIA Keyboard + Click)
      const tabBtns = Array.from(container.querySelectorAll('[data-rg-tab-btn]'));
      const activatePdpTab = (target, focusTab) => {
        container.querySelectorAll('[data-rg-tab-li]').forEach((li) => {
          li.classList.toggle('active', li.getAttribute('data-rg-tab-li') === target);
        });
        tabBtns.forEach((b) => {
          const isMatch = b.getAttribute('data-rg-tab-btn') === target;
          b.setAttribute('aria-selected', String(isMatch));
          b.setAttribute('tabindex', isMatch ? '0' : '-1');
          if (isMatch && focusTab) b.focus();
        });
        container.querySelectorAll('[data-rg-tab-panel]').forEach((panel) => {
          panel.hidden = panel.getAttribute('data-rg-tab-panel') !== target;
        });
      };

      tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => activatePdpTab(btn.getAttribute('data-rg-tab-btn'), false));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            activatePdpTab(tabBtns[(idx + 1) % tabBtns.length].getAttribute('data-rg-tab-btn'), true);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            activatePdpTab(tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length].getAttribute('data-rg-tab-btn'), true);
          } else if (e.key === 'Home') {
            e.preventDefault();
            activatePdpTab(tabBtns[0].getAttribute('data-rg-tab-btn'), true);
          } else if (e.key === 'End') {
            e.preventDefault();
            activatePdpTab(tabBtns[tabBtns.length - 1].getAttribute('data-rg-tab-btn'), true);
          }
        });
      });

      // Interactive Review Star Filter
      container.querySelectorAll('[data-rg-rev-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rating = btn.getAttribute('data-rg-rev-filter');
          container.querySelectorAll('[data-rg-rev-filter]').forEach((b) => {
            b.classList.toggle('rg-btn--secondary', b === btn);
            b.classList.toggle('rg-btn--outline', b !== btn);
            b.setAttribute('aria-pressed', String(b === btn));
          });
          let shownCount = 0;
          container.querySelectorAll('[data-review-rating]').forEach((card) => {
            const hidden = rating !== 'all' && card.getAttribute('data-review-rating') !== rating;
            card.hidden = hidden;
            if (!hidden) shownCount++;
          });
          const emptyRev = document.getElementById('rg-pdp-reviews-empty');
          if (emptyRev) emptyRev.hidden = shownCount > 0;
        });
      });

      // Mount Product Video Showcase inside gallery
      if (window.RG.productVideo) {
        window.RG.productVideo.mount(container);
      }

      // Review form toggle
      const revToggle = document.getElementById('rg-toggle-review-form');
      const revForm = document.getElementById('rg-demo-review-form');
      if (revToggle && revForm) {
        revToggle.addEventListener('click', () => {
          revForm.hidden = !revForm.hidden;
          revToggle.setAttribute('aria-expanded', String(!revForm.hidden));
        });
        revForm.addEventListener('submit', (e) => {
          e.preventDefault();
          revForm.hidden = true;
          revToggle.setAttribute('aria-expanded', 'false');
          window.RG.ui.toast('Thank you! Your review was submitted for moderation.');
        });
      }
    },

    renderRelatedAndRecent(product) {
      const relatedGrid = document.getElementById('rg-related-products-grid');
      if (relatedGrid) {
        const others = window.RG.data.getProducts()
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
        relatedGrid.innerHTML = others.map((p) => window.RG.ui.renderProductCard(p)).join('');
      }

      const recentGrid = document.getElementById('rg-recently-viewed-grid');
      if (recentGrid) {
        const recents = window.RG.wishlist.getRecentlyViewed(product.id);
        const headingWrap = recentGrid.closest('.upsells.products')?.querySelector('.rg-section__header p, .rg-section__header .rg-section__eyebrow');
        if (!recents.length && headingWrap) {
          headingWrap.textContent = 'Popular Picks While You Browse';
        }
        const list = recents.length ? recents.slice(0, 4) : window.RG.data.getProducts().filter((p) => p.id !== product.id).slice(4, 8);
        recentGrid.innerHTML = list.map((p) => window.RG.ui.renderProductCard(p)).join('');
      }
      if (window.RG.productVideo) {
        window.RG.productVideo.mount(document);
      }
    },

    injectJsonLd(product) {
      const existing = document.getElementById('rg-product-jsonld');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'rg-product-jsonld';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        sku: product.sku,
        description: product.short_description,
        brand: { '@type': 'Brand', name: 'ReGongches' },
        countryOfOrigin: 'Pakistan',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: product.price,
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.review_count
        }
      });
      document.head.appendChild(script);
    }
  };

  window.RG = window.RG || {};
  window.RG.productPage = RGProductPage;
})(window, document);
