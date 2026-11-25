#!/usr/bin/env node
/**
 * Non-destructive automated AppSec regression suite for ReGongches.
 * Usage: node tests/security-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

let passed = 0;
const results = [];

function check(name, fn) {
  fn();
  passed++;
  results.push(`PASS: ${name}`);
}

function walkJs(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walkJs(p));
    else if (ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function makeMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(k); },
    clear() { map.clear(); },
    _raw: map,
  };
}

function makeDomNode(overrides = {}) {
  const attrs = new Map();
  const classes = new Set();
  const node = {
    value: '',
    hidden: false,
    checked: false,
    disabled: false,
    innerHTML: '',
    textContent: '',
    dataset: {},
    style: {},
    children: [],
    className: '',
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, force) => {
        if (force === undefined) classes.has(c) ? classes.delete(c) : classes.add(c);
        else force ? classes.add(c) : classes.delete(c);
      },
      contains: (c) => classes.has(c),
    },
    setAttribute(k, v) { attrs.set(k, String(v)); },
    getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
    removeAttribute(k) { attrs.delete(k); },
    hasAttribute(k) { return attrs.has(k); },
    addEventListener() {},
    appendChild(child) { this.children.push(child); return child; },
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    focus() {},
    scrollIntoView() {},
    getBoundingClientRect: () => ({ left: 0, width: 1000, height: 600, top: 0 }),
    ...overrides,
  };
  return node;
}

function createSandbox({ search = '', lsInit = {}, ssInit = {}, elements = {} } = {}) {
  class MockForm {
    constructor(cls = '', id = '', elMap = {}) {
      this._cls = cls;
      this._id = id;
      this.elements = elMap;
      this.resetCalled = false;
    }
    matches(sel) {
      return sel.split(',').map((s) => s.trim()).some((s) =>
        (s.startsWith('.') && this._cls.includes(s.slice(1))) ||
        (s.startsWith('#') && this._id === s.slice(1))
      );
    }
    querySelectorAll() { return []; }
    addEventListener(type, fn) { (this._listeners ||= {})[type] = fn; }
    reset() { this.resetCalled = true; }
  }

  const listeners = {};
  const docEl = makeDomNode();
  const ls = makeMockStorage(lsInit);
  const ss = makeMockStorage(ssInit);
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    URLSearchParams, URL, encodeURIComponent, decodeURIComponent,
    Intl, Math, Number, String, Array, Object, Set, Map, JSON, Date,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    HTMLFormElement: MockForm,
    localStorage: ls,
    sessionStorage: ss,
    innerWidth: 1280,
    scrollY: 0,
    CustomEvent: class CustomEvent { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    addEventListener(type, fn) { (listeners['win:' + type] ||= []).push(fn); },
    dispatchEvent() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    IntersectionObserver: class { observe() {} },
    document: {
      documentElement: docEl,
      body: makeDomNode(),
      readyState: 'complete',
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => makeDomNode(),
      getElementById: (id) => elements[id] || null,
    },
    location: {
      pathname: '/index.html',
      search,
      href: 'http://127.0.0.1:8765/index.html' + search,
      hash: '',
    },
    MockForm,
    _listeners: listeners,
    _docEl: docEl,
  };
  sb.window = sb;
  vm.createContext(sb);
  return sb;
}

function runScript(sb, relPath) {
  const code = fs.readFileSync(path.join(root, relPath), 'utf8');
  vm.runInContext(code, sb);
}

// 1. JS Syntax across all assets/js files
check('JS syntax validation (node --check)', () => {
  const jsFiles = walkJs(path.join(root, 'assets', 'js'));
  assert.ok(jsFiles.length >= 18, 'Expected at least 18 JS files');
  for (const jf of jsFiles) {
    execFileSync(process.execPath, ['--check', jf], { stdio: 'pipe' });
  }
});

// 2. HTML CSP, Referrer, Inline Scripts/Handlers, and rel="noopener noreferrer" (SEC-05, SEC-06)
check('All 29 HTML files enforce strict CSP meta, Referrer-Policy, zero inline scripts/handlers, and noopener noreferrer', () => {
  const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  assert.equal(htmlFiles.length, 29, 'Expected 29 HTML pages');

  for (const file of htmlFiles) {
    const txt = fs.readFileSync(path.join(root, file), 'utf8');

    for (const m of txt.matchAll(/<script\b([^>]*)>/gi)) {
      const attrs = m[1];
      if (!/\bsrc\s*=/i.test(attrs) && !/application\/ld\+json/i.test(attrs)) {
        assert.fail(`Unexpected inline <script> in ${file}`);
      }
    }

    const noLdJson = txt.replace(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const tm of noLdJson.matchAll(/<([a-zA-Z0-9:-]+)\b([^>]*)>/g)) {
      const attrs = tm[2];
      const onMatch = attrs.match(/\s(on[a-z]+)\s*=/i);
      assert.equal(onMatch, null, `Inline handler found in ${file}: ${onMatch && onMatch[1]}`);

      if (/target\s*=\s*"_blank"/i.test(attrs)) {
        const hasNoop = /\bnoopener\b/i.test(attrs);
        const hasNoref = /\bnoreferrer\b/i.test(attrs);
        assert.ok(hasNoop && hasNoref, `target="_blank" missing noopener noreferrer in ${file}`);
      }
    }

    const cspMatch = txt.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i);
    assert.ok(cspMatch, `Missing CSP meta in ${file}`);
    assert.ok(cspMatch[1].includes("script-src 'self'"), `Missing script-src 'self' in ${file}`);
    assert.ok(!/frame-ancestors/i.test(cspMatch[1]), `frame-ancestors must not be inside <meta> in ${file}`);

    assert.ok(
      txt.includes('<meta name="referrer" content="strict-origin-when-cross-origin"'),
      `Missing Referrer-Policy meta in ${file}`
    );
  }
});

// 3. SEC-01 & SEC-04: Cart integrity & Mini-cart XSS escaping
check('SEC-01 & SEC-04: Cart clamps negative/excess quantities and UI escapes attribute breakout & dangerous URLs', () => {
  const bodyEl = makeDomNode();
  const countEl = makeDomNode();
  const sb = createSandbox({
    lsInit: {
      rg_cart_v1: JSON.stringify({
        items: [
          {
            key: '" onclick="alert(1)',
            productId: '1',
            name: '<img src=x onerror=alert(1)>',
            size: '<b>M</b>',
            colour: '"><script>',
            price: 1000,
            qty: -50,
            image: 'javascript:alert(1)',
          },
        ],
        coupon: 'THREADS10',
        giftWrap: false,
      }),
    },
    elements: {
      'rg-minicart-body': bodyEl,
      'rg-minicart-footer': makeDomNode(),
      'rg-minicart-count': countEl,
    },
  });

  runScript(sb, 'assets/js/data/site-config.js');
  runScript(sb, 'assets/js/data/products.js');
  runScript(sb, 'assets/js/data-source.js');
  runScript(sb, 'assets/js/cart.js');
  runScript(sb, 'assets/js/ui.js');

  const summary = sb.RG.cart.getSummary();
  assert.equal(summary.items[0].qty, 1, 'Negative qty in storage must clamp to 1');

  sb.RG.ui.renderMiniCart();
  assert.ok(bodyEl.innerHTML.includes('rg-shipping-bar'), 'Mini-cart body should have rendered');
  assert.ok(!bodyEl.innerHTML.includes('<img src=x onerror=alert(1)>'), 'Raw HTML payload must be escaped');
  assert.ok(!bodyEl.innerHTML.includes('javascript:alert(1)'), 'javascript: URL must be blocked');
  assert.ok(bodyEl.innerHTML.includes('&quot; onclick=&quot;alert(1)'), 'Attribute breakout must be escaped');
});

// 4. SEC-02: Search recent history XSS escaping
check('SEC-02: Search overlay escapes recent search XSS payloads', () => {
  const resultsEl = makeDomNode();
  const inputEl = makeDomNode();
  const sb = createSandbox({
    lsInit: {
      rg_recent_searches_v1: JSON.stringify(['"><img src=x onerror=alert(1)>', 'gilgit cap']),
    },
    elements: {
      'rg-search-results': resultsEl,
      'rg-search-input': inputEl,
    },
  });

  runScript(sb, 'assets/js/data/site-config.js');
  runScript(sb, 'assets/js/data/products.js');
  runScript(sb, 'assets/js/data/regions.js');
  runScript(sb, 'assets/js/data/artisans.js');
  runScript(sb, 'assets/js/data/journal.js');
  runScript(sb, 'assets/js/data-source.js');
  runScript(sb, 'assets/js/cart.js');
  runScript(sb, 'assets/js/wishlist.js');
  runScript(sb, 'assets/js/ui.js');
  runScript(sb, 'assets/js/main.js');

  for (const fn of sb._listeners.DOMContentLoaded || []) fn();
  if (inputEl._listeners && inputEl._listeners.focus) inputEl._listeners.focus();

  assert.ok(!resultsEl.innerHTML.includes('<img src=x onerror=alert(1)>'), 'Search recent chip must escape XSS');
});

// 5. SEC-03 & SEC-07: Account & Checkout XSS escaping + shared-device storage minimization
check('SEC-03 & SEC-07: Account & checkout escape rendered fields, omit raw PII in storage, and purge legacy localStorage', () => {
  const ordersTbody = makeDomNode();
  const greetingEl = makeDomNode();
  const demoNameEl = makeDomNode();
  const trackerInput = makeDomNode({ value: 'RG-1' });
  const trackerStatus = makeDomNode();
  const trackerResult = makeDomNode();
  const trackBtn = makeDomNode();

  const sb = createSandbox({
    lsInit: {
      rg_demo_user_v1: JSON.stringify({ name: 'Legacy Local', email: 'legacy@example.com' }),
      rg_demo_orders_v1: JSON.stringify([{ orderNumber: 'RG-OLD', customer: { phone: '0300-1234567' } }]),
    },
    ssInit: {
      rg_demo_orders_v1: JSON.stringify([
        {
          orderNumber: '<img src=x onerror=alert(1)>',
          date: '<b>2026-11-25</b>',
          status: '<script>x</script>',
          customer: { city: 'Gilgit', province: 'Gilgit-Baltistan' },
          summary: { total: 4500 },
        },
      ]),
    },
    elements: {
      'rg-account-container': makeDomNode({ querySelectorAll: () => [], querySelector: () => null }),
      'rg-account-orders-tbody': ordersTbody,
      'rg-account-greeting': greetingEl,
      demo_name: demoNameEl,
      'rg-track-order-btn': trackBtn,
      'rg-track-order-input': trackerInput,
      'rg-track-order-status': trackerStatus,
      'rg-track-order-result': trackerResult,
    },
  });

  runScript(sb, 'assets/js/data/site-config.js');
  runScript(sb, 'assets/js/data/products.js');
  runScript(sb, 'assets/js/data-source.js');
  runScript(sb, 'assets/js/cart.js');
  runScript(sb, 'assets/js/ui.js');
  runScript(sb, 'assets/js/checkout.js');
  runScript(sb, 'assets/js/account.js');

  sb.RG.account.init();

  assert.equal(sb.localStorage.getItem('rg_demo_user_v1'), null, 'Legacy localStorage user PII must be purged');
  assert.equal(sb.localStorage.getItem('rg_demo_orders_v1'), null, 'Legacy localStorage order PII must be purged');
  assert.ok(!ordersTbody.innerHTML.includes('<img src=x onerror=alert(1)>'), 'Order number must be escaped');
  assert.ok(!ordersTbody.innerHTML.includes('<script>x</script>'), 'Order status must be escaped');

  // Verify checkout order submission writes only sessionStorage and omits phone/email/address/landmark
  const checkoutForm = new sb.MockForm('', 'rg-checkout-form', {
    billing_full_name: { value: 'Amina Bibi' },
    billing_phone: { value: '0312-3456789', classList: makeDomNode().classList, setAttribute() {}, removeAttribute() {} },
    billing_email: { value: 'amina@example.com', classList: makeDomNode().classList, setAttribute() {}, removeAttribute() {} },
    billing_state: { value: 'Gilgit-Baltistan' },
    billing_city: { value: 'Hunza' },
    billing_address_1: { value: 'House 12 Karimabad Lane' },
    billing_landmark: { value: 'Near Baltit Fort' },
    payment_method: { value: 'cod' },
  });
  checkoutForm.querySelectorAll = (sel) => (sel === '[required]' ? [] : []);
  let checkoutSubmit;
  checkoutForm.addEventListener = (t, fn) => { if (t === 'submit') checkoutSubmit = fn; };

  const sbCheckout = createSandbox({
    elements: {
      'rg-checkout-form': checkoutForm,
      'rg-checkout-order-summary': makeDomNode(),
      'rg-phone-error': makeDomNode(),
    },
  });
  runScript(sbCheckout, 'assets/js/data/site-config.js');
  runScript(sbCheckout, 'assets/js/data/products.js');
  runScript(sbCheckout, 'assets/js/data-source.js');
  runScript(sbCheckout, 'assets/js/cart.js');
  runScript(sbCheckout, 'assets/js/ui.js');
  runScript(sbCheckout, 'assets/js/checkout.js');

  sbCheckout.RG.checkout.initCheckoutPage();
  checkoutSubmit({ preventDefault() {} });

  assert.equal(sbCheckout.localStorage.getItem('rg_demo_orders_v1'), null, 'Orders must not persist in localStorage');
  const savedOrders = JSON.parse(sbCheckout.sessionStorage.getItem('rg_demo_orders_v1'));
  assert.ok(Array.isArray(savedOrders) && savedOrders.length === 1, 'Order saved in sessionStorage');
  const c = savedOrders[0].customer;
  assert.equal(c.phone, undefined, 'Phone must not persist in browser storage');
  assert.equal(c.email, undefined, 'Email must not persist in browser storage');
  assert.equal(c.address, undefined, 'Street address must not persist in browser storage');
  assert.equal(c.landmark, undefined, 'Landmark must not persist in browser storage');
});

// 6. SEC-08: Latent API Sanitization in data-source.js
check('SEC-08: RGDataSource sanitizes dangerous URLs while preserving legitimate catalog items', () => {
  const sb = createSandbox();
  runScript(sb, 'assets/js/data/site-config.js');
  runScript(sb, 'assets/js/data/products.js');
  runScript(sb, 'assets/js/data-source.js');

  const realCount = sb.RG_DATA.products.length;
  const products = sb.RG.data.getProducts();
  assert.equal(products.length, realCount, 'All real catalog products preserved');
  assert.ok(products.every((p) => p.images && p.images[0] && p.images[0].src.startsWith('assets/img/')), 'Valid local image paths preserved');

  assert.equal(sb.RG.data.sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sb.RG.data.sanitizeUrl('vbscript:msgbox(1)'), '');
  assert.equal(sb.RG.data.sanitizeUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sb.RG.data.sanitizeUrl('//evil.example/x.png'), '');
  assert.equal(sb.RG.data.sanitizeUrl('https://cdn.example.com/a.webp'), 'https://cdn.example.com/a.webp');

  sb.RG_DATA.products.push({
    id: 9999,
    name: 'Test Poisoned Item',
    image: 'javascript:alert(document.domain)',
    gallery: ['assets/img/ok.webp', 'data:text/html,<svg onload=alert(1)>'],
  });
  const sanitized = sb.RG.data.getProducts().find((p) => p.id === 9999);
  assert.equal(sanitized.image, '', 'Poisoned product image stripped');
  assert.deepEqual(Array.from(sanitized.gallery), ['assets/img/ok.webp', ''], 'Poisoned gallery item stripped');
});

// 7. SEC-09: Theme preset allowlist in main.js
check('SEC-09: initThemePresets rejects untrusted ?theme= and localStorage values', () => {
  const sb = createSandbox({
    search: '?theme="><img src=x onerror=alert(1)>',
    lsInit: { rg_theme_preset_v1: 'evil-theme' },
  });
  runScript(sb, 'assets/js/data/site-config.js');
  runScript(sb, 'assets/js/data/products.js');
  runScript(sb, 'assets/js/data/regions.js');
  runScript(sb, 'assets/js/data/artisans.js');
  runScript(sb, 'assets/js/data/journal.js');
  runScript(sb, 'assets/js/data-source.js');
  runScript(sb, 'assets/js/cart.js');
  runScript(sb, 'assets/js/wishlist.js');
  runScript(sb, 'assets/js/ui.js');
  runScript(sb, 'assets/js/main.js');
  for (const fn of sb._listeners.DOMContentLoaded || []) fn();

  assert.equal(sb._docEl.getAttribute('data-theme'), 'heritage', 'Must fall back to heritage for untrusted theme');

  const sbValid = createSandbox({ search: '?theme=mountain-night' });
  runScript(sbValid, 'assets/js/data/site-config.js');
  runScript(sbValid, 'assets/js/data/products.js');
  runScript(sbValid, 'assets/js/data/regions.js');
  runScript(sbValid, 'assets/js/data/artisans.js');
  runScript(sbValid, 'assets/js/data/journal.js');
  runScript(sbValid, 'assets/js/data-source.js');
  runScript(sbValid, 'assets/js/cart.js');
  runScript(sbValid, 'assets/js/wishlist.js');
  runScript(sbValid, 'assets/js/ui.js');
  runScript(sbValid, 'assets/js/main.js');
  for (const fn of sbValid._listeners.DOMContentLoaded || []) fn();

  assert.equal(sbValid._docEl.getAttribute('data-theme'), 'mountain-night', 'Allowlisted theme must apply');
});

// 8. SEC-10: Config & exposure rules present
check('SEC-10: .gitignore, _headers, and .htaccess contain hardening & exposure blocks', () => {
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.env') && gitignore.includes('scratch/'), '.gitignore missing patterns');

  const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
  assert.ok(headers.includes("frame-ancestors 'none'") && headers.includes('X-Content-Type-Options: nosniff'), '_headers missing directives');

  const htaccess = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');
  assert.ok(htaccess.includes('Options -Indexes') && htaccess.includes('tests') && htaccess.includes('scratch'), '.htaccess missing blocks');
});

console.log(results.join('\n'));
console.log(`\nALL SECURITY REGRESSION CHECKS PASSED (${passed}/${passed}).`);
