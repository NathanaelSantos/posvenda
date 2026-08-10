// Geração e download do QR Code que leva o cliente à página de avaliação.
(() => {
  const $ = (id) => document.getElementById(id);

  function urlDoQr(formato) {
    const alvo = $('url').value.trim() || AppUrls.siteRoot();
    return AppUrls.api(`/api/qrcode?formato=${formato}&url=${encodeURIComponent(alvo)}`);
  }

  function atualizar() {
    // Cache-buster para o preview refletir o link atual.
    $('qrImg').src = urlDoQr('png') + '&_=' + Date.now();
  }

  async function baixar(formato, extensao, mime) {
    const resp = await fetch(urlDoQr(formato));
    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-cred-moveis.${extensao}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function iniciar() {
    // Preenche o link padrão com o endereço atual (origem do site).
    $('url').value = AppUrls.siteRoot();

    // Personaliza o cartaz com o nome/cidade configurados.
    try {
      const cfg = await AppUrls.fetchApi('/api/config').then((r) => r.json());
      $('cartazNome').textContent = cfg.marca.nome;
      $('cartazCidade').textContent = cfg.marca.cidade;
      document.querySelectorAll('.marca-logo').forEach((el) => {
        el.alt = cfg.marca.nome;
      });
    } catch { /* mantém os valores padrão */ }

    atualizar();
    $('gerar').addEventListener('click', atualizar);
    $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') atualizar(); });
    $('baixarPng').addEventListener('click', () => baixar('png', 'png', 'image/png'));
    $('baixarSvg').addEventListener('click', () => baixar('svg', 'svg', 'image/svg+xml'));
    $('imprimir').addEventListener('click', () => window.print());
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
