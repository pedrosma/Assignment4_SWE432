(() => {
  const THEME_KEY = 'campus-radio-theme';

  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') {
      applyTheme('light');
      return 'light';
    }
    return 'dark';
  }

  function toggleTheme() {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  function initRelativeTime() {
    const el = document.getElementById('relTime');
    if (!el) return;
    const ts = Number(el.dataset.ts || 0);
    if (!ts) {
      el.textContent = 'No recent activity yet.';
      return;
    }
    const rtf = new Intl.RelativeTimeFormat(navigator.language || 'en', { numeric: 'auto' });
    const refresh = () => {
      const diff = Date.now() - ts;
      const sec = Math.round(diff / 1000);
      const min = Math.round(sec / 60);
      const hr = Math.round(min / 60);
      const day = Math.round(hr / 24);
      const mo = Math.round(day / 30);
      const yr = Math.round(mo / 12);
      if (sec < 60) el.textContent = rtf.format(-sec, 'second');
      else if (min < 60) el.textContent = rtf.format(-min, 'minute');
      else if (hr < 24) el.textContent = rtf.format(-hr, 'hour');
      else if (day < 30) el.textContent = rtf.format(-day, 'day');
      else if (mo < 12) el.textContent = rtf.format(-mo, 'month');
      else el.textContent = rtf.format(-yr, 'year');
    };
    refresh();
    setInterval(refresh, 60000);
  }

  window.CampusRadio = {
    toggleTheme,
    initRelativeTime
  };

  loadTheme();
  document.addEventListener('DOMContentLoaded', initRelativeTime);
})();
