/* ==========================================================================
   ReGongches Homepage Scene Rail Controller (assets/js/scene-rail.js)
   Extracted from inline script for strict script-src 'self' CSP compliance.
   ========================================================================== */
(function () {
  'use strict';

  // ── 20 Products: 6 Left, 8 Main Crafts (Center), 6 Right ────────
  const SR_PRODUCTS = [
    // ── LEFT WING (Items 1–6) ──────────────────────────────────
    {
      id: 'highland-mittens',
      name: 'Highland Wool Mittens',
      craft: 'Winter Accessories',
      isMain: false,
      desc: 'Dense hand-knitted sheep wool mittens for bitter high-altitude cold, lined with soft brushed wool.',
      region: 'Skardu, Baltistan',
      price: 'PKR 1,800',
      img: '',
      href: 'shop.html?category=Accessories',
      sizes: ['S/M', 'L/XL'],
      defaultSize: 'S/M',
    },
    {
      id: 'wool-jacket',
      name: 'Hand-Woven Wool Jacket',
      craft: 'Outerwear',
      isMain: false,
      desc: 'Dense mountain wool jacket with tailored structured shoulders and genuine bone buttons.',
      region: 'Hunza Valley',
      price: 'PKR 12,500',
      img: 'assets/img/products/hand-woven-wool-jacket/hand-woven-wool-jacket-detail.webp',
      href: 'shop.html?category=Outerwear',
      sizes: ['S', 'M', 'L', 'XL'],
      defaultSize: 'M',
    },
    {
      id: 'balti-cap',
      name: 'Balti Woollen Cap',
      craft: 'Caps & Headwear',
      isMain: false,
      desc: 'Traditional round Balti wool cap woven from unbleached natural oatmeal fleece in Skardu.',
      region: 'Baltistan',
      price: 'PKR 2,200',
      img: 'assets/img/products/balti-woollen-cap/balti-woollen-cap-hero-oatmeal.webp',
      href: 'category.html?cat=Caps+%26+Headwear',
      sizes: ['54 cm', '56 cm', '58 cm', '60 cm'],
      defaultSize: '56 cm',
    },
    {
      id: 'coin-purse',
      name: 'Embroidered Coin Purse',
      craft: 'Textile Accessories',
      isMain: false,
      desc: 'Miniature geometric silk-stitch coin pouch crafted by women artisan cooperatives in Gojal.',
      region: 'Gojal Valley',
      price: 'PKR 1,400',
      img: '',
      href: 'category.html?cat=Textile+Accessories',
      sizes: ['Standard'],
      defaultSize: 'Standard',
    },
    {
      id: 'wool-muffler',
      name: 'Hand-Woven Wool Muffler',
      craft: 'Shawls & Scarves',
      isMain: false,
      desc: 'Soft brushed sheep-wool scarf with twisted fringe ends, naturally charcoal-dyed.',
      region: 'Nagar Valley',
      price: 'PKR 3,200',
      img: 'assets/img/products/hand-woven-wool-muffler/hand-woven-wool-muffler-detail.webp',
      href: 'category.html?cat=Shawls+%26+Scarves',
      sizes: ['Free Size'],
      defaultSize: 'Free Size',
    },
    {
      id: 'womens-waistcoat',
      name: "Embroidered Women's Waistcoat",
      craft: 'Waistcoats & Outerwear',
      isMain: false,
      desc: 'Fitted black wool vest detailed with vibrant cross-stitch mountain floral borders.',
      region: 'Hunza Valley',
      price: 'PKR 7,500',
      img: 'assets/img/products/embroidered-womens-waistcoat/embroidered-womens-waistcoat-hero-black.webp',
      href: 'category.html?cat=Waistcoats+%26+Outerwear',
      sizes: ['S', 'M', 'L'],
      defaultSize: 'S',
    },

    // ── 8 MAIN CRAFTS (Items 7–14: Centered by default) ─────────
    {
      id: 'traditional-dresses',
      name: 'Karimabad Silk Kameez',
      craft: 'Traditional Dresses',
      isMain: true,
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
      isMain: true,
      desc: 'Rolled wool Gilgiti caps, embroidered caps and headwear, sized by head circumference.',
      region: 'Gilgit District',
      price: 'PKR 2,500',
      img: 'assets/img/products/traditional-gilgiti-cap-1.webp',
      href: 'category.html?cat=Caps+%26+Headwear',
      sizes: ['54 cm (S)', '56 cm (M)', '58 cm (L)', '60 cm (XL)'],
      defaultSize: '56 cm (M)',
    },
    {
      id: 'embroidered-shawl',
      name: 'Embroidered Wool Shawl',
      craft: 'Shawls & Scarves',
      isMain: true,
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
      isMain: true,
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
      isMain: true,
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
      isMain: true,
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
      isMain: true,
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
      isMain: true,
      desc: 'Made-to-measure pieces for weddings, Eid and cultural events. Book 3–5 weeks ahead.',
      region: 'Hunza Valley',
      price: 'PKR 22,000',
      img: 'assets/img/products/hunza-embroidered-festive-chugha-1.webp',
      href: 'custom-orders.html',
      sizes: ['Made to Measure', 'Bespoke'],
      defaultSize: 'Made to Measure',
    },

    // ── RIGHT WING (Items 15–20) ─────────────────────────────────
    {
      id: 'lightweight-stole',
      name: 'Lightweight Stole',
      craft: 'Shawls & Scarves',
      isMain: false,
      desc: 'Feather-light fine merino stole with delicate needlepoint vine motif in dusty rose.',
      region: 'Hunza Valley',
      price: 'PKR 5,400',
      img: 'assets/img/products/embroidered-lightweight-stole/embroidered-lightweight-stole-detail.webp',
      href: 'category.html?cat=Shawls+%26+Scarves',
      sizes: ['Free Size'],
      defaultSize: 'Free Size',
    },
    {
      id: 'grooms-cap',
      name: "Groom's Cap with Plume",
      craft: 'Caps & Headwear',
      isMain: false,
      desc: 'Ceremonial cream Gilgiti cap with an ornate antique metal pin and traditional white plume.',
      region: 'Gilgit District',
      price: 'PKR 3,800',
      img: 'assets/img/products/grooms-gilgiti-cap-plume/grooms-gilgiti-cap-plume-hero-cream.webp',
      href: 'category.html?cat=Caps+%26+Headwear',
      sizes: ['56 cm (M)', '58 cm (L)', '60 cm (XL)'],
      defaultSize: '58 cm (L)',
    },
    {
      id: 'wool-belt',
      name: 'Hand-Woven Wool Belt',
      craft: 'Textile Accessories',
      isMain: false,
      desc: 'Tablet-woven wool waistband with braided tassels, traditionally worn with chughas and waistcoats.',
      region: 'Gojal Valley',
      price: 'PKR 2,400',
      img: '',
      href: 'category.html?cat=Textile+Accessories',
      sizes: ['110 cm', '130 cm'],
      defaultSize: '110 cm',
    },
    {
      id: 'table-runner',
      name: 'Loomed Table Runner',
      craft: 'Home Textiles',
      isMain: false,
      desc: 'Natural unbleached sheep wool table runner with traditional mountain geometric border bands.',
      region: 'Shigar Valley',
      price: 'PKR 4,200',
      img: 'assets/img/products/hand-woven-wool-table-runner/hand-woven-wool-table-runner-hero-natural.webp',
      href: 'category.html?cat=Home+Textiles',
      sizes: ['14×54"', '14×72"'],
      defaultSize: '14×54"',
    },
    {
      id: 'keepsake-box',
      name: 'Mountain Keepsake Box',
      craft: 'Heritage Gifts',
      isMain: false,
      desc: 'Hand-carved walnut wood keepsake box wrapped with an embroidered wool ribbon and seal.',
      region: 'Gilgit-Baltistan',
      price: 'PKR 4,500',
      img: '',
      href: 'gift-sets.html',
      sizes: ['Small (6×4")', 'Medium (8×6")'],
      defaultSize: 'Medium (8×6")',
    },
    {
      id: 'bridal-ensemble',
      name: 'Bridal Ceremonial Ensemble',
      craft: 'Custom & Festive Wear',
      isMain: false,
      desc: 'Opulent heirloom bridal kurta, dupatta and pattu coat with heavy gold tilla wirework.',
      region: 'Hunza Valley',
      price: 'PKR 35,000',
      img: 'assets/img/products/bridal-ceremonial-ensemble/bridal-ceremonial-ensemble-hero-maroon-gold.webp',
      href: 'custom-orders.html',
      sizes: ['Bespoke Order'],
      defaultSize: 'Bespoke Order',
    },
  ];

  function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  const stage = document.getElementById('sr-stage');
  const rail = document.getElementById('sr-rail');
  const activeName = document.getElementById('sr-active-name');
  const activePrice = document.getElementById('sr-active-price');
  const hint = document.getElementById('sr-hint');
  const dotsContainer = document.getElementById('sr-dots');
  const overlay = document.getElementById('sr-qv-overlay');

  if (!stage || !rail || !overlay) return;

  // Render progress dots (20 total, distinct style for the 8 main)
  SR_PRODUCTS.forEach((p, i) => {
    const dot = document.createElement('div');
    dot.className = 'sr-dot' + (p.isMain ? ' is-main' : '') + (i === 6 ? ' is-active' : '');
    dot.title = p.craft + ': ' + p.name;
    dot.addEventListener('click', () => {
      const items = rail.querySelectorAll('.sr-item');
      if (items[i]) {
        const maxScroll = rail.scrollWidth - rail.clientWidth;
        const target = items[i].offsetLeft - rail.clientWidth / 2 + items[i].offsetWidth / 2;
        targetScroll = Math.max(0, Math.min(maxScroll, target));
        setActiveProduct(p, i);
      }
    });
    if (dotsContainer) dotsContainer.appendChild(dot);
  });

  function setActiveDot(index) {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.sr-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function setActiveProduct(p, index) {
    if (activeName) activeName.textContent = p.craft + ' — ' + p.name;
    if (activePrice) activePrice.textContent = p.price;
    if (hint) {
      hint.textContent = p.region + ' · Piece ' + (index + 1) + ' of ' + SR_PRODUCTS.length + ' · Click to inspect';
    }
    setActiveDot(index);
  }

  // Render hanging garments on the rail
  SR_PRODUCTS.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'sr-item' + (p.isMain ? ' is-main-craft' : '');
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', p.craft + ': ' + p.name + ', ' + p.price);

    // SVG hanger hook & wire
    item.innerHTML = `
      <svg class="sr-item__hanger" viewBox="0 0 52 38" fill="none" aria-hidden="true">
        <path d="M26,14 C26,5 29,1 32,1 C35,1 36,4 35,7 C33.5,11 26,15 26,19" stroke="#B8913A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M26,19 L3,36 L49,36 Z" stroke="#8a7350" stroke-width="2.2" stroke-linejoin="round" fill="rgba(184,145,58,0.12)"/>
        <circle cx="26" cy="19" r="2.5" fill="#B8913A"/>
      </svg>
      <div class="sr-item__card">
        <div class="sr-item__img-wrap">
          ${p.img
            ? `<img src="${escHtml(p.img)}" alt="${escHtml(p.name)}" class="sr-item__img" loading="lazy" width="110" height="156">`
            : `<div class="rg-media-pending rg-media-pending--thumb" aria-label="${escHtml(p.name)} — Photo pending"><span class="rg-media-pending__icon" aria-hidden="true"><svg width="16" height="16"><use href="#icon-sparkles"></use></svg></span></div>`}
        </div>
        <div class="sr-item__craft-tag" title="${escHtml(p.craft)}">${escHtml(p.craft)}</div>
      </div>
    `;

    item.addEventListener('mouseenter', () => setActiveProduct(p, idx));
    item.addEventListener('focus', () => setActiveProduct(p, idx));

    item.addEventListener('click', () => {
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

  // ── Physics & Cursor Smooth Motion Engine ────────────────────────
  let currentScroll = 0;
  let targetScroll = 0;
  let mainCenterScroll = 0;
  let isDragging = false;
  let hasInitialized = false;

  function calcMainCenterScroll() {
    const items = rail.querySelectorAll('.sr-item');
    if (items.length >= 14) {
      const itemFirst = items[6];
      const itemLast = items[13];
      const mainMiddle = (itemFirst.offsetLeft + itemLast.offsetLeft + itemLast.offsetWidth) / 2;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      mainCenterScroll = Math.max(0, Math.min(maxScroll, mainMiddle - rail.clientWidth / 2));
    } else {
      mainCenterScroll = Math.max(0, (rail.scrollWidth - rail.clientWidth) / 2);
    }
    return mainCenterScroll;
  }

  function initPosition() {
    calcMainCenterScroll();
    currentScroll = mainCenterScroll;
    targetScroll = mainCenterScroll;
    rail.scrollLeft = mainCenterScroll;
    hasInitialized = true;
    if (SR_PRODUCTS[6]) {
      setActiveProduct(SR_PRODUCTS[6], 6);
    }
  }

  window.addEventListener('load', initPosition);
  window.addEventListener('resize', () => {
    calcMainCenterScroll();
    targetScroll = mainCenterScroll;
  });

  setTimeout(() => {
    if (!hasInitialized || rail.scrollLeft === 0) {
      initPosition();
    }
  }, 300);

  function animateRail() {
    if (!isDragging) {
      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) > 0.25) {
        currentScroll += diff * 0.075;
        rail.scrollLeft = currentScroll;
      }
    } else {
      currentScroll = rail.scrollLeft;
      targetScroll = rail.scrollLeft;
    }
    requestAnimationFrame(animateRail);
  }
  requestAnimationFrame(animateRail);

  stage.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const rect = stage.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);

    if (ratio >= 0.38 && ratio <= 0.62) {
      targetScroll = mainCenterScroll;
    } else if (ratio < 0.38) {
      const norm = ratio / 0.38;
      const eased = Math.pow(norm, 1.3);
      targetScroll = mainCenterScroll * eased;
    } else {
      const norm = (ratio - 0.62) / 0.38;
      const eased = Math.pow(norm, 1.3);
      targetScroll = mainCenterScroll + (maxScroll - mainCenterScroll) * eased;
    }
  });

  stage.addEventListener('mouseleave', () => {
    if (!isDragging) {
      targetScroll = mainCenterScroll;
    }
  });

  let isDown = false;
  let startX;
  let scrollLeftVal;

  rail.addEventListener('mousedown', (e) => {
    isDown = true;
    isDragging = false;
    rail.classList.add('is-dragging');
    startX = e.pageX - rail.offsetLeft;
    scrollLeftVal = rail.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    rail.classList.remove('is-dragging');
    setTimeout(() => {
      isDragging = false;
    }, 60);
  });

  rail.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - rail.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) isDragging = true;
    rail.scrollLeft = scrollLeftVal - walk;
    currentScroll = rail.scrollLeft;
    targetScroll = rail.scrollLeft;
  });

  rail.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY * 0.9));
    },
    { passive: false }
  );

  // Quick View modal
  const qvImg = document.getElementById('sr-qv-img');
  const qvOriginNote = document.getElementById('sr-qv-origin-note');
  const qvName = document.getElementById('sr-qv-name');
  const qvPrice = document.getElementById('sr-qv-price');
  const qvDesc = document.getElementById('sr-qv-desc');
  const qvRegion = document.getElementById('sr-qv-region');
  const qvCounter = document.getElementById('sr-qv-counter');
  const qvSizes = document.getElementById('sr-qv-sizes');
  const qvProductLabel = document.getElementById('sr-qv-product-label');
  const qvProductLink = document.getElementById('sr-qv-product-link');
  const qvAtc = document.getElementById('sr-qv-atc');
  let activeQvProduct = null;
  let lastQvTrigger = null;

  function setQvView(viewMode) {
    const isOrigin = viewMode === 'origin';
    if (qvImg) qvImg.hidden = isOrigin;
    if (qvOriginNote) qvOriginNote.hidden = !isOrigin;
    document.querySelectorAll('[data-qv-view]').forEach((t) => {
      const match = t.getAttribute('data-qv-view') === viewMode;
      t.classList.toggle('is-active', match);
      t.setAttribute('aria-selected', String(match));
    });
  }

  function findCatalogMatch(srItem) {
    if (!window.RG || !window.RG.data || !window.RG.data.getProducts) return null;
    const all = window.RG.data.getProducts();
    const nameLower = String(srItem.name || '').toLowerCase();
    return (
      all.find((p) => p.name.toLowerCase().includes(nameLower) || nameLower.includes(p.name.toLowerCase())) ||
      all.find((p) => p.categories.some((c) => c.toLowerCase() === String(srItem.craft || '').toLowerCase())) ||
      all[0]
    );
  }

  function openQuickView(p, idx) {
    activeQvProduct = p;
    lastQvTrigger = document.activeElement;
    if (qvImg) {
      if (p.img) {
        qvImg.hidden = false;
        qvImg.src = p.img;
        qvImg.alt = p.name;
      } else {
        qvImg.hidden = true;
        qvImg.removeAttribute('src');
      }
    }
    if (qvName) qvName.textContent = p.name;
    if (qvPrice) qvPrice.textContent = p.price;
    if (qvDesc) qvDesc.textContent = p.desc;
    if (qvRegion) qvRegion.textContent = p.region + ' · ' + p.craft;
    if (qvCounter) {
      qvCounter.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(SR_PRODUCTS.length).padStart(2, '0');
    }
    if (qvProductLabel) qvProductLabel.textContent = p.craft;
    if (qvOriginNote) {
      qvOriginNote.innerHTML = `<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">${escHtml(p.region)} · ${escHtml(p.craft)}</strong><span>${escHtml(p.desc)}</span><div style="margin-top:10px;font-size:12px;color:var(--brand-accent-text);">Handcrafted mountain provenance · Size range: ${escHtml(p.sizes.join(', '))}</div>`;
    }
    setQvView('front');

    const matched = findCatalogMatch(p);
    if (qvProductLink) {
      qvProductLink.href = matched ? `product.html?id=${encodeURIComponent(matched.id)}` : p.href;
      qvProductLink.textContent = matched ? 'View Full Piece →' : 'Explore ' + p.craft + ' →';
    }

    if (qvSizes) {
      qvSizes.innerHTML = '';
      p.sizes.forEach((s) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sr-qv__size-btn' + (s === p.defaultSize ? ' is-selected' : '');
        btn.dataset.size = s;
        btn.textContent = s;
        btn.addEventListener('click', () => {
          qvSizes.querySelectorAll('.sr-qv__size-btn').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
        });
        qvSizes.appendChild(btn);
      });
    }

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const closeEl = document.getElementById('sr-qv-close');
      if (closeEl) closeEl.focus({ preventScroll: true });
    }, 50);
  }

  function closeQuickView() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastQvTrigger && document.contains(lastQvTrigger) && typeof lastQvTrigger.focus === 'function') {
      lastQvTrigger.focus({ preventScroll: true });
    }
    lastQvTrigger = null;
  }

  const qvClose = document.getElementById('sr-qv-close');
  if (qvClose) qvClose.addEventListener('click', closeQuickView);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeQuickView();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeQuickView();
  });

  document.querySelectorAll('[data-qv-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setQvView(tab.getAttribute('data-qv-view') || 'front');
    });
  });

  if (qvAtc) {
    qvAtc.addEventListener('click', () => {
      const sel = qvSizes ? qvSizes.querySelector('.is-selected') : null;
      if (!sel) {
        qvAtc.textContent = 'Please select a size';
        return;
      }
      if (activeQvProduct && window.RG && window.RG.cart) {
        const matched = findCatalogMatch(activeQvProduct);
        if (matched) {
          window.RG.cart.addItem(matched.id, 1, { size: sel.dataset.size });
          if (window.RG.ui && window.RG.ui.toast) {
            window.RG.ui.toast(`Added to your cart: ${matched.name} (${sel.dataset.size})`, { viewCart: true });
          }
        }
      }
      qvAtc.innerHTML = '✓ Added to Cart';
      qvAtc.style.background = 'var(--rg-success)';
      setTimeout(() => {
        qvAtc.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart';
        qvAtc.style.background = '';
      }, 2000);
    });
  }
})();
