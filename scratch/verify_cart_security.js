const fs = require('fs');

// Mock browser environment
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  localStorage: localStorageMock,
  addEventListener: () => {},
  dispatchEvent: () => {},
  Intl: Intl
};
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

// 1. Load data.js
eval(fs.readFileSync('js/data.js', 'utf8'));

// 2. Pre-seed localStorage with TAMPERED data
const tamperedPayload = {
  items: [
    {
      productId: 1, // Traditional Gilgiti Cap (Catalog price is PKR 1,800)
      price: 1,     // Attacker changed price to PKR 1
      qty: 9999,    // Attacker changed quantity to 9999
      size: '56 cm (M)',
      colour: 'Natural Cream',
      customNote: '<img src=x onerror=alert(1)>' // Attacker injected XSS
    },
    {
      productId: 'fake-injected-id-999', // Non-existent product
      price: 0,
      qty: 1
    }
  ]
};
localStorageMock.setItem('rg_cart_v2', JSON.stringify(tamperedPayload));

// 3. Load cart.js
eval(fs.readFileSync('js/cart.js', 'utf8'));

// 4. Verify audited cart state
const summary = window.RG.cart.getSummary();

console.log('=== ANTI-TAMPERING VERIFICATION RESULTS ===');
console.log('Total items in cart:', summary.items.length);
if (summary.items.length === 1) {
  console.log('✓ Successfully pruned nonexistent product ID "fake-injected-id-999"');
} else {
  console.error('✗ Failed to prune fake product ID');
  process.exit(1);
}

const item1 = summary.items[0];
console.log('Item 1 Name:', item1.name);
console.log('Item 1 Enforced Price:', item1.price, '(Catalog: 1800)');
if (item1.price === 1800) {
  console.log('✓ Successfully overwrote tampered price (1 PKR -> 1800 PKR)');
} else {
  console.error('✗ Price tampering was not prevented!');
  process.exit(1);
}

console.log('Item 1 Clamped Qty:', item1.qty, '(Attempted: 9999)');
if (item1.qty === 20) {
  console.log('✓ Successfully clamped quantity to maximum allowed 20 units');
} else {
  console.error('✗ Quantity was not clamped properly!');
  process.exit(1);
}

console.log('Calculated Subtotal:', summary.subtotal, '(Expected: 1800 * 20 = 36000)');
if (summary.subtotal === 36000) {
  console.log('✓ Subtotal matches authoritative catalog computation');
} else {
  console.error('✗ Subtotal calculation mismatch!');
  process.exit(1);
}

console.log('\nAll Anti-Tampering and Security Invariants VERIFIED!');
