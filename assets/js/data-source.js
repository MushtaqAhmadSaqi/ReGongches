/* ==========================================================================
   ReGongches Data Source Adapter (assets/js/data-source.js)
   Isolates data reads so static window.RG_DATA can be swapped with
   WooCommerce Store API (/wp-json/wc/store/v1/products) during WP conversion.
   ========================================================================== */
(function (window) {
  'use strict';

  function sanitizeText(str, maxLen) {
    const clean = String(str == null ? '' : str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    return maxLen && clean.length > maxLen ? clean.slice(0, maxLen) : clean;
  }

  function sanitizeUrl(url) {
    const s = String(url == null ? '' : url).trim();
    if (!s || s.startsWith('//')) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
      if (/^https?:/i.test(s) || /^data:image\/(?:png|jpeg|jpg|webp|gif);/i.test(s)) return s;
      return '';
    }
    return s;
  }

  function sanitizeUrlArray(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.map((entry) => {
      if (typeof entry === 'string') return sanitizeUrl(entry);
      if (entry && typeof entry === 'object' && typeof entry.src === 'string') {
        return Object.assign({}, entry, { src: sanitizeUrl(entry.src) });
      }
      return entry;
    });
  }

  function sanitizeRecord(item) {
    if (!item || typeof item !== 'object') return item;
    const copy = Object.assign({}, item);
    ['image', 'img', 'heroImage', 'thumbnail', 'avatar', 'coverImage', 'portrait', 'photo'].forEach((k) => {
      if (typeof copy[k] === 'string') copy[k] = sanitizeUrl(copy[k]);
    });
    if (Array.isArray(copy.gallery)) copy.gallery = sanitizeUrlArray(copy.gallery);
    if (Array.isArray(copy.images)) copy.images = sanitizeUrlArray(copy.images);
    if (typeof copy.url === 'string') copy.url = sanitizeUrl(copy.url);
    return copy;
  }

  const RGDataSource = {
    mode: 'static', // Change to 'wc-store-api' in WordPress theme
    wcEndpoint: '/wp-json/wc/store/v1/products',
    sanitizeText,
    sanitizeUrl,
    sanitizeRecord,

    getConfig() {
      return (window.RG_DATA && window.RG_DATA.config) || {};
    },

    getProducts() {
      const list = (window.RG_DATA && window.RG_DATA.products) || [];
      return Array.isArray(list) ? list.map(sanitizeRecord) : [];
    },

    getProductById(idOrSlug) {
      const list = this.getProducts();
      if (!idOrSlug) return list[0] || null;
      return list.find(
        (p) => String(p.id) === String(idOrSlug) || p.slug === String(idOrSlug)
      ) || list[0] || null;
    },

    getArtisans() {
      const list = (window.RG_DATA && window.RG_DATA.artisans) || [];
      return Array.isArray(list) ? list.map(sanitizeRecord) : [];
    },

    getArtisanById(id) {
      const list = this.getArtisans();
      if (!id) return list[0] || null;
      return list.find((a) => a.id === id) || list[0] || null;
    },

    getRegions() {
      const list = (window.RG_DATA && window.RG_DATA.regions) || [];
      return Array.isArray(list) ? list.map(sanitizeRecord) : [];
    },

    getRegionById(id) {
      const list = this.getRegions();
      if (!id) return list[0] || null;
      return list.find((r) => r.id.toLowerCase() === String(id).toLowerCase()) || list[0] || null;
    },

    getReviews(productId) {
      const list = (window.RG_DATA && window.RG_DATA.reviews) || [];
      if (!productId) return list;
      const filtered = list.filter((r) => String(r.productId) === String(productId));
      return filtered.length ? filtered : list.slice(0, 4);
    },

    getJournalPosts() {
      const list = (window.RG_DATA && window.RG_DATA.journal) || [];
      return Array.isArray(list) ? list.map(sanitizeRecord) : [];
    },

    getJournalPostById(id) {
      const list = this.getJournalPosts();
      if (!id) return list[0] || null;
      return list.find((j) => j.id === id) || list[0] || null;
    },

    formatPKR(amount) {
      const num = Number(amount) || 0;
      try {
        return 'PKR ' + new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(num);
      } catch (e) {
        return 'PKR ' + num.toLocaleString();
      }
    }
  };

  window.RG = window.RG || {};
  window.RG.data = RGDataSource;
})(window);
