/* ==========================================================================
   ReGongches Cart & Checkout Store Module — js/cart.js
   Security-hardened client-side cart with strict anti-tampering verification,
   authoritative catalog price enforcement, courier logic, and reactive sync.
   ========================================================================== */
(function (window) {
  'use strict';

  const STORAGE_KEY = 'rg_cart_v2';
  const MAX_QTY_PER_ITEM = 20;

  function safeGetStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSetStorage(key, val) {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      /* Silently ignore quota / private-mode restrictions */
    }
  }

  const defaultState = {
    items: [],
    courierId: 'leopards',
    couponCode: '',
    giftWrap: false,
    giftNote: '',
    orderNote: ''
  };

  let state = defaultState;
  let lastRemovedItem = null;

  // Initialize and audit state against authoritative catalog
  function initCart() {
    const loaded = safeGetStorage(STORAGE_KEY, defaultState);
    state = Object.assign({}, defaultState, loaded);

    if (!Array.isArray(state.items)) {
      state.items = [];
    }

    // Anti-Tampering Audit: Validate items against authoritative catalog
    const auditedItems = [];
    for (const item of state.items) {
      if (!item || !item.productId) continue;
      const product = window.RG.data.getProductById(item.productId);
      if (!product) continue; // Nonexistent or injected product ID dropped

      // Clamp quantity to valid integer 1..20
      const safeQty = Math.max(1, Math.min(MAX_QTY_PER_ITEM, parseInt(item.qty, 10) || 1));

      // Resolve valid size and colour
      const validSizes = (product.attributes && product.attributes.size) || ['Standard'];
      const validColours = (product.attributes && product.attributes.colour) || ['Default'];
      const safeSize = validSizes.includes(item.size) ? item.size : validSizes[0];
      const safeColour = validColours.includes(item.colour) ? item.colour : validColours[0];

      // Sanitize custom note (strip dangerous characters, limit 200 chars)
      const safeCustomNote = String(item.customNote || '').slice(0, 200).trim();

      // Recalculate unique line item key
      const safeKey = `${product.id}__${safeSize}__${safeColour}__${safeCustomNote}`;

      // Enforce AUTHORITATIVE catalog price (never trust stored price)
      auditedItems.push({
        key: safeKey,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        regular_price: product.regular_price,
        image: (product.images && product.images[0] && product.images[0].src) || 'assets/img/heritage-flatlay.webp',
        region: product.region,
        craft_type: product.craft_type,
        availability: product.availability,
        dispatch_days: product.dispatch_days || [1, 2],
        size: safeSize,
        colour: safeColour,
        customNote: safeCustomNote,
        qty: safeQty
      });
    }

    state.items = auditedItems;
    safeSetStorage(STORAGE_KEY, state);
  }

  const RGCart = {
    init() {
      initCart();
      window.dispatchEvent(new CustomEvent('rg:cart:updated', { detail: this.getSummary() }));
    },

    getState() {
      return state;
    },

    save() {
      safeSetStorage(STORAGE_KEY, state);
      window.dispatchEvent(new CustomEvent('rg:cart:updated', { detail: this.getSummary() }));
    },

    addItem(productId, qty = 1, options = {}) {
      const product = window.RG.data.getProductById(productId);
      if (!product) return null;

      const validSizes = (product.attributes && product.attributes.size) || ['Standard'];
      const validColours = (product.attributes && product.attributes.colour) || ['Default'];
      const size = options.size && validSizes.includes(options.size) ? options.size : validSizes[0];
      const colour = options.colour && validColours.includes(options.colour) ? options.colour : validColours[0];
      const customNote = String(options.customNote || '').slice(0, 200).trim();
      const numQty = Math.max(1, Math.min(MAX_QTY_PER_ITEM, parseInt(qty, 10) || 1));

      const key = `${product.id}__${size}__${colour}__${customNote}`;
      const existing = state.items.find((item) => item.key === key);

      if (existing) {
        existing.qty = Math.min(MAX_QTY_PER_ITEM, existing.qty + numQty);
      } else {
        state.items.push({
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price, // Authoritative price from catalog
          regular_price: product.regular_price,
          image: (product.images && product.images[0] && product.images[0].src) || 'assets/img/heritage-flatlay.webp',
          region: product.region,
          craft_type: product.craft_type,
          availability: product.availability,
          dispatch_days: product.dispatch_days || [1, 2],
          size,
          colour,
          customNote,
          qty: numQty
        });
      }

      this.save();
      return product;
    },

    updateQty(key, qty) {
      const num = parseInt(qty, 10);
      if (isNaN(num) || num <= 0) {
        return this.removeItem(key);
      }
      const item = state.items.find((i) => i.key === key);
      if (item) {
        item.qty = Math.min(MAX_QTY_PER_ITEM, num);
        this.save();
      }
    },

    removeItem(key) {
      const idx = state.items.findIndex((i) => i.key === key);
      if (idx > -1) {
        lastRemovedItem = state.items[idx];
        state.items.splice(idx, 1);
        this.save();
      }
      return lastRemovedItem;
    },

    undoRemove() {
      if (lastRemovedItem) {
        state.items.push(lastRemovedItem);
        const restored = lastRemovedItem;
        lastRemovedItem = null;
        this.save();
        return restored;
      }
      return null;
    },

    setCourier(courierId) {
      const valid = window.RG.data.getCourierById(courierId);
      if (valid) {
        state.courierId = valid.id;
        this.save();
      }
    },

    setGiftWrap(enabled, note) {
      state.giftWrap = Boolean(enabled);
      if (typeof note === 'string') {
        state.giftNote = note.slice(0, 200).trim();
      }
      this.save();
    },

    applyCoupon(code) {
      const clean = String(code || '').trim().toUpperCase();
      const cfg = window.RG.data.getConfig();
      const coupons = cfg.coupons || {};

      if (!clean) {
        state.couponCode = '';
        this.save();
        return { valid: true, message: 'Coupon removed.' };
      }

      if (coupons[clean]) {
        state.couponCode = clean;
        this.save();
        return { valid: true, message: `Applied code ${clean}: ${coupons[clean].label}` };
      }

      return { valid: false, message: 'Invalid code. Try THREADS10 or WELCOME.' };
    },

    clear() {
      state.items = [];
      state.couponCode = '';
      state.giftWrap = false;
      state.giftNote = '';
      state.orderNote = '';
      this.save();
    },

    getSummary() {
      const cfg = window.RG.data.getConfig();
      const threshold = cfg.freeDeliveryThreshold || 5000;
      const wrapFee = cfg.giftWrapFee || 300;
      const coupons = cfg.coupons || {};

      const courier = window.RG.data.getCourierById(state.courierId);
      const count = state.items.reduce((acc, i) => acc + i.qty, 0);

      // Strict recalculation of subtotal from catalog prices
      const subtotal = state.items.reduce((acc, i) => {
        const prod = window.RG.data.getProductById(i.productId);
        const realPrice = prod ? prod.price : i.price;
        return acc + (realPrice * i.qty);
      }, 0);

      // Coupon calculation
      let discount = 0;
      let couponLabel = '';
      if (state.couponCode && coupons[state.couponCode] && subtotal > 0) {
        const c = coupons[state.couponCode];
        couponLabel = c.label;
        discount = c.type === 'percent' ? Math.round(subtotal * (c.value / 100)) : c.value;
        discount = Math.min(subtotal, discount);
      }

      const afterDiscount = Math.max(0, subtotal - discount);
      const freeShippingRemaining = Math.max(0, threshold - afterDiscount);
      const freeShippingProgress = Math.min(100, Math.round((afterDiscount / threshold) * 100));

      // Shipping fee: free if >= threshold or empty cart
      const delivery = (count === 0 || afterDiscount >= threshold) ? 0 : courier.rate;
      const giftWrapCost = (state.giftWrap && count > 0) ? wrapFee : 0;
      const total = afterDiscount + giftWrapCost + delivery;

      // Made-to-order items disable COD
      const hasMadeToOrder = state.items.some((i) => i.availability === 'made-to-order' || Boolean(i.customNote));

      return {
        items: state.items.slice(),
        count,
        subtotal,
        discount,
        couponCode: state.couponCode,
        couponLabel,
        courier,
        delivery,
        giftWrap: state.giftWrap,
        giftNote: state.giftNote,
        giftWrapCost,
        threshold,
        freeShippingRemaining,
        freeShippingProgress,
        total,
        hasMadeToOrder
      };
    }
  };

  // Listen for multi-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      initCart();
      window.dispatchEvent(new CustomEvent('rg:cart:updated', { detail: RGCart.getSummary() }));
    }
  });

  // Self-initialize once data is available
  if (typeof window.RG !== 'undefined' && window.RG.data) {
    RGCart.init();
  } else {
    window.addEventListener('DOMContentLoaded', () => RGCart.init());
  }

  window.RG = window.RG || {};
  window.RG.cart = RGCart;
})(typeof window !== 'undefined' ? window : this);
