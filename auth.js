(function () {
  const STORAGE_KEY = 'pod-auth-v1';
  const PASS_HASH = '87d2aa8e8e1dce3fd0d9ec06228852d757219ab959717b9cb28bc9edabb2143d';

  let gateEl = null;

  function isAuthed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === PASS_HASH;
    } catch (e) {
      return false;
    }
  }

  function setAuthed() {
    try {
      sessionStorage.setItem(STORAGE_KEY, PASS_HASH);
    } catch (e) {}
  }

  async function hashInput(value) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }

  function removeGate() {
    if (gateEl) {
      gateEl.remove();
      gateEl = null;
    }
    document.documentElement.classList.remove('pod-locked');
    const robots = document.querySelector('meta[name="robots"][data-pod-auth]');
    if (robots) robots.remove();
  }

  function ensureGateStyles() {
    if (document.getElementById('pod-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'pod-auth-styles';
    style.textContent = [
      'html.pod-locked { overflow: hidden; }',
      '.pod-gate {',
      '  position: fixed; inset: 0; z-index: 10000;',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 24px; background: #fff;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 14px; line-height: 1.6; color: #111;',
      '}',
      '.pod-gate__panel { width: 100%; max-width: 320px; }',
      '.pod-gate__label { display: block; margin-bottom: 8px; color: #999; }',
      '.pod-gate__input {',
      '  width: 100%; padding: 10px 12px; border: 1px solid #eee;',
      '  border-radius: 4px; font: inherit; color: #111; background: #fff;',
      '}',
      '.pod-gate__input:focus { outline: none; border-color: #ccc; }',
      '.pod-gate__error { margin-top: 10px; color: #999; min-height: 1.6em; }',
      '.pod-gate__error.is-visible { color: #111; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function showGate() {
    if (gateEl || isAuthed()) return;

    ensureGateStyles();
    document.documentElement.classList.add('pod-locked');
    document.body.style.opacity = '0';

    if (!document.querySelector('meta[name="robots"][data-pod-auth]')) {
      const robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex, nofollow';
      robots.setAttribute('data-pod-auth', '');
      document.head.appendChild(robots);
    }

    gateEl = document.createElement('div');
    gateEl.className = 'pod-gate';
    gateEl.setAttribute('role', 'dialog');
    gateEl.setAttribute('aria-modal', 'true');
    gateEl.setAttribute('aria-label', 'Password required');

    const panel = document.createElement('div');
    panel.className = 'pod-gate__panel';

    const label = document.createElement('label');
    label.className = 'pod-gate__label';
    label.textContent = 'Password';
    label.setAttribute('for', 'pod-gate-input');

    const input = document.createElement('input');
    input.id = 'pod-gate-input';
    input.className = 'pod-gate__input';
    input.type = 'password';
    input.autocomplete = 'current-password';
    input.inputMode = 'numeric';

    const error = document.createElement('p');
    error.className = 'pod-gate__error';
    error.setAttribute('aria-live', 'polite');

    panel.appendChild(label);
    panel.appendChild(input);
    panel.appendChild(error);
    gateEl.appendChild(panel);
    document.body.appendChild(gateEl);

    async function submit() {
      error.textContent = '';
      error.classList.remove('is-visible');
      input.disabled = true;

      try {
        const digest = await hashInput(input.value.trim());
        if (digest === PASS_HASH) {
          setAuthed();
          removeGate();
          window.dispatchEvent(new Event('pod:unlock'));
          return;
        }
        error.textContent = 'Incorrect password';
        error.classList.add('is-visible');
      } catch (e) {
        error.textContent = 'Something went wrong. Try again.';
        error.classList.add('is-visible');
      }

      input.disabled = false;
      input.value = '';
      input.focus();
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });

    input.focus();
  }

  window.podAuth = {
    reveal() {
      if (isAuthed()) {
        removeGate();
        return true;
      }
      showGate();
      return false;
    }
  };

  window.addEventListener('pod:unlock', () => {
    document.body.style.transition = 'none';
    document.body.style.opacity = '1';
    window.dispatchEvent(new Event('pageshow'));
  });
})();
