// Centraliza URLs para funcionar localmente e no GitHub Pages em subpasta.
(() => {
  const cfg = window.POSVENDA_CONFIG || {};

  function normalizarBasePath(valor) {
    if (!valor || valor === '/') return '';
    return '/' + String(valor).replace(/^\/+|\/+$/g, '');
  }

  function inferirBasePath() {
    if (Object.prototype.hasOwnProperty.call(cfg, 'basePath')) {
      return normalizarBasePath(cfg.basePath);
    }

    if (window.location.hostname.endsWith('github.io')) {
      const primeiroSegmento = window.location.pathname.split('/').filter(Boolean)[0];
      return primeiroSegmento ? `/${primeiroSegmento}` : '';
    }

    return '';
  }

  const basePath = inferirBasePath();
  const apiBaseUrl = String(cfg.apiBaseUrl || '').replace(/\/+$/g, '');
  const sheetsEndpoint = String(cfg.sheetsEndpoint || '').trim();

  function adminToken() {
    return sessionStorage.getItem('posvenda_admin_token') || '';
  }

  function sheetsUrl(action, params = {}) {
    const url = new URL(sheetsEndpoint);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
    return url.toString();
  }

  window.AppUrls = {
    basePath,
    hasApi: !!apiBaseUrl,
    hasSheets: !!sheetsEndpoint,
    adminToken,
    setAdminToken(token) {
      sessionStorage.setItem('posvenda_admin_token', token || '');
    },
    clearAdminToken() {
      sessionStorage.removeItem('posvenda_admin_token');
    },
    api(path) {
      const p = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
      return `${apiBaseUrl}${p}`;
    },
    fetchApi(path, options = {}) {
      return fetch(this.api(path), {
        credentials: apiBaseUrl ? 'include' : 'same-origin',
        ...options,
      });
    },
    sheetsUrl,
    sheetsJsonp(action, params = {}) {
      if (!sheetsEndpoint) return Promise.reject(new Error('Google Sheets nao configurado.'));
      return new Promise((resolve, reject) => {
        const callback = `posvenda_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error('Tempo esgotado ao consultar Google Sheets.'));
        }, 15000);

        function cleanup() {
          clearTimeout(timer);
          delete window[callback];
          script.remove();
        }

        window[callback] = (data) => {
          cleanup();
          if (data && data.ok === false) reject(new Error(data.erro || 'Erro no Google Sheets.'));
          else resolve(data);
        };

        script.onerror = () => {
          cleanup();
          reject(new Error('Nao foi possivel acessar o Google Sheets.'));
        };
        script.src = sheetsUrl(action, { ...params, callback });
        document.head.appendChild(script);
      });
    },
    sheetsPost(action, data = {}) {
      if (!sheetsEndpoint) return Promise.reject(new Error('Google Sheets nao configurado.'));
      return fetch(sheetsEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, token: adminToken(), ...data }),
      });
    },
    page(nome) {
      const paginas = {
        home: 'index.html',
        index: 'index.html',
        login: 'login.html',
        loja: 'loja.html',
        bi: 'bi.html',
        qrcode: 'qrcode.html',
        obrigado: 'obrigado.html',
      };
      const arquivo = paginas[nome] || String(nome || 'index.html').replace(/^\/+/, '');
      return `${basePath}/${arquivo}`;
    },
    siteRoot() {
      return `${window.location.origin}${basePath}/`;
    },
  };
})();
