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

  window.AppUrls = {
    basePath,
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
