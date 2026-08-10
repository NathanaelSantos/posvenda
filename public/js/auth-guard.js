// Protege páginas administrativas quando o HTML é servido pelo nginx (front).
// Se a sessão não existir, redireciona para o login.
(async () => {
  try {
    if (AppUrls.hasSheets && !AppUrls.hasApi) {
      const token = AppUrls.adminToken();
      if (!token) throw new Error('sessao');
      await AppUrls.sheetsJsonp('auth', { token });
      return;
    }

    const r = await AppUrls.fetchApi('/api/sessao');
    const data = await r.json();
    if (!data.autenticado) {
      window.location.replace(AppUrls.page('login'));
    }
  } catch {
    window.location.replace(AppUrls.page('login'));
  }
})();
