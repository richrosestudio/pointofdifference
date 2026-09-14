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
    if (!gateEl) return;

    gateEl.classList.add('is-leaving');
    const el = gateEl;
    gateEl = null;

    window.setTimeout(() => {
      el.remove();
      if (!gateEl) {
        document.documentElement.classList.remove('pod-locked');
      }
    }, 320);

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
      '  padding: 24px; pointer-events: auto;',
      '  animation: pod-gate-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;',
      '}',
      '.pod-gate.is-leaving {',
      '  animation: pod-gate-out 0.32s cubic-bezier(0.7, 0, 1, 1) forwards;',
      '}',
      '.pod-gate__veil {',
      '  position: absolute; inset: 0;',
      '  background: rgba(255, 255, 255, 0.42);',
      '  backdrop-filter: blur(40px) saturate(120%);',
      '  -webkit-backdrop-filter: blur(40px) saturate(120%);',
      '}',
      '.pod-gate__panel {',
      '  position: relative; z-index: 1;',
      '  width: 100%; max-width: 260px;',
      '  padding: 22px 20px 20px;',
      '  background: rgba(255, 255, 255, 0.92);',
      '  border: 1px solid rgba(17, 17, 17, 0.08);',
      '  border-radius: 10px;',
      '  box-shadow:',
      '    0 1px 0 rgba(255, 255, 255, 0.9) inset,',
      '    0 18px 48px rgba(17, 17, 17, 0.08),',
      '    0 2px 8px rgba(17, 17, 17, 0.04);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 14px; line-height: 1.6; color: #111;',
      '  animation: pod-panel-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;',
      '}',
      '.pod-gate.is-leaving .pod-gate__panel {',
      '  animation: pod-panel-out 0.28s cubic-bezier(0.7, 0, 1, 1) forwards;',
      '}',
      '.pod-gate__panel.is-shake {',
      '  animation: pod-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97);',
      '}',
      '.pod-gate__label {',
      '  display: block; margin-bottom: 10px;',
      '  font-size: 12px; letter-spacing: 0.02em; color: #999;',
      '}',
      '.pod-gate__input {',
      '  width: 100%; padding: 11px 12px;',
      '  border: 1px solid rgba(17, 17, 17, 0.1);',
      '  border-radius: 6px; font: inherit; color: #111;',
      '  background: rgba(255, 255, 255, 0.96);',
      '  transition: border-color 0.2s ease, box-shadow 0.2s ease;',
      '}',
      '.pod-gate__input::placeholder { color: #bbb; }',
      '.pod-gate__input:focus {',
      '  outline: none;',
      '  border-color: rgba(17, 17, 17, 0.22);',
      '  box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.05);',
      '}',
      '.pod-gate__error {',
      '  margin-top: 10px; min-height: 1.4em;',
      '  font-size: 12px; color: transparent;',
      '}',
      '.pod-gate__error.is-visible { color: #999; }',
      '@keyframes pod-gate-in {',
      '  from { opacity: 0; }',
      '  to { opacity: 1; }',
      '}',
      '@keyframes pod-gate-out {',
      '  from { opacity: 1; }',
      '  to { opacity: 0; }',
      '}',
      '@keyframes pod-panel-in {',
      '  from { opacity: 0; transform: translateY(8px) scale(0.985); }',
      '  to { opacity: 1; transform: translateY(0) scale(1); }',
      '}',
      '@keyframes pod-panel-out {',
      '  from { opacity: 1; transform: translateY(0) scale(1); }',
      '  to { opacity: 0; transform: translateY(6px) scale(0.99); }',
      '}',
      '@keyframes pod-shake {',
      '  0%, 100% { transform: translateX(0); }',
      '  20% { transform: translateX(-4px); }',
      '  40% { transform: translateX(4px); }',
      '  60% { transform: translateX(-3px); }',
      '  80% { transform: translateX(3px); }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .pod-gate, .pod-gate__panel { animation: none; }',
      '  .pod-gate.is-leaving, .pod-gate.is-leaving .pod-gate__panel { animation: none; opacity: 0; }',
      '  .pod-gate__panel.is-shake { animation: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function queueGate() {
    if (gateEl || isAuthed()) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(showGate);
    });
  }

  function showGate() {
    if (gateEl || isAuthed()) return;

    ensureGateStyles();
    document.documentElement.classList.add('pod-locked');

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

    const veil = document.createElement('div');
    veil.className = 'pod-gate__veil';
    veil.setAttribute('aria-hidden', 'true');

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
    input.placeholder = 'Enter password';
    input.spellcheck = false;

    const error = document.createElement('p');
    error.className = 'pod-gate__error';
    error.setAttribute('aria-live', 'polite');

    panel.appendChild(label);
    panel.appendChild(input);
    panel.appendChild(error);
    gateEl.appendChild(veil);
    gateEl.appendChild(panel);
    document.body.appendChild(gateEl);

    function shakePanel() {
      panel.classList.remove('is-shake');
      void panel.offsetWidth;
      panel.classList.add('is-shake');
      panel.addEventListener('animationend', () => panel.classList.remove('is-shake'), { once: true });
    }

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
        shakePanel();
      } catch (e) {
        error.textContent = 'Something went wrong. Try again.';
        error.classList.add('is-visible');
        shakePanel();
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

    window.setTimeout(() => input.focus(), 120);
  }

  window.podAuth = {
    reveal() {
      if (isAuthed()) {
        removeGate();
        return true;
      }
      queueGate();
      return true;
    }
  };

  window.addEventListener('pod:unlock', () => {
    window.dispatchEvent(new Event('pageshow'));
  });
})();
