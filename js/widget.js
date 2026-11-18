/**
 * StackDeals Embeddable Widget
 * Self-contained: injects scoped CSS, handles Turnstile, session state, and dashboard.
 */
(function () {
  'use strict';

  const CONFIG = {
    apiBase: '/api',
    siteKey: '0x4AAAAAAGFNBQDBZD3YP3JO9cNQfqkC2kc',
    cinematixGoUrl: 'https://watchcinematix.xyz/go',
    homeUrl: 'https://getstackdeals.xyz'
  };

  // 1. Inject Scoped CSS
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
    .sd-widget .sd-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
    .sd-widget .sd-btn-primary{background:#2563eb;color:#fff}
    .sd-widget .sd-btn-primary:hover{background:#1d4ed8}
    .sd-widget .sd-btn-primary:disabled{background:#94a3b8;cursor:not-allowed}
    .sd-widget .sd-btn-success{background:#10b981;color:#fff}
    .sd-widget .sd-btn-success:hover{background:#059669}
    .sd-widget .sd-btn-ghost{background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0}
    .sd-widget .sd-msg{padding:12px;border-radius:8px;font-size:14px;margin-bottom:16px;text-align:center}
    .sd-widget .sd-msg-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
    .sd-widget .sd-msg-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
    .sd-widget .sd-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
    .sd-widget .sd-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center}
    .sd-widget .sd-stat-val{font-size:24px;font-weight:800;color:#2563eb}
    .sd-widget .sd-stat-lbl{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .sd-widget .sd-ref{display:flex;gap:8px;margin-bottom:20px}
    .sd-widget .sd-ref input{flex:1;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;color:#475569;font-family:monospace}
    .sd-widget .sd-tasks{display:flex;flex-direction:column;gap:10px}
    .sd-widget .sd-task{display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px}
    .sd-widget .sd-task-info{display:flex;flex-direction:column}
    .sd-widget .sd-task-title{font-size:15px;font-weight:700;color:#0f172a}
    .sd-widget .sd-task-desc{font-size:13px;color:#64748b}
    .sd-widget .sd-badge{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap}
    .sd-widget .sd-badge-done{background:#dcfce7;color:#166534}
    .sd-widget .sd-hidden{display:none}
    .sd-widget .sd-spinner{width:20px;height:20px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:sd-spin 1s linear infinite;margin:0 auto}
    @keyframes sd-spin{to{transform:rotate(360deg)}}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = WIDGET_CSS;
  document.head.appendChild(styleEl);

  // 2. Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
  const api = async (path, opts = {}) => {
    const res = await fetch(CONFIG.apiBase + path, opts);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  };

  // 3. State & DOM
  const root = $('#stackdeals-widget');
  if (!root) return;
  root.className = 'sd-widget';

  let state = {
    session: null,
    view: 'loading', // loading, signup, pending, dashboard
    me: null,
    campaign: null,
    videos: []
  };

  try {
    state.session = localStorage.getItem('sd_session');
  } catch (e) { /* Storage blocked */ }

  function render() {
    root.innerHTML = '';
    if (state.view === 'loading') return root.innerHTML = '<div class="sd-spinner"></div>';
    if (state.view === 'signup') return renderSignup();
    if (state.view === 'pending') return renderPending();
    if (state.view === 'dashboard') return renderDashboard();
  }

  // 4. Views
  function renderSignup() {
    const params = new URLSearchParams(window.location.search);
    // Read from URL first, then fallback to persisted localStorage
    const refCode = params.get('ref') || localStorage.getItem('sd_ref') || '';
    
    root.innerHTML = `
      <h2>Enter the Giveaway</h2>
      <p>Join thousands earning points. <strong>100% Free to enter.</strong></p>
      <div id="sd-msg"></div>
      <form id="sd-form">
        <label for="sd-email">Email Address</label>
        <input type="email" id="sd-email" required placeholder="you@example.com">
        <label class="sd-check">
          <input type="checkbox" id="sd-consent" required>
          <span>I agree to the <a href="/contest-rules.html" target="_blank" style="color:#2563eb">Official Rules</a> and <a href="/privacy.html" target="_blank" style="color:#2563eb">Privacy Policy</a>. I am 18+ and a resident of US/UK/CA.</span>
        </label>
        <div id="sd-turnstile" style="margin:16px 0;min-height:65px"></div>
        <button type="submit" id="sd-submit" class="sd-btn sd-btn-primary" disabled>Verifying...</button>
      </form>
      <p class="sd-muted" style="text-align:center;margin-top:16px">No purchase necessary. Void where prohibited.</p>
    `;

    // Load Turnstile
    const loadTurnstile = () => {
      if (window.turnstile) {
        window.turnstile.render('#sd-turnstile', {
          sitekey: CONFIG.siteKey,
          callback: () => { 
            const btn = $('#sd-submit');
            if(btn) {
              btn.disabled = false; 
              btn.textContent = 'Get My Bonus Entries'; 
            }
          }
        });
      }
    };
    
    if (window.turnstile) {
      loadTurnstile();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = loadTurnstile;
      document.head.appendChild(s);
    }

    $('#sd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#sd-submit');
      const msg = $('#sd-msg');
      if(!btn || !msg) return;

      btn.disabled = true; 
      btn.innerHTML = '<div class="sd-spinner" style="border-top-color:#fff"></div>';
      
      let turnstileResponse = '';
      if (window.turnstile) {
        turnstileResponse = window.turnstile.getResponse();
      }

      const payload = {
        email: $('#sd-email').value,
        consent: $('#sd-consent').checked,
        ref: refCode,
        'cf-turnstile-response': turnstileResponse
      };

      try {
        const res = await api('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (res.already && res.session) {
            try { localStorage.setItem('sd_session', res.session); } catch(e){}
            state.session = res.session;
            await loadDashboard();
          } else {
            state.view = 'pending';
            render();
          }
        } else {
          msg.className = 'sd-msg sd-msg-err';
          msg.textContent = res.error || 'Signup failed. Please try again.';
          btn.disabled = false; 
          btn.textContent = 'Get My Bonus Entries';
          if (window.turnstile) window.turnstile.reset();
        }
      } catch (err) {
        msg.className = 'sd-msg sd-msg-err';
        msg.textContent = 'Network error. Check your connection.';
        btn.disabled = false; 
        btn.textContent = 'Get My Bonus Entries';
      }
    });
  }

  function renderPending() {
    root.innerHTML = `
      <h2>Check Your Inbox 📬</h2>
      <div class="sd-msg sd-msg-ok">We sent a confirmation link to your email.</div>
      <p>Click the link in the email to verify your address and lock in your <strong>+1 Bonus Entry</strong>. Your referral link will unlock immediately after.</p>
      <p class="sd-muted">If you don't see it, check your spam or promotions folder. The link expires in 72 hours.</p>
      <button class="sd-btn sd-btn-ghost" onclick="location.reload()">I clicked it, refresh page</button>
    `;
  }

  function renderDashboard() {
    const me = state.me;
    const today = state.today;
    const camp = state.campaign;
    
    const nextVidPts = today.next_video_pts || 10;
    const vidsLeft = (today.daily_video_cap || 12) - (today.videos_watched || 0);
    const watchUrl = `${CONFIG.cinematixGoUrl}?e=${me.id}`;
    const refUrl = `${CONFIG.homeUrl}/?ref=${me.referral_code}`;

    root.innerHTML = `
      <h2>🎉 You're Entered!</h2>
      <p class="sd-muted">${camp ? esc(camp.title) : 'Active Giveaway'}</p>
      
      <div class="sd-stats">
        <div class="sd-stat"><div class="sd-stat-val">${me.points}</div><div class="sd-stat-lbl">Total Entries</div></div>
        <div class="sd-stat"><div class="sd-stat-val">#${me.rank}</div><div class="sd-stat-lbl">Current Rank</div></div>
      </div>

      <h3>Your Referral Link (+5 pts each)</h3>
      <div class="sd-ref">
        <input type="text" id="sd-ref-link" value="${esc(refUrl)}" readonly>
        <button class="sd-btn sd-btn-primary" style="width:auto;padding:10px 16px" id="sd-copy-ref">Copy</button>
      </div>

      <h3>Daily Bonus Tasks</h3>
      <div class="sd-tasks">
        <div class="sd-task">
          <div class="sd-task-info">
            <span class="sd-task-title">Daily Check-In</span>
            <span class="sd-task-desc">Come back every day to claim</span>
          </div>
          <button class="sd-btn ${today.checked_in ? 'sd-btn-ghost' : 'sd-btn-success'}" style="width:auto;padding:8px 16px" id="sd-checkin-btn" ${today.checked_in ? 'disabled' : ''}>
            ${today.checked_in ? 'Claimed' : '+5 Pts'}
          </button>
        </div>
        
        <div class="sd-task">
          <div class="sd-task-info">
            <span class="sd-task-title">Watch Movie Clips</span>
            <span class="sd-task-desc">${vidsLeft > 0 ? vidsLeft + ' videos left today at multiplier' : 'Daily cap reached!'}</span>
          </div>
          <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" class="sd-badge" style="text-decoration:none">+${nextVidPts} Pts</a>
        </div>
      </div>
    `;

    $('#sd-copy-ref').addEventListener('click', () => {
      navigator.clipboard.writeText(refUrl);
      $('#sd-copy-ref').textContent = 'Copied!';
      setTimeout(() => { $('#sd-copy-ref').textContent = 'Copy'; }, 2000);
    });

    if (!today.checked_in) {
      $('#sd-checkin-btn').addEventListener('click', async () => {
        const btn = $('#sd-checkin-btn');
        btn.disabled = true; btn.textContent = '...';
        try {
          const res = await api('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: state.session })
          });
          if (res.ok) {
            btn.className = 'sd-btn sd-btn-ghost';
            btn.textContent = 'Claimed';
            state.me.points += res.awarded;
            const statVal = $('.sd-stat-val');
            if(statVal) statVal.textContent = state.me.points; 
          } else {
            btn.disabled = false; btn.textContent = '+5 Pts';
            alert(res.error || 'Check-in failed');
          }
        } catch (e) {
          btn.disabled = false; btn.textContent = '+5 Pts';
          alert('Network error. Please try again.');
        }
      });
    }
  }

  // 5. Data Loaders
  async function loadDashboard() {
    state.view = 'loading'; render();
    try {
      const [meRes, campRes, vidsRes] = await Promise.all([
        api(`/me?session=${encodeURIComponent(state.session)}`),
        api('/campaign'),
        api('/videos')
      ]);

      if (!meRes.ok) {
        try { localStorage.removeItem('sd_session'); } catch(e){}
        state.session = null;
        state.view = 'signup';
        return render();
      }

      state.me = meRes.me;
      state.today = meRes.today;
      state.campaign = campRes.campaign;
      state.videos = vidsRes.videos || [];
      state.view = 'dashboard';
      render();
    } catch (e) {
      state.view = 'signup';
      render();
    }
  }

  // 6. Init & URL Listener (catches ?verify= from email clicks)
  async function init() {
    const params = new URLSearchParams(window.location.search);
    
    // Persist referral parameter to localStorage for attribution persistence
    try {
      const refParam = params.get('ref');
      if (refParam && /^[a-zA-Z0-9_-]{3,20}$/.test(refParam)) {
        localStorage.setItem('sd_ref', refParam);
      }
    } catch (e) { /* localStorage blocked by strict privacy settings */ }

    const verifyToken = params.get('verify');
    
    if (verifyToken) {
      state.view = 'loading'; render();
      try {
        const res = await api(`/verify?token=${encodeURIComponent(verifyToken)}`);
        if (res.ok && res.session) {
          try { localStorage.setItem('sd_session', res.session); } catch(e){}
          state.session = res.session;
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
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