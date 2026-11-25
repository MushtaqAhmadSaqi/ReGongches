/* ==========================================================================
   ReGongches My Account & Loyalty Controller (assets/js/account.js)
   Login/register, orders, tracking timeline, addresses, Mountain Points
   ========================================================================== */
(function (window, document) {
  'use strict';

  const USER_KEY = 'rg_demo_user_v1';

  function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  const RGAccount = {
    init() {
      const container = document.getElementById('rg-account-container');
      if (!container) return;

      const tabList = container.querySelector('.woocommerce-MyAccount-navigation ul');
      if (tabList) tabList.setAttribute('role', 'tablist');

      const tabBtns = Array.from(container.querySelectorAll('[data-rg-acc-tab]'));
      const activateTab = (target, focusBtn) => {
        container.querySelectorAll('[data-rg-acc-li]').forEach((li) => {
          const isMatch = li.getAttribute('data-rg-acc-li') === target;
          li.classList.toggle('is-active', isMatch);
        });
        tabBtns.forEach((b) => {
          const isMatch = b.getAttribute('data-rg-acc-tab') === target;
          b.setAttribute('aria-selected', String(isMatch));
          b.setAttribute('tabindex', isMatch ? '0' : '-1');
          if (isMatch && focusBtn) b.focus();
        });
        container.querySelectorAll('[data-rg-acc-panel]').forEach((p) => {
          p.hidden = p.getAttribute('data-rg-acc-panel') !== target;
        });
      };

      tabBtns.forEach((btn, idx) => {
        const key = btn.getAttribute('data-rg-acc-tab');
        const li = btn.closest('[data-rg-acc-li]');
        const isActive = li ? li.classList.contains('is-active') : idx === 0;
        const tabId = `rg-acc-tab-${key}`;
        const panelId = `rg-acc-panel-${key}`;
        btn.id = tabId;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(isActive));
        btn.setAttribute('aria-controls', panelId);
        btn.setAttribute('tabindex', isActive ? '0' : '-1');

        const panel = container.querySelector(`[data-rg-acc-panel="${key}"]`);
        if (panel) {
          panel.id = panelId;
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tabId);
        }

        btn.addEventListener('click', () => activateTab(key, false));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const next = tabBtns[(idx + 1) % tabBtns.length];
            activateTab(next.getAttribute('data-rg-acc-tab'), true);
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length];
            activateTab(prev.getAttribute('data-rg-acc-tab'), true);
          }
        });
      });

      this.restoreSession();
      this.renderOrders();
      this.bindAuthDemo();
      this.bindOrderTracker();
    },

    restoreSession() {
      try {
        // Purge any legacy localStorage demo user data on shared devices
        window.localStorage.removeItem(USER_KEY);
        const raw = window.sessionStorage.getItem(USER_KEY);
        if (!raw) return;
        const user = JSON.parse(raw);
        if (user && typeof user.name === 'string' && user.name.trim()) {
          const safeName = user.name.trim().slice(0, 80);
          const greeting = document.getElementById('rg-account-greeting');
          if (greeting) greeting.textContent = `Welcome back, ${safeName}. Ready to track your orders and rewards.`;
          const nameInput = document.getElementById('demo_name');
          if (nameInput && !nameInput.value) nameInput.value = safeName;
        }
      } catch (e) {}
    },

    renderOrders() {
      const tbody = document.getElementById('rg-account-orders-tbody');
      if (!tbody) return;
      const orders = (window.RG.checkout && window.RG.checkout.getSavedOrders()) || [];
      const fmt = window.RG.data.formatPKR;

      if (!orders.length) {
        tbody.innerHTML = `
          <tr>
            <td><strong>RG-202647</strong></td>
            <td>2026-10-18</td>
            <td><span class="rg-badge rg-badge--verified">Quality Checked</span></td>
            <td>PKR 6,800 (2 items)</td>
            <td><a href="order-confirmation.html?order=RG-202647" class="rg-btn rg-btn--outline rg-btn--sm">View Receipt</a></td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = orders.map((o) => `
        <tr>
          <td><strong>${escHtml(o.orderNumber)}</strong></td>
          <td>${escHtml(o.date)}</td>
          <td><span class="rg-badge rg-badge--verified">${escHtml(o.status)}</span></td>
          <td>${fmt(o && o.summary ? o.summary.total : 0)}</td>
          <td><a href="order-confirmation.html?order=${encodeURIComponent(o.orderNumber || '')}" class="rg-btn rg-btn--outline rg-btn--sm">View Receipt</a></td>
        </tr>
      `).join('');
    },

    bindAuthDemo() {
      const form = document.getElementById('rg-demo-login-form');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawName = form.elements.demo_name ? form.elements.demo_name.value.trim() : 'Areeba Khan';
        const name = (rawName || 'Areeba Khan').slice(0, 80);
        try {
          window.localStorage.removeItem(USER_KEY);
          window.sessionStorage.setItem(USER_KEY, JSON.stringify({ name }));
        } catch (err) {}
        const greeting = document.getElementById('rg-account-greeting');
        if (greeting) greeting.textContent = `Welcome back, ${name}. Ready to track your orders and rewards.`;
        window.RG.ui.toast(`Signed in as ${name}.`);
      });
    },

    bindOrderTracker() {
      const trackBtn = document.getElementById('rg-track-order-btn');
      const resultBox = document.getElementById('rg-track-order-result');
      const inputEl = document.getElementById('rg-track-order-input');
      const statusMsg = document.getElementById('rg-track-order-status');
      if (!trackBtn || !resultBox) return;
      trackBtn.addEventListener('click', () => {
        const ordId = inputEl ? String(inputEl.value || '').trim().toUpperCase() : 'RG-202647';
        if (!ordId) {
          window.RG.ui.toast('Please enter an Order ID (for example RG-202647).');
          if (inputEl) inputEl.focus();
          return;
        }
        const saved = (window.RG.checkout && window.RG.checkout.getSavedOrders()) || [];
        const match = saved.find((o) => String(o.orderNumber || '').toUpperCase() === ordId);
        if (statusMsg) {
          statusMsg.innerHTML = match
            ? `Showing live batch timeline for <strong>${escHtml(match.orderNumber)}</strong> (${escHtml(match.customer && match.customer.city ? match.customer.city : 'Pakistan')} · Placed ${escHtml(match.date)}).`
            : `Showing benchmark dispatch timeline for sample order <strong>${escHtml(ordId)}</strong>.`;
        }
        resultBox.hidden = false;
        window.RG.ui.toast(`Updated timeline for ${ordId}.`);
      });
    }
  };

  window.RG = window.RG || {};
  window.RG.account = RGAccount;
})(window, document);
