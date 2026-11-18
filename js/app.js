(function() {
  // 1. Countdown Timer
  async function initCountdown() {
    try {
      const res = await fetch('/api/campaign');
      const data = await res.json();
      if (!data.ok || !data.campaign) return;
      
      const endsAt = data.campaign.ends_at * 1000;
      const cdD = document.getElementById('cd-d');
      const cdH = document.getElementById('cd-h');
      const cdM = document.getElementById('cd-m');
      const cdS = document.getElementById('cd-s');

      function tick() {
        const now = Date.now();
        const diff = Math.max(0, endsAt - now);
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if(cdD) cdD.textContent = String(d).padStart(2, '0');
        if(cdH) cdH.textContent = String(h).padStart(2, '0');
        if(cdM) cdM.textContent = String(m).padStart(2, '0');
        if(cdS) cdS.textContent = String(s).padStart(2, '0');
      }
      tick();
      setInterval(tick, 1000);
    } catch (e) { console.warn('Countdown failed', e); }
  }

  // 2. FAQ Accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  initCountdown();
})();