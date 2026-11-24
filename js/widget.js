/**
 * ============================================================================
 * STACKDEALS EMBEDDABLE WIDGET - v2.2 (Offerwall Integrated, Defensive)
 * ============================================================================
 * Self-contained: injects scoped CSS (.sd-*), loads Turnstile, manages
 * signup -> verify -> dashboard lifecycle, and features robust error handling.
 * 
 * Cinematix/Video logic REMOVED. Offerwall handoff + In-app notifications ADDED.
 * ============================================================================
 */
(function () {
  'use strict';
  
  // 1. Double-inclusion guard
  if (window.__sdWidgetLoaded) return;
  window.__sdWidgetLoaded = true;

  // 2. Configuration
  const rootEl = document.getElementById('stackdeals-widget');
  if (!rootEl) return;

  const cfg = Object.assign({
    apiBase: '/api',
    siteKey: '0x4AAAAAAGFNBZrXJTf5C2J5', // Replace with your actual Turnstile Site Key
    homeUrl: 'https://getstackdeals.xyz'
  }, window.StackDealsConfig || {});

  if (rootEl.dataset.sitekey) cfg.siteKey = rootEl.dataset.sitekey;
  if (rootEl.dataset.apiBase) cfg.apiBase = rootEl.dataset.apiBase.replace(/\/$/, '');

  // 3. Scoped CSS Injection
  const WIDGET_CSS = `.sd-widget{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)} .sd-widget *{box-sizing:border-box;margin:0;padding:0} .sd-widget h2{font-size:22px;font-weight:800;margin-bottom:8px;color:#0f172a} .sd-widget h3{font-size:16px;font-weight:700;margin:16px 0 8px;color:#0f172a} .sd-widget p{font-size:14px;color:#475569;line-height:1.5;margin-bottom:12px} .sd-widget .sd-muted{color:#64748b;font-size:13px} .sd-widget label{display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px} .sd-widget input[type="email"]{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;outline:none;transition:border .2s} .sd-widget input[type="email"]:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.1)} .sd-widget .sd-check{display:flex;align-items:flex-start;gap:8px;margin:12px 0;font-size:13px;color:#475569} .sd-widget .sd-check input{margin-top:3px;accent-color:#2563eb} .sd-widget .sd-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none} .sd-widget .sd-btn-primary{background:#2563eb;color:#fff} .sd-widget .sd-btn-primary:hover{background:#1d4ed8} .sd-widget .sd-btn-primary:disabled{background:#94a3b8;cursor:not-allowed} .sd-widget .sd-btn-success{background:#10b981;color:#fff} .sd-widget .sd-btn-success:hover{background:#059669} .sd-widget .sd-btn-ghost{background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0} .sd-widget .sd-msg{padding:12px;border-radius:8px;font-size:14px;margin-bottom:16px;text-align:center} .sd-widget .sd-msg-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0} .sd-widget .sd-msg-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca} .sd-widget .sd-msg-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a} .sd-widget .sd-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px} .sd-widget .sd-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center} .sd-widget .sd-stat-val{font-size:24px;font-weight:800;color:#2563eb} .sd-widget .sd-stat-lbl{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px} .sd-widget .sd-ref{display:flex;gap:8px;margin-bottom:20px} .sd-widget .sd-ref input{flex:1;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;color:#475569;font-family:monospace} .sd-widget .sd-tasks{display:flex;flex-direction:column;gap:10px} .sd-widget .sd-task{display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;gap:10px} .sd-widget .sd-task-info{display:flex;flex-direction:column;min-width:0} .sd-widget .sd-task-title{font-size:15px;font-weight:700;color:#0f172a} .sd-widget .sd-task-desc{font-size:13px;color:#64748b} .sd-widget .sd-badge{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap} .sd-widget .sd-badge-hot{background:#2563eb;color:#fff;border:none;cursor:pointer} .sd-widget .sd-badge-done{background:#dcfce7;color:#166534;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap} .sd-widget .sd-spinner{width:20px;height:20px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:sd-spin 1s linear infinite;margin:24px auto} @keyframes sd-spin{to{transform:rotate(360deg)}} .sd-widget .sd-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px} .sd-widget .sd-bell{position:relative;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;font-size:16px;cursor:pointer} .sd-widget .sd-bell-badge{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;border-radius:99px;padding:2px 6px} .sd-widget .sd-notifs{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:10px 0 4px;max-height:220px;overflow:auto} .sd-widget .sd-notif{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155} .sd-widget .sd-notif:last-child{border-bottom:none}`;
  
  const styleEl = document.createElement('style');
  styleEl.textContent = WIDGET_CSS;
  document.head.appendChild(styleEl);

  // 4. Helpers
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  };

  /**
   * v2.2 Core Fix: Defensive API helper that NEVER throws.
   * - Network failure -> { ok: false, error: '...', _network: true }
   * - Worker JSON (any status) -> parsed JSON (real error message preserved)
   * - Non-JSON (WAF/Access/500) -> { ok: false, error: 'Server error (HTTP xxx)' }
   */
  const api = async (path, opts) => {
    let res;
    try {
      res = await fetch(cfg.apiBase + path, opts || {});
    } catch (e) {
      return { ok: false, error: 'Cannot reach the server. Check your internet connection and try again.', _network: true };
    }
    let text = '';
    try { text = await res.text(); } catch (e) { text = ''; }
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') return data;
      return { ok: false, error: 'Unexpected server response (HTTP ' + res.status + ').' };
    } catch (e) {
      return { ok: false, error: 'Server error (HTTP ' + res.status + '). If this keeps happening, try again in a few minutes.' };
    }
  };

  function copyText(text, btn) {
    const done = () => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Select & copy'; }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  // 5. State & Root Setup
  rootEl.className = 'sd-widget';
  const state = {
    session: store.get('sd_session'),
    view: 'loading',          // loading | signup | pending | dashboard
    me: null,
    today: null,
    campaign: null,
    referrals: { total: 0, qualified: 0 },
    unread: 0,
    turnstileId: null,
    verifyError: null
  };

  function render() {
    rootEl.innerHTML = '';
    state.turnstileId = null;
    if (state.view === 'loading') return renderLoading();
    if (state.view === 'signup') return renderSignup();
    if (state.view === 'pending') return renderPending();
    if (state.view === 'dashboard') return renderDashboard();
  }

  // 6. Views
  function renderLoading() {
    rootEl.innerHTML = '<div class="sd-spinner"></div>';
  }

  function renderSignup() {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || store.get('sd_ref') || '';
    
    rootEl.innerHTML =
      '<h2>Enter the Giveaway</h2>' +
      '<p>Join thousands earning entries. <strong>100% Free to enter.</strong></p>' +
      '<div id="sd-msg"></div>' +
      (state.verifyError ? '<div class="sd-msg sd-msg-warn">' + esc(state.verifyError) + ' Enter your email below to get a fresh confirmation link.</div>' : '') +
      '<form id="sd-form">' +
        '<label for="sd-email">Email Address</label>' +
        '<input type="email" id="sd-email" required placeholder="you@example.com" autocomplete="email">' +
        '<label class="sd-check">' +
          '<input type="checkbox" id="sd-consent" required>' +
          '<span>I agree to the <a href="/contest-rules.html" target="_blank" rel="noopener" style="color:#2563eb">Official Rules</a> and <a href="/privacy.html" target="_blank" rel="noopener" style="color:#2563eb">Privacy Policy</a>. I am 18+ and a resident of the US, UK, or Canada.</span>' +
        '</label>' +
        '<div id="sd-turnstile" style="margin:16px 0;min-height:65px"></div>' +
        '<button type="submit" id="sd-submit" class="sd-btn sd-btn-primary" disabled>Loading security check…</button>' +
      '</form>' +
      '<p class="sd-muted" style="text-align:center;margin-top:16px">No purchase necessary. Void where prohibited.</p>';

    const setBtnReady = () => {
      const btn = $('#sd-submit');
      if (btn && btn.disabled) {
        btn.disabled = false;
        btn.textContent = 'Get My Entries';
      }
    };
    const setBtnBusy = (label) => {
      const btn = $('#sd-submit');
      if (btn) { btn.disabled = true; btn.textContent = label; }
    };
    const mountTurnstile = () => {
      try {
        state.turnstileId = window.turnstile.render('#sd-turnstile', {
          sitekey: cfg.siteKey,
          callback: setBtnReady,
          'expired-callback': function () { setBtnBusy('Verification expired — complete the check again'); },
          'error-callback': function () {
            const box = $('#sd-turnstile');
            if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check failed to load. Refresh the page and try again.</div>';
          }
        });
      } catch (e) {
        const box = $('#sd-turnstile');
        if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check unavailable. Refresh the page and try again.</div>';
      }
    };

    if (window.turnstile && window.turnstile.render) {
      mountTurnstile();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = mountTurnstile;
      s.onerror = function () {
        const box = $('#sd-turnstile');
        if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check could not load. Check your connection and refresh.</div>';
      };
      document.head.appendChild(s);
    }

    $('#sd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#sd-submit');
      const msg = $('#sd-msg');
      if (!btn) return;

      let token = '';
      try { token = window.turnstile ? (window.turnstile.getResponse(state.turnstileId) || '') : ''; } catch (err) { token = ''; }
      
      if (!token) {
        msg.className = 'sd-msg sd-msg-err';
        msg.textContent = 'Please complete the security check above, then try again.';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="sd-spinner" style="margin:0;width:18px;height:18px;border-width:2px;border-top-color:#fff"></span>';

      const payload = {
        email: $('#sd-email').value,
        consent: $('#sd-consent').checked,
        ref: refCode,
        'cf-turnstile-response': token
      };

      const res = await api('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        msg.className = 'sd-msg sd-msg-ok';
        msg.textContent = res.message || 'Success!';
        if (res.already && res.session) {
          store.set('sd_session', res.session);
          state.session = res.session;
          state.verifyError = null;
          await loadDashboard();
        } else {
          state.view = 'pending';
          render();
        }
        return;
      }

      // v2.2: Surface the REAL server error (403 bot check, 429 velocity, WAF, etc.)
      msg.className = 'sd-msg sd-msg-err';
      msg.textContent = (res && res.error) || 'Signup failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Get My Entries';
      try { if (window.turnstile) window.turnstile.reset(state.turnstileId); } catch (err) { /* noop */ }
    });
  }

  function renderPending() {
    rootEl.innerHTML =
      '<h2>Check Your Inbox 📬</h2>' +
      '<div class="sd-msg sd-msg-ok">We sent a confirmation link to your email.</div>' +
      '<p>Click the link in the email to verify your address and lock in your <strong>+1 Entry</strong>. Your referral link unlocks immediately after.</p>' +
      '<p class="sd-muted">Don\'t see it? Check your spam or promotions folder. The link expires in 72 hours.</p>' +
      '<button class="sd-btn sd-btn-ghost" id="sd-refresh-btn">I clicked it — refresh my status</button>';
    $('#sd-refresh-btn').addEventListener('click', () => location.reload());
  }

  function renderDashboard() {
    const me = state.me || {};
    const today = state.today || {};
    const camp = state.campaign;
    const refs = state.referrals || { total: 0, qualified: 0 };
    const offersLeft = (today.offer_daily_cap || 10) - (today.offers_completed || 0);
    const refUrl = cfg.homeUrl + '/?ref=' + encodeURIComponent(me.referral_code || '');

    rootEl.innerHTML =
      '<div class="sd-head">' +
        '<div><h2>🎉 You\'re Entered!</h2><p class="sd-muted">' + (camp && camp.title ? esc(camp.title) : 'Active Giveaway') + '</p></div>' +
        '<button class="sd-bell" id="sd-bell" title="Notifications">🔔' + (state.unread > 0 ? '<span class="sd-bell-badge">' + state.unread + '</span>' : '') + '</button>' +
      '</div>' +
      '<div id="sd-notifs" class="sd-notifs sd-hidden"></div>' +
      '<div class="sd-stats">' +
        '<div class="sd-stat"><div class="sd-stat-val" id="sd-points">' + Number(me.points || 0) + '</div><div class="sd-stat-lbl">Total Entries</div></div>' +
        '<div class="sd-stat"><div class="sd-stat-val">' + Number(refs.total || 0) + '</div><div class="sd-stat-lbl">Friends Joined</div></div>' +
      '</div>' +
      '<h3>Your Referral Link</h3>' +
      '<p class="sd-muted" style="margin-bottom:8px">+10 entries when a friend joins · +90 more when they complete their first bonus task.</p>' +
      '<div class="sd-ref">' +
        '<input type="text" id="sd-ref-link" value="' + esc(refUrl) + '" readonly>' +
        '<button class="sd-btn sd-btn-primary" style="width:auto;padding:10px 16px" id="sd-copy-ref">Copy</button>' +
      '</div>' +
      '<h3>Ways to Earn</h3>' +
      '<div class="sd-tasks">' +
        '<div class="sd-task">' +
          '<div class="sd-task-info">' +
            '<span class="sd-task-title">Daily Check-In</span>' +
            '<span class="sd-task-desc">Come back every day to claim</span>' +
          '</div>' +
          (today.checked_in
            ? '<span class="sd-badge-done">Claimed ✓</span>'
            : '<button class="sd-btn sd-btn-success" style="width:auto;padding:8px 16px" id="sd-checkin-btn">+5</button>') +
        '</div>' +
        '<div class="sd-task">' +
          '<div class="sd-task-info">' +
            '<span class="sd-task-title">Bonus Tasks (60–90 sec each)</span>' +
            '<span class="sd-task-desc">' + (offersLeft > 0 ? offersLeft + ' of ' + today.offer_daily_cap + ' left today' : 'Daily limit reached — back tomorrow!') + '</span>' +
          '</div>' +
          '<button class="sd-btn sd-badge sd-badge-hot" style="border:none;cursor:pointer" id="sd-offerwall-btn">' + (offersLeft > 0 ? 'Earn +50–300' : 'View') + '</button>' +
        '</div>' +
      '</div>' +
      '<p class="sd-muted" style="margin-top:14px;text-align:center">Tasks are free, fast, and credit automatically. 🔒 Verified & secure.</p>';

    $('#sd-copy-ref').addEventListener('click', function () {
      copyText(refUrl, this);
    });

    // Offerwall Handoff
    $('#sd-offerwall-btn').addEventListener('click', async () => {
      const btn = $('#sd-offerwall-btn');
      btn.disabled = true; btn.textContent = 'Opening…';
      try {
        const res = await api('/offerwall-link?session=' + encodeURIComponent(state.session));
        if (res && res.ok && res.url) {
          window.open(res.url, '_blank', 'noopener');
        } else {
          alert((res && res.error) || 'Could not open the bonus wall. Try again.');
        }
      } catch (e) {
        alert('Network error. Please try again.');
      }
      btn.disabled = false;
      btn.textContent = (offersLeft > 0) ? 'Earn +50–300' : 'View';
    });

    // Notification Bell
    $('#sd-bell').addEventListener('click', async () => {
      const box = $('#sd-notifs');
      if (!box.classList.contains('sd-hidden')) { 
        box.classList.add('sd-hidden'); 
        return; 
      }
      box.innerHTML = '<div class="sd-notif">Loading…</div>';
      box.classList.remove('sd-hidden');
      try {
        const res = await api('/notifications?session=' + encodeURIComponent(state.session));
        const list = (res && res.notifications) ? res.notifications : [];
        box.innerHTML = list.length
          ? list.map((n) => '<div class="sd-notif">' + esc(n.message) + '</div>').join('')
          : '<div class="sd-notif">No notifications yet — complete a bonus task!</div>';
        
        if (state.unread > 0) {
          await api('/notifications/read', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ session: state.session }) 
          });
          state.unread = 0;
          const badge = $('.sd-bell-badge'); 
          if (badge) badge.remove();
        }
      } catch (e) { 
        box.innerHTML = '<div class="sd-notif">Could not load notifications.</div>'; 
      }
    });

    // Daily Check-in
    if (!today.checked_in) {
      $('#sd-checkin-btn').addEventListener('click', async function () {
        const btn = this;
        btn.disabled = true;
        btn.textContent = '…';
        const res = await api('/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: state.session })
        });
        if (res && res.ok) {
          btn.outerHTML = '<span class="sd-badge-done">Claimed ✓</span>';
          state.me.points = Number(state.me.points || 0) + Number(res.awarded || 0);
          state.today.checked_in = true;
          const ptsEl = $('#sd-points');
          if (ptsEl) ptsEl.textContent = state.me.points;
        } else {
          btn.disabled = false;
          btn.textContent = '+5';
          alert((res && res.error) || 'Check-in failed. Please try again.');
        }
      });
    }
  }

  // 7. Data Loaders
  async function loadDashboard() {
    state.view = 'loading';
    render();
    
    const meRes = await api('/me?session=' + encodeURIComponent(state.session));
    if (!meRes || !meRes.ok || !meRes.me) {
      store.del('sd_session');
      state.session = null;
      state.view = 'signup';
      render();
      return;
    }

    state.me = meRes.me;
    state.today = meRes.today || {};
    state.referrals = meRes.referrals || { total: 0, qualified: 0 };
    state.unread = meRes.unread_notifications || 0;

    const campRes = await api('/campaign');
    state.campaign = (campRes && campRes.ok) ? campRes.campaign : null;

    state.view = 'dashboard';
    render();
  }

  // 8. Init & URL Listener
  async function init() {
    const params = new URLSearchParams(window.location.search);
    
    // Persist referral attribution
    const refParam = params.get('ref');
    if (refParam && /^[a-zA-Z0-9_-]{3,20}$/.test(refParam)) {
      store.set('sd_ref', refParam);
    }

    // Email verification click: ?verify=TOKEN
    const verifyToken = params.get('verify');
    if (verifyToken) {
      state.view = 'loading';
      render();
      const res = await api('/verify?token=' + encodeURIComponent(verifyToken));
      if (res && res.ok && res.session) {
        store.set('sd_session', res.session);
        state.session = res.session;
        state.verifyError = null;
        const keepRef = params.get('ref');
        window.history.replaceState({}, document.title, window.location.pathname + (keepRef ? '?ref=' + encodeURIComponent(keepRef) : ''));
      } else {
        state.verifyError = (res && res.error) || 'That confirmation link is invalid or expired.';
        store.del('sd_session');
        state.session = null;
      }
    }

    if (state.session) {
      await loadDashboard();
    } else {
      state.view = 'signup';
      render();
    }
  }

  init();
})();/**
 * ============================================================================
 * STACKDEALS EMBEDDABLE WIDGET  -  v2.1 (full rewrite)
 * ============================================================================
 * Self-contained: injects its own scoped CSS (.sd-* prefix), loads Turnstile,
 * manages signup -> verify -> dashboard lifecycle, and never relies on any
 * host-page styles or scripts.
 *
 * Config (optional overrides):
 *   1. <div id="stackdeals-widget" data-sitekey="0x4AAA..." data-api-base="/api"></div>
 *   2. window.StackDealsConfig = { siteKey: '...', apiBase: '/api' } before this script
 *
 * NOTE: The siteKey here MUST belong to the same Turnstile widget whose
 * secret key is stored in the Worker's TURNSTILE_SECRET. A mismatched pair
 * = green checkbox on the client, 403 on the server.
 * ============================================================================
 */
