/* ==========================================================================
   ReGongches UI Architecture & Presentation Controller — js/ui.js
   Security-hardened frontend controller: Zero DOM XSS, zero inline handlers,
   native <dialog> modals, slide-over cart drawer, and Pakistani checkout logic.
   ========================================================================== */
(function (window, document) {
  'use strict';

  // ── 1. DOM Security & Sanitization Primitives ───────────────────────────
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  // ── 2. Toast Notification System (aria-live="polite") ───────────────────
  function showToast(message, action) {
    let stack = document.getElementById('rg-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'rg-toast-stack';
      stack.className = 'rg-toast-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-atomic', 'true');
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'rg-toast';

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (action && action.label && typeof action.callback === 'function') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rg-btn rg-btn--sm rg-btn--secondary';
      btn.textContent = action.label;
      btn.style.marginLeft = '8px';
      btn.addEventListener('click', () => {
        action.callback();
        toast.remove();
      });
      toast.appendChild(btn);
    }

    stack.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 200);
      }
    }, 4200);
  }

  // ── 3. Product Card Safe Renderer ───────────────────────────────────────
  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'rg-card';
    card.setAttribute('data-product-id', product.id);

    // Media Wrapper
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'rg-card__media-wrap';

    const img = document.createElement('img');
    img.className = 'rg-card__img';
    img.src = (product.images && product.images[0] && product.images[0].src) || 'assets/img/heritage-flatlay.webp';
    img.alt = product.name;
    img.loading = 'lazy';
    img.width = 640;
    img.height = 800;
    mediaWrap.appendChild(img);

    // Quick Actions Overlay
    const actions = document.createElement('div');
    actions.className = 'rg-card__quick-actions';

    const quickViewBtn = document.createElement('button');
    quickViewBtn.type = 'button';
    quickViewBtn.className = 'rg-btn rg-btn--sm rg-btn--outline';
    quickViewBtn.style.flex = '1';
    quickViewBtn.setAttribute('data-action', 'quick-view');
    quickViewBtn.setAttribute('data-id', product.id);
    quickViewBtn.textContent = 'Quick View';
    actions.appendChild(quickViewBtn);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'rg-btn rg-btn--sm rg-btn--primary';
    addBtn.style.flex = '1';
    addBtn.setAttribute('data-action', 'add-to-cart');
    addBtn.setAttribute('data-id', product.id);
    addBtn.textContent = '+ Add';
    actions.appendChild(addBtn);

    mediaWrap.appendChild(actions);
    card.appendChild(mediaWrap);

    // Card Body
    const body = document.createElement('div');
    body.className = 'rg-card__body';

    const meta = document.createElement('div');
    meta.className = 'rg-card__meta';
    meta.textContent = `${product.region} · ${product.craft_type === 'handmade' ? 'Hand-spun' : 'Artisanal'}`;
    body.appendChild(meta);

    const title = document.createElement('h3');
    title.className = 'rg-card__title';
    const link = document.createElement('a');
    link.href = `product.html?id=${encodeURIComponent(product.id)}`;
    link.textContent = product.name;
    title.appendChild(link);
    body.appendChild(title);

    // Price Row
    const priceRow = document.createElement('div');
    priceRow.className = 'rg-card__price-row';

    const price = document.createElement('span');
    price.className = 'rg-card__price';
    price.textContent = window.RG.data.formatPKR(product.price);
    priceRow.appendChild(price);

    if (product.regular_price && product.regular_price > product.price) {
      const regPrice = document.createElement('span');
      regPrice.className = 'rg-card__regular-price';
      regPrice.textContent = window.RG.data.formatPKR(product.regular_price);
      priceRow.appendChild(regPrice);
    }
    body.appendChild(priceRow);

    // Swatches
    const colours = (product.attributes && product.attributes.colour) || [];
    if (colours.length > 1) {
      const swatchesWrap = document.createElement('div');
      swatchesWrap.className = 'rg-swatches';
      swatchesWrap.setAttribute('role', 'group');
      swatchesWrap.setAttribute('aria-label', `Colours available for ${product.name}`);

      colours.slice(0, 4).forEach((c, idx) => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = `rg-swatch ${idx === 0 ? 'is-active' : ''}`;
        swatch.setAttribute('data-colour', c);
        swatch.setAttribute('aria-label', c);

        const hexMatch = c.match(/#[0-9A-Fa-f]{6}/);
        swatch.style.backgroundColor = hexMatch ? hexMatch[0] : '#B8860B';

        swatch.addEventListener('click', () => {
          swatchesWrap.querySelectorAll('.rg-swatch').forEach((s) => s.classList.remove('is-active'));
          swatch.classList.add('is-active');
          if (product.images && product.images[idx % product.images.length]) {
            img.src = product.images[idx % product.images.length].src;
          }
        });

        swatchesWrap.appendChild(swatch);
      });
      body.appendChild(swatchesWrap);
    }

    card.appendChild(body);
    return card;
  }

  // ── 4. Native <dialog> Quick View Modal Controller ──────────────────────
  function openQuickViewDialog(productId) {
    const product = window.RG.data.getProductById(productId);
    if (!product) return;

    let dialog = document.getElementById('rg-quickview-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'rg-quickview-dialog';
      dialog.className = 'rg-dialog';
      dialog.setAttribute('aria-labelledby', 'rg-qv-title');
      document.body.appendChild(dialog);

      // Light dismiss on backdrop click
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    clearElement(dialog);

    // Header
    const header = document.createElement('div');
    header.className = 'rg-dialog__header';

    const title = document.createElement('h2');
    title.id = 'rg-qv-title';
    title.className = 'rg-dialog__title';
    title.textContent = product.name;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'rg-dialog__close';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => dialog.close());
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Body Grid
    const body = document.createElement('div');
    body.className = 'rg-dialog__body';
    body.style.display = 'grid';
    body.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    body.style.gap = 'var(--space-6)';

    // Image panel
    const imgWrap = document.createElement('div');
    imgWrap.style.aspectRatio = 'var(--aspect-product)';
    imgWrap.style.borderRadius = 'var(--radius-editorial)';
    imgWrap.style.overflow = 'hidden';
    imgWrap.style.backgroundColor = 'var(--rg-wool-raw)';

    const mainImg = document.createElement('img');
    mainImg.src = (product.images && product.images[0] && product.images[0].src) || 'assets/img/heritage-flatlay.webp';
    mainImg.alt = product.name;
    mainImg.style.width = '100%';
    mainImg.style.height = '100%';
    mainImg.style.objectFit = 'cover';
    imgWrap.appendChild(mainImg);
    body.appendChild(imgWrap);

    // Details panel
    const details = document.createElement('div');
    details.style.display = 'flex';
    details.style.flexDirection = 'column';
    details.style.gap = 'var(--space-3)';

    const origin = document.createElement('div');
    origin.className = 'rg-eyebrow';
    origin.textContent = `Origin: ${product.district ? product.district.trim() : product.region}, Gilgit-Baltistan`;
    details.appendChild(origin);

    const price = document.createElement('div');
    price.style.fontSize = '1.35rem';
    price.style.fontWeight = '700';
    price.textContent = window.RG.data.formatPKR(product.price);
    details.appendChild(price);

    const desc = document.createElement('p');
    desc.style.fontSize = 'var(--text-body-base)';
    desc.style.color = 'var(--text-secondary)';
    desc.textContent = product.short_description || (product.specs && product.specs.material) || 'Handcrafted by artisan communities in Gilgit-Baltistan.';
    details.appendChild(desc);

    // Size Selection
    const sizes = (product.attributes && product.attributes.size) || ['Standard'];
    const sizeFieldset = document.createElement('div');
    sizeFieldset.style.display = 'flex';
    sizeFieldset.style.flexDirection = 'column';
    sizeFieldset.style.gap = 'var(--space-2)';

    const sizeLabelRow = document.createElement('div');
    sizeLabelRow.style.display = 'flex';
    sizeLabelRow.style.justifyContent = 'space-between';
    sizeLabelRow.style.alignItems = 'center';

    const sizeLabel = document.createElement('span');
    sizeLabel.style.fontSize = 'var(--text-body-sm)';
    sizeLabel.style.fontWeight = '600';
    sizeLabel.textContent = 'Select Size:';
    sizeLabelRow.appendChild(sizeLabel);

    const sizeGuideLink = document.createElement('button');
    sizeGuideLink.type = 'button';
    sizeGuideLink.style.fontSize = 'var(--text-body-sm)';
    sizeGuideLink.style.color = 'var(--brand-highlight)';
    sizeGuideLink.style.textDecoration = 'underline';
    sizeGuideLink.textContent = 'Size Guide (cm)';
    sizeGuideLink.addEventListener('click', () => {
      dialog.close();
      openSizeGuideDialog(product.size_guide_type || 'cap');
    });
    sizeLabelRow.appendChild(sizeGuideLink);
    sizeFieldset.appendChild(sizeLabelRow);

    const sizeOptions = document.createElement('div');
    sizeOptions.style.display = 'flex';
    sizeOptions.style.gap = 'var(--space-2)';
    sizeOptions.style.flexWrap = 'wrap';

    let selectedSize = sizes[0];
    sizes.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `rg-btn rg-btn--sm ${idx === 0 ? 'rg-btn--primary' : 'rg-btn--outline'}`;
      btn.textContent = s;
      btn.addEventListener('click', () => {
        selectedSize = s;
        sizeOptions.querySelectorAll('button').forEach((b) => {
          b.className = 'rg-btn rg-btn--sm rg-btn--outline';
        });
        btn.className = 'rg-btn rg-btn--sm rg-btn--primary';
      });
      sizeOptions.appendChild(btn);
    });
    sizeFieldset.appendChild(sizeOptions);
    details.appendChild(sizeFieldset);

    // Add to Bag CTA
    const atcBtn = document.createElement('button');
    atcBtn.type = 'button';
    atcBtn.className = 'rg-btn rg-btn--primary rg-btn--full';
    atcBtn.style.marginTop = 'var(--space-4)';
    atcBtn.textContent = 'Add to Bag';
    atcBtn.addEventListener('click', () => {
      window.RG.cart.addItem(product.id, 1, { size: selectedSize });
      dialog.close();
      showToast(`Added ${product.name} (${selectedSize}) to bag`, {
        label: 'View Bag',
        callback: () => openCartDrawer()
      });
    });
    details.appendChild(atcBtn);

    body.appendChild(details);
    dialog.appendChild(body);

    dialog.showModal();
  }

  // ── 5. Native <dialog> Size Guide Modal Controller ──────────────────────
  function openSizeGuideDialog(chartType = 'cap') {
    const chart = window.RG.data.getSizeChart(chartType);

    let dialog = document.getElementById('rg-sizeguide-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'rg-sizeguide-dialog';
      dialog.className = 'rg-dialog';
      dialog.setAttribute('aria-labelledby', 'rg-sg-title');
      document.body.appendChild(dialog);

      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    clearElement(dialog);

    const header = document.createElement('div');
    header.className = 'rg-dialog__header';

    const title = document.createElement('h2');
    title.id = 'rg-sg-title';
    title.className = 'rg-dialog__title';
    title.textContent = chart.title;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'rg-dialog__close';
    closeBtn.setAttribute('aria-label', 'Close size guide');
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => dialog.close());
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'rg-dialog__body';

    const p = document.createElement('p');
    p.style.marginBottom = 'var(--space-4)';
    p.textContent = 'All measurements are verified by our Gilgit and Hunza tailor collectives. Measure your head circumference comfortably above the ears.';
    body.appendChild(p);

    const table = document.createElement('table');
    table.className = 'rg-size-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Size</th><th>Centimetres</th><th>Inches</th><th>Recommended Fit</th>';
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    chart.rows.forEach((r) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td><strong>${escapeHTML(r.size)}</strong></td><td>${escapeHTML(r.cm)}</td><td>${escapeHTML(r.inches)}</td><td>${escapeHTML(r.fit || r.length)}</td>`;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    body.appendChild(table);

    dialog.appendChild(body);
    dialog.showModal();
  }

  // ── 6. Slide-Over Cart Drawer Controller ────────────────────────────────
  function openCartDrawer() {
    let drawer = document.getElementById('rg-cart-drawer');
    if (!drawer) {
      drawer = document.createElement('dialog');
      drawer.id = 'rg-cart-drawer';
      drawer.className = 'rg-drawer';
      drawer.setAttribute('aria-labelledby', 'rg-drawer-title');
      document.body.appendChild(drawer);

      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) drawer.close();
      });
    }

    renderCartDrawerContent(drawer);
    drawer.showModal();
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('rg-cart-drawer');
    if (drawer && drawer.open) {
      drawer.close();
    }
  }

  function renderCartDrawerContent(drawer) {
    clearElement(drawer);
    const summary = window.RG.cart.getSummary();
    const fmt = window.RG.data.formatPKR;

    // Header
    const header = document.createElement('div');
    header.className = 'rg-drawer__header';

    const title = document.createElement('h2');
    title.id = 'rg-drawer-title';
    title.className = 'rg-drawer__title';
    title.textContent = `Your Bag (${summary.count})`;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'rg-dialog__close';
    closeBtn.setAttribute('aria-label', 'Close cart drawer');
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => drawer.close());
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    // Free Shipping Progress Bar
    const shipBar = document.createElement('div');
    shipBar.className = 'rg-drawer__shipping-bar';

    const shipText = document.createElement('div');
    if (summary.freeShippingRemaining <= 0) {
      shipText.innerHTML = '<strong style="color:var(--rg-success);">✓ Free Nationwide Delivery Unlocked</strong>';
    } else {
      shipText.innerHTML = `Add <strong>${fmt(summary.freeShippingRemaining)}</strong> more for free delivery nationwide.`;
    }
    shipBar.appendChild(shipText);

    const track = document.createElement('div');
    track.className = 'rg-progress-track';
    const fill = document.createElement('div');
    fill.className = 'rg-progress-fill';
    fill.style.width = `${summary.freeShippingProgress}%`;
    track.appendChild(fill);
    shipBar.appendChild(track);
    drawer.appendChild(shipBar);

    // Items List
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'rg-drawer__items';

    if (summary.items.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.paddingBlock = 'var(--space-10)';
      emptyMsg.innerHTML = `
        <p style="font-family:var(--font-display);font-size:1.15rem;margin-bottom:var(--space-2);">Your bag is currently empty.</p>
        <p style="color:var(--text-secondary);font-size:var(--text-body-sm);margin-bottom:var(--space-4);">Explore our hand-loomed shawls, Gilgiti caps, and pattu waistcoats.</p>
        <a href="shop.html" class="rg-btn rg-btn--primary rg-btn--sm">Browse the Collection</a>
      `;
      itemsContainer.appendChild(emptyMsg);
    } else {
      summary.items.forEach((item) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'rg-drawer-item';

        const img = document.createElement('img');
        img.className = 'rg-drawer-item__img';
        img.src = item.image;
        img.alt = item.name;
        itemRow.appendChild(img);

        const info = document.createElement('div');
        info.className = 'rg-drawer-item__info';

        const itemTitle = document.createElement('div');
        itemTitle.className = 'rg-drawer-item__title';
        itemTitle.textContent = item.name;
        info.appendChild(itemTitle);

        const variant = document.createElement('div');
        variant.className = 'rg-drawer-item__variant';
        variant.textContent = `Size: ${item.size} · ${item.colour}`;
        info.appendChild(variant);

        // Stepper and Price Row
        const bottom = document.createElement('div');
        bottom.className = 'rg-drawer-item__bottom';

        const stepper = document.createElement('div');
        stepper.className = 'rg-stepper';

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'rg-stepper__btn';
        decBtn.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
        decBtn.textContent = '−';
        decBtn.addEventListener('click', () => {
          window.RG.cart.updateQty(item.key, item.qty - 1);
          renderCartDrawerContent(drawer);
        });
        stepper.appendChild(decBtn);

        const val = document.createElement('span');
        val.className = 'rg-stepper__val';
        val.textContent = item.qty;
        stepper.appendChild(val);

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'rg-stepper__btn';
        incBtn.setAttribute('aria-label', `Increase quantity of ${item.name}`);
        incBtn.textContent = '+';
        incBtn.addEventListener('click', () => {
          window.RG.cart.updateQty(item.key, item.qty + 1);
          renderCartDrawerContent(drawer);
        });
        stepper.appendChild(incBtn);
        bottom.appendChild(stepper);

        const price = document.createElement('div');
        price.className = 'rg-drawer-item__price';
        price.textContent = fmt(item.price * item.qty);
        bottom.appendChild(price);

        info.appendChild(bottom);
        itemRow.appendChild(info);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.style.color = 'var(--text-secondary)';
        removeBtn.style.fontSize = '12px';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '0';
        removeBtn.style.right = '0';
        removeBtn.setAttribute('aria-label', `Remove ${item.name} from bag`);
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
          const removed = window.RG.cart.removeItem(item.key);
          renderCartDrawerContent(drawer);
          showToast(`Removed ${removed.name}`, {
            label: 'Undo',
            callback: () => {
              window.RG.cart.undoRemove();
              renderCartDrawerContent(drawer);
            }
          });
        });
        itemRow.appendChild(removeBtn);

        itemsContainer.appendChild(itemRow);
      });
    }
    drawer.appendChild(itemsContainer);

    // Footer with Totals and Checkout CTA
    if (summary.items.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'rg-drawer__footer';

      const subtotalRow = document.createElement('div');
      subtotalRow.className = 'rg-drawer__summary-row';
      subtotalRow.innerHTML = `<span>Subtotal</span><span>${fmt(summary.subtotal)}</span>`;
      footer.appendChild(subtotalRow);

      if (summary.discount > 0) {
        const discountRow = document.createElement('div');
        discountRow.className = 'rg-drawer__summary-row';
        discountRow.style.color = 'var(--rg-success)';
        discountRow.innerHTML = `<span>Discount (${escapeHTML(summary.couponCode)})</span><span>− ${fmt(summary.discount)}</span>`;
        footer.appendChild(discountRow);
      }

      const shippingRow = document.createElement('div');
      shippingRow.className = 'rg-drawer__summary-row';
      shippingRow.innerHTML = `<span>Delivery (${escapeHTML(summary.courier.name)})</span><span>${summary.delivery === 0 ? 'FREE' : fmt(summary.delivery)}</span>`;
      footer.appendChild(shippingRow);

      const totalRow = document.createElement('div');
      totalRow.className = 'rg-drawer__summary-row rg-drawer__summary-row--total';
      totalRow.innerHTML = `<span>Estimated Total</span><span>${fmt(summary.total)}</span>`;
      footer.appendChild(totalRow);

      const checkoutBtn = document.createElement('a');
      checkoutBtn.href = 'checkout.html';
      checkoutBtn.className = 'rg-btn rg-btn--primary rg-btn--full';
      checkoutBtn.textContent = 'Proceed to Checkout';
      footer.appendChild(checkoutBtn);

      drawer.appendChild(footer);
    }
  }

  // ── 7. Header Cart Badge Synchronization ────────────────────────────────
  function updateHeaderCartBadge(summary) {
    document.querySelectorAll('[data-rg-cart-count]').forEach((el) => {
      el.textContent = summary.count;
      el.classList.add('is-bumped');
      setTimeout(() => el.classList.remove('is-bumped'), 240);
    });
  }

  // ── 8. Live Search Overlay Controller (DOM Highlighting, Zero XSS) ──────
  function openSearchOverlay() {
    let dialog = document.getElementById('rg-search-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'rg-search-dialog';
      dialog.className = 'rg-dialog';
      dialog.style.maxWidth = '640px';
      dialog.setAttribute('aria-label', 'Search ReGongches Catalogue');
      document.body.appendChild(dialog);

      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    clearElement(dialog);

    const body = document.createElement('div');
    body.className = 'rg-dialog__body';
    body.style.padding = 'var(--space-6)';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'rg-form-input';
    searchInput.placeholder = 'Search Gilgiti caps, shawls, pattu waistcoats...';
    searchInput.style.fontSize = '1.1rem';
    searchInput.setAttribute('aria-label', 'Search catalogue');
    body.appendChild(searchInput);

    const resultsBox = document.createElement('div');
    resultsBox.style.marginTop = 'var(--space-4)';
    resultsBox.style.display = 'flex';
    resultsBox.style.flexDirection = 'column';
    resultsBox.style.gap = 'var(--space-2)';
    resultsBox.style.maxHeight = '380px';
    resultsBox.style.overflowY = 'auto';
    body.appendChild(resultsBox);

    dialog.appendChild(body);
    dialog.showModal();
    setTimeout(() => searchInput.focus(), 60);

    let debounceTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim().toLowerCase();
        clearElement(resultsBox);

        if (!query) {
          const hint = document.createElement('div');
          hint.style.fontSize = 'var(--text-body-sm)';
          hint.style.color = 'var(--text-secondary)';
          hint.textContent = 'Try searching: "Gilgiti Cap", "Sheep Wool Shawl", "Waistcoat", "Hunza"';
          resultsBox.appendChild(hint);
          return;
        }

        const matches = window.RG.data.getProducts((p) => {
          const hay = `${p.name} ${p.region} ${p.district || ''} ${p.categories.join(' ')}`.toLowerCase();
          return hay.includes(query);
        });

        if (matches.length === 0) {
          const noMatch = document.createElement('div');
          noMatch.style.paddingBlock = 'var(--space-4)';
          noMatch.style.color = 'var(--text-secondary)';
          noMatch.textContent = `No items found for "${query}". Our artisans in Gilgit and Hunza can weave custom pieces upon request.`;
          resultsBox.appendChild(noMatch);
          return;
        }

        matches.slice(0, 6).forEach((prod) => {
          const row = document.createElement('a');
          row.href = `product.html?id=${encodeURIComponent(prod.id)}`;
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = 'var(--space-3)';
          row.style.padding = 'var(--space-2) var(--space-3)';
          row.style.borderRadius = 'var(--radius-editorial)';
          row.style.textDecoration = 'none';
          row.style.borderBottom = '1px solid var(--rg-border)';

          const thumb = document.createElement('img');
          thumb.src = (prod.images && prod.images[0] && prod.images[0].src) || 'assets/img/heritage-flatlay.webp';
          thumb.alt = prod.name;
          thumb.style.width = '44px';
          thumb.style.height = '55px';
          thumb.style.objectFit = 'cover';
          thumb.style.borderRadius = 'var(--radius-editorial)';
          row.appendChild(thumb);

          const col = document.createElement('div');
          const nameSpan = document.createElement('strong');
          nameSpan.style.display = 'block';
          nameSpan.style.fontSize = 'var(--text-body-sm)';
          nameSpan.textContent = prod.name;
          col.appendChild(nameSpan);

          const metaSpan = document.createElement('span');
          metaSpan.style.fontSize = '0.75rem';
          metaSpan.style.color = 'var(--text-secondary)';
          metaSpan.textContent = `${prod.region} · ${window.RG.data.formatPKR(prod.price)}`;
          col.appendChild(metaSpan);

          row.appendChild(col);
          resultsBox.appendChild(row);
        });
      }, 120);
    });
  }

  // ── 9. Checkout Page Validation & Anti-Double Submission ─────────────────
  function initCheckoutController() {
    const form = document.getElementById('rg-checkout-form');
    if (!form) return;

    const summary = window.RG.cart.getSummary();
    const codRadio = form.querySelector('input[name="payment_method"][value="cod"]');
    const bankRadio = form.querySelector('input[name="payment_method"][value="bacs"]');
    const mtoNotice = document.getElementById('rg-mto-notice');

    // Automatic Made-to-Order COD Lock
    if (summary.hasMadeToOrder) {
      if (codRadio) {
        codRadio.disabled = true;
        codRadio.checked = false;
      }
      if (bankRadio) {
        bankRadio.checked = true;
      }
      if (mtoNotice) {
        mtoNotice.style.display = 'block';
      }
    }

    // Phone input instant validation: ^(\+92|0)?3[0-9]{2}-?[0-9]{7}$
    const phoneInput = form.querySelector('input[name="billing_phone"]');
    const phoneError = document.getElementById('rg-phone-error');
    const PAK_PHONE_REGEX = /^(\+92|0)?3[0-9]{2}-?[0-9]{7}$/;

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const val = phoneInput.value.trim();
        const isValid = PAK_PHONE_REGEX.test(val);
        phoneInput.classList.toggle('is-invalid', val.length > 3 && !isValid);
        if (phoneError) {
          phoneError.style.display = (val.length > 3 && !isValid) ? 'block' : 'none';
        }
      });
    }

    // Anti-Double Submit Guard
    let isSubmitting = false;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (phoneInput && !PAK_PHONE_REGEX.test(phoneInput.value.trim())) {
        phoneInput.focus();
        showToast('Please enter a valid Pakistani mobile number (e.g., 0340-8500976).');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing your order...';
      }

      // Record simulated order
      const orderPayload = {
        orderId: 'RG-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString(),
        items: summary.items,
        total: summary.total,
        courier: summary.courier.name,
        paymentMethod: form.querySelector('input[name="payment_method"]:checked')?.value || 'cod'
      };

      try {
        const prev = JSON.parse(window.localStorage.getItem('rg_orders_v1') || '[]');
        prev.unshift(orderPayload);
        window.localStorage.setItem('rg_orders_v1', JSON.stringify(prev));
      } catch (err) {}

      window.RG.cart.clear();

      setTimeout(() => {
        window.location.href = `order-confirmation.html?order=${encodeURIComponent(orderPayload.orderId)}`;
      }, 700);
    });
  }

  // ── 10. Global Event Delegation & Initialization ─────────────────────────
  document.addEventListener('click', (e) => {
    // Open Quick View
    const qvBtn = e.target.closest('[data-action="quick-view"]');
    if (qvBtn) {
      e.preventDefault();
      openQuickViewDialog(qvBtn.getAttribute('data-id'));
      return;
    }

    // Direct Add to Cart
    const addBtn = e.target.closest('[data-action="add-to-cart"]');
    if (addBtn) {
      e.preventDefault();
      const pid = addBtn.getAttribute('data-id');
      const prod = window.RG.cart.addItem(pid, 1);
      if (prod) {
        showToast(`Added ${prod.name} to bag`, {
          label: 'View Bag',
          callback: () => openCartDrawer()
        });
      }
      return;
    }

    // Open Cart Drawer
    if (e.target.closest('[data-action="open-cart"]')) {
      e.preventDefault();
      openCartDrawer();
      return;
    }

    // Open Search Overlay
    if (e.target.closest('[data-action="open-search"]')) {
      e.preventDefault();
      openSearchOverlay();
      return;
    }

    // Open Size Guide
    const sgBtn = e.target.closest('[data-action="open-size-guide"]');
    if (sgBtn) {
      e.preventDefault();
      openSizeGuideDialog(sgBtn.getAttribute('data-chart') || 'cap');
      return;
    }
  });

  // Global Keyboard Shortcuts (⌘K / Ctrl+K for search)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchOverlay();
    }
  });

  // Sticky Header Scroll Behavior
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    }
  }, { passive: true });

  // Listen for Cart Updates
  window.addEventListener('rg:cart:updated', (e) => {
    if (e.detail) {
      updateHeaderCartBadge(e.detail);
      const drawer = document.getElementById('rg-cart-drawer');
      if (drawer && drawer.open) {
        renderCartDrawerContent(drawer);
      }
    }
  });

  // Initialize Page Modules
  document.addEventListener('DOMContentLoaded', () => {
    // Populate Featured Products Grid if target container exists
    const featuredGrid = document.getElementById('rg-featured-products-grid');
    if (featuredGrid && window.RG.data) {
      clearElement(featuredGrid);
      const prods = window.RG.data.getProducts().slice(0, 8);
      prods.forEach((p) => {
        featuredGrid.appendChild(createProductCard(p));
      });
    }

    initCheckoutController();
  });

  // Public UI API
  window.RG = window.RG || {};
  window.RG.ui = {
    toast: showToast,
    openQuickView: openQuickViewDialog,
    openSizeGuide: openSizeGuideDialog,
    openCart: openCartDrawer,
    closeCart: closeCartDrawer,
    openSearch: openSearchOverlay,
    createProductCard: createProductCard
  };
})(typeof window !== 'undefined' ? window : this, document);