(function () {
  'use strict';

  if (window.__sdWidgetLoaded) return; // double-inclusion guard
  window.__sdWidgetLoaded = true;

  // ------------------------------------------------------------------ CONFIG
  const rootEl = document.getElementById('stackdeals-widget');
  if (!rootEl) return;

  const cfg = Object.assign({
    apiBase: '/api',
    siteKey: '0x4AAAAAAGFNBZrXJTf5C2J5',
    cinematixGoUrl: 'https://watchcinematix.xyz/go',
    homeUrl: 'https://getstackdeals.xyz'
  }, window.StackDealsConfig || {});

  if (rootEl.dataset.sitekey)  cfg.siteKey  = rootEl.dataset.sitekey;
  if (rootEl.dataset.apiBase)  cfg.apiBase  = rootEl.dataset.apiBase.replace(/\/$/, '');

  // ----------------------------------------------------- SCOPED CSS INJECTION
  const WIDGET_CSS = `
    .sd-widget{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
    .sd-widget *{box-sizing:border-box;margin:0;padding:0}
    .sd-widget h2{font-size:22px;font-weight:800;margin-bottom:8px;color:#0f172a}
    .sd-widget h3{font-size:16px;font-weight:700;margin:16px 0 8px;color:#0f172a}
    .sd-widget p{font-size:14px;color:#475569;line-height:1.5;margin-bottom:12px}
    .sd-widget .sd-muted{color:#64748b;font-size:13px}
    .sd-widget label{display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px}
    .sd-widget input[type="email"]{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;outline:none;transition:border .2s}
    .sd-widget input[type="email"]:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.1)}
    .sd-widget .sd-check{display:flex;align-items:flex-start;gap:8px;margin:12px 0;font-size:13px;color:#475569}
    .sd-widget .sd-check input{margin-top:3px;accent-color:#2563eb}
    .sd-widget .sd-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none}
    .sd-widget .sd-btn-primary{background:#2563eb;color:#fff}
    .sd-widget .sd-btn-primary:hover{background:#1d4ed8}
    .sd-widget .sd-btn-primary:disabled{background:#94a3b8;cursor:not-allowed}
    .sd-widget .sd-btn-success{background:#10b981;color:#fff}
    .sd-widget .sd-btn-success:hover{background:#059669}
    .sd-widget .sd-btn-ghost{background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0}
    .sd-widget .sd-msg{padding:12px;border-radius:8px;font-size:14px;margin-bottom:16px;text-align:center}
    .sd-widget .sd-msg-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
    .sd-widget .sd-msg-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
    .sd-widget .sd-msg-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
    .sd-widget .sd-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
    .sd-widget .sd-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center}
    .sd-widget .sd-stat-val{font-size:24px;font-weight:800;color:#2563eb}
    .sd-widget .sd-stat-lbl{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .sd-widget .sd-ref{display:flex;gap:8px;margin-bottom:20px}
    .sd-widget .sd-ref input{flex:1;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;color:#475569;font-family:monospace}
    .sd-widget .sd-tasks{display:flex;flex-direction:column;gap:10px}
    .sd-widget .sd-task{display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;gap:10px}
    .sd-widget .sd-task-info{display:flex;flex-direction:column;min-width:0}
    .sd-widget .sd-task-title{font-size:15px;font-weight:700;color:#0f172a}
    .sd-widget .sd-task-desc{font-size:13px;color:#64748b}
    .sd-widget .sd-badge{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap}
    .sd-widget .sd-badge-done{background:#dcfce7;color:#166534;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap}
    .sd-widget .sd-spinner{width:20px;height:20px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:sd-spin 1s linear infinite;margin:24px auto}
    @keyframes sd-spin{to{transform:rotate(360deg)}}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = WIDGET_CSS;
  document.head.appendChild(styleEl);

  // ----------------------------------------------------------------- HELPERS
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  };

  /**
   * v2.1 core fix: this helper NEVER throws.
   *  - true network failure      -> { ok:false, error, _network:true }
   *  - Worker JSON (any status)  -> parsed JSON (real error message preserved)
   *  - non-JSON (WAF/Access/500) -> { ok:false, error:'Server error (HTTP xxx)' }
   */
  const api = async (path, opts) => {
    let res;
    try {
      res = await fetch(cfg.apiBase + path, opts || {});
    } catch (e) {
      return { ok: false, error: 'Cannot reach the server. Check your internet connection and try again.', _network: true };
    }
    let text = '';
    try { text = await res.text(); } catch (e) { text = ''; }
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') return data;
      return { ok: false, error: 'Unexpected server response (HTTP ' + res.status + ').' };
    } catch (e) {
      return { ok: false, error: 'Server error (HTTP ' + res.status + '). If this keeps happening, try again in a few minutes.' };
    }
  };

  function copyText(text, btn) {
    const done = () => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Select & copy'; }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  // ------------------------------------------------------------ STATE & ROOT
  rootEl.className = 'sd-widget';

  const state = {
    session: store.get('sd_session'),
    view: 'loading',          // loading | signup | pending | dashboard
    me: null,
    today: null,
    campaign: null,
    turnstileId: null,
    verifyError: null         // set when ?verify= link was invalid/expired
  };

  function render() {
    rootEl.innerHTML = '';
    state.turnstileId = null;
    if (state.view === 'loading')   return renderLoading();
    if (state.view === 'signup')    return renderSignup();
    if (state.view === 'pending')   return renderPending();
    if (state.view === 'dashboard') return renderDashboard();
  }

  // ------------------------------------------------------------------- VIEWS
  function renderLoading() {
    rootEl.innerHTML = '<div class="sd-spinner"></div>';
  }

  function renderSignup() {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || store.get('sd_ref') || '';

    rootEl.innerHTML =
      '<h2>Enter the Giveaway</h2>' +
      '<p>Join thousands earning points. <strong>100% Free to enter.</strong></p>' +
      '<div id="sd-msg"></div>' +
      (state.verifyError
        ? '<div class="sd-msg sd-msg-warn">' + esc(state.verifyError) + ' Enter your email below to get a fresh confirmation link.</div>'
        : '') +
      '<form id="sd-form">' +
        '<label for="sd-email">Email Address</label>' +
        '<input type="email" id="sd-email" required placeholder="you@example.com" autocomplete="email">' +
        '<label class="sd-check">' +
          '<input type="checkbox" id="sd-consent" required>' +
          '<span>I agree to the <a href="/contest-rules.html" target="_blank" rel="noopener" style="color:#2563eb">Official Rules</a> and <a href="/privacy.html" target="_blank" rel="noopener" style="color:#2563eb">Privacy Policy</a>. I am 18+ and a resident of the US, UK, or Canada.</span>' +
        '</label>' +
        '<div id="sd-turnstile" style="margin:16px 0;min-height:65px"></div>' +
        '<button type="submit" id="sd-submit" class="sd-btn sd-btn-primary" disabled>Loading security check…</button>' +
      '</form>' +
      '<p class="sd-muted" style="text-align:center;margin-top:16px">No purchase necessary. Void where prohibited.</p>';

    const setBtnReady = () => {
      const btn = $('#sd-submit');
      if (btn && btn.disabled) {
        btn.disabled = false;
        btn.textContent = 'Get My Bonus Entries';
      }
    };
    const setBtnBusy = (label) => {
      const btn = $('#sd-submit');
      if (btn) { btn.disabled = true; btn.textContent = label; }
    };

    const mountTurnstile = () => {
      try {
        state.turnstileId = window.turnstile.render('#sd-turnstile', {
          sitekey: cfg.siteKey,
          callback: setBtnReady,
          'expired-callback': function () { setBtnBusy('Verification expired — complete the check again'); },
          'error-callback': function () {
            const box = $('#sd-turnstile');
            if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check failed to load. Refresh the page and try again.</div>';
          }
        });
      } catch (e) {
        const box = $('#sd-turnstile');
        if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check unavailable. Refresh the page and try again.</div>';
      }
    };

    if (window.turnstile && window.turnstile.render) {
      mountTurnstile();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = mountTurnstile;
      s.onerror = function () {
        const box = $('#sd-turnstile');
        if (box) box.innerHTML = '<div class="sd-msg sd-msg-warn" style="margin:0">Security check could not load. Check your connection and refresh.</div>';
      };
      document.head.appendChild(s);
    }

    $('#sd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#sd-submit');
      const msg = $('#sd-msg');
      if (!btn) return;

      // v2.1: never submit an empty or expired Turnstile token
      let token = '';
      try { token = window.turnstile ? (window.turnstile.getResponse(state.turnstileId) || '') : ''; } catch (err) { token = ''; }
      if (!token) {
        msg.className = 'sd-msg sd-msg-err';
        msg.textContent = 'Please complete the security check above, then try again.';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="sd-spinner" style="margin:0;width:18px;height:18px;border-width:2px;border-top-color:#fff"></span>';

      const payload = {
        email: $('#sd-email').value,
        consent: $('#sd-consent').checked,
        ref: refCode,
        'cf-turnstile-response': token
      };

      const res = await api('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        msg.className = 'sd-msg sd-msg-ok';
        msg.textContent = res.message || 'Success!';
        if (res.already && res.session) {
          store.set('sd_session', res.session);
          state.session = res.session;
          state.verifyError = null;
          await loadDashboard();
        } else {
          state.view = 'pending';
          render();
        }
        return;
      }

      // v2.1: surface the REAL server error (403 bot check, 429 velocity, WAF, etc.)
      msg.className = 'sd-msg sd-msg-err';
      msg.textContent = (res && res.error) || 'Signup failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Get My Bonus Entries';
      try { if (window.turnstile) window.turnstile.reset(state.turnstileId); } catch (err) { /* noop */ }
    });
  }

  function renderPending() {
    rootEl.innerHTML =
      '<h2>Check Your Inbox 📬</h2>' +
      '<div class="sd-msg sd-msg-ok">We sent a confirmation link to your email.</div>' +
      '<p>Click the link in the email to verify your address and lock in your <strong>+1 Bonus Entry</strong>. Your referral link unlocks immediately after.</p>' +
      '<p class="sd-muted">Don\'t see it? Check your spam or promotions folder. The link expires in 72 hours.</p>' +
      '<button class="sd-btn sd-btn-ghost" id="sd-refresh-btn">I clicked it — refresh my status</button>';
    $('#sd-refresh-btn').addEventListener('click', () => location.reload());
  }

  function renderDashboard() {
    const me = state.me || {};
    const today = state.today || {};
    const camp = state.campaign;

    const nextVidPts = today.next_video_pts || 10;
    const cap = today.daily_video_cap || 12;
    const watched = today.videos_watched || 0;
    const vidsLeft = Math.max(0, cap - watched);
    const watchUrl = cfg.cinematixGoUrl + '?e=' + encodeURIComponent(me.id || '');
    const refUrl = cfg.homeUrl + '/?ref=' + encodeURIComponent(me.referral_code || '');

    rootEl.innerHTML =
      '<h2>🎉 You\'re Entered!</h2>' +
      '<p class="sd-muted">' + (camp && camp.title ? esc(camp.title) : 'Active Giveaway') + '</p>' +
      '<div class="sd-stats">' +
        '<div class="sd-stat"><div class="sd-stat-val" id="sd-points">' + Number(me.points || 0) + '</div><div class="sd-stat-lbl">Total Entries</div></div>' +
        '<div class="sd-stat"><div class="sd-stat-val" id="sd-rank">#' + Number(me.rank || 0) + '</div><div class="sd-stat-lbl">Current Rank</div></div>' +
      '</div>' +
      '<h3>Your Referral Link (+5 pts each)</h3>' +
      '<div class="sd-ref">' +
        '<input type="text" id="sd-ref-link" value="' + esc(refUrl) + '" readonly>' +
        '<button class="sd-btn sd-btn-primary" style="width:auto;padding:10px 16px" id="sd-copy-ref">Copy</button>' +
      '</div>' +
      '<h3>Daily Bonus Tasks</h3>' +
      '<div class="sd-tasks">' +
        '<div class="sd-task">' +
          '<div class="sd-task-info">' +
            '<span class="sd-task-title">Daily Check-In</span>' +
            '<span class="sd-task-desc">Come back every day to claim</span>' +
          '</div>' +
          (today.checked_in
            ? '<span class="sd-badge-done">Claimed ✓</span>'
            : '<button class="sd-btn sd-btn-success" style="width:auto;padding:8px 16px" id="sd-checkin-btn">+5 Pts</button>') +
        '</div>' +
        '<div class="sd-task">' +
          '<div class="sd-task-info">' +
            '<span class="sd-task-title">Watch Movie Clips</span>' +
            '<span class="sd-task-desc">' + (vidsLeft > 0 ? vidsLeft + ' of ' + cap + ' credits left today' : 'Daily cap reached — come back tomorrow!') + '</span>' +
          '</div>' +
          (vidsLeft > 0
            ? '<a href="' + esc(watchUrl) + '" target="_blank" rel="noopener noreferrer" class="sd-badge" style="text-decoration:none">Watch · +' + nextVidPts + ' Pts</a>'
            : '<span class="sd-badge-done">Done ✓</span>') +
        '</div>' +
      '</div>';

    $('#sd-copy-ref').addEventListener('click', function () {
      copyText(refUrl, this);
    });

    if (!today.checked_in) {
      $('#sd-checkin-btn').addEventListener('click', async function () {
        const btn = this;
        btn.disabled = true;
        btn.textContent = '…';
        const res = await api('/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: state.session })
        });
        if (res && res.ok) {
          btn.outerHTML = '<span class="sd-badge-done">Claimed ✓</span>';
          state.me.points = Number(state.me.points || 0) + Number(res.awarded || 0);
          state.today.checked_in = true;
          const ptsEl = $('#sd-points');
          if (ptsEl) ptsEl.textContent = state.me.points;
        } else {
          btn.disabled = false;
          btn.textContent = '+5 Pts';
          alert((res && res.error) || 'Check-in failed. Please try again.');
        }
      });
    }
  }

  // ------------------------------------------------------------ DATA LOADERS
  async function loadDashboard() {
    state.view = 'loading';
    render();

    const meRes = await api('/me?session=' + encodeURIComponent(state.session));
    if (!meRes || !meRes.ok || !meRes.me) {
      // Dead/expired session -> back to signup
      store.del('sd_session');
      state.session = null;
      state.view = 'signup';
      render();
      return;
    }

    state.me = meRes.me;
    state.today = meRes.today || {};

    // Non-fatal extras: campaign title + video feed
    const extras = await Promise.all([api('/campaign'), api('/videos')]);
    state.campaign = (extras[0] && extras[0].ok) ? extras[0].campaign : null;

    state.view = 'dashboard';
    render();
  }

  // -------------------------------------------------------------------- INIT
  async function init() {
    const params = new URLSearchParams(window.location.search);

    // Persist referral attribution so it survives navigation to rules/privacy pages
    const refParam = params.get('ref');
    if (refParam && /^[a-zA-Z0-9_-]{3,20}$/.test(refParam)) {
      store.set('sd_ref', refParam);
    }

    // Email verification click: ?verify=TOKEN
    const verifyToken = params.get('verify');
    if (verifyToken) {
      state.view = 'loading';
      render();
      const res = await api('/verify?token=' + encodeURIComponent(verifyToken));
      if (res && res.ok && res.session) {
        store.set('sd_session', res.session);
        state.session = res.session;
        state.verifyError = null;
        // Clean URL but keep ?ref= if present
        const keepRef = params.get('ref');
        window.history.replaceState({}, document.title,
          window.location.pathname + (keepRef ? '?ref=' + encodeURIComponent(keepRef) : ''));
      } else {
        state.verifyError = (res && res.error) || 'That confirmation link is invalid or expired.';
        store.del('sd_session');
        state.session = null;
      }
    }

    if (state.session) {
      await loadDashboard();
    } else {
      state.view = 'signup';
      render();
    }
  }

  init();
})();
