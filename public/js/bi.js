// Painel de BI — busca os dados agregados e desenha KPIs, gráficos e comentários.
(() => {
  const COR = {
    caramelo: '#b0824c', carameloEscuro: '#8a5e33', bege: '#e2cdaf',
    verde: '#6f8f57', terracota: '#b5654f', dourado: '#c9a227',
    neutro: '#b79b6b', marrom: '#43331f', trilho: '#f0e6d5',
  };

  async function api(url, opts) {
    if (AppUrls.hasSheets && !AppUrls.hasApi) {
      const token = AppUrls.adminToken();
      const [path, qs = ''] = String(url).split('?');
      const params = Object.fromEntries(new URLSearchParams(qs));

      if (path === '/api/bi') {
        const data = await AppUrls.sheetsJsonp('bi', { token, ...params });
        return { ok: true, status: 200, json: async () => data };
      }

      if (path === '/api/admin/config' && (!opts || !opts.method || opts.method === 'GET')) {
        const data = await AppUrls.sheetsJsonp('config', { token });
        return { ok: true, status: 200, json: async () => data };
      }

      if (path === '/api/admin/config' && opts?.method === 'PUT') {
        const config = JSON.parse(opts.body || '{}');
        await AppUrls.sheetsPost('saveConfig', { config });
        return { ok: true, status: 200, json: async () => config };
      }
    }

    const r = await AppUrls.fetchApi(url, opts);
    if (r.status === 401) { window.location.href = AppUrls.page('login'); throw new Error('sessao'); }
    return r;
  }

  const $ = (id) => document.getElementById(id);
  const estrelasTxt = (n) => (n ? '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)) : '—');
  const dataBR = (iso) => { const d = new Date(iso); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
  const vazio = (msg) => `<div class="vazio">${msg}</div>`;

  /* ---------------- KPIs ---------------- */
  function renderKpis(k) {
    const npsClasse = k.nps === null ? '' : k.nps >= 50 ? 'destaque' : k.nps < 0 ? 'alerta' : '';
    const cards = [
      { rot: 'Avaliações', valor: k.total, sub: k.total === 1 ? 'resposta' : 'respostas' },
      { rot: 'Satisfação média', valor: k.satisfacaoMedia ?? '—', small: '/5', sub: estrelasTxt(k.satisfacaoMedia), estrela: true },
      { rot: 'NPS', valor: k.nps ?? '—', sub: `${k.totalNps} respostas · ${k.promotores}👍 ${k.detratores}👎`, classe: npsClasse },
      { rot: 'Nota do vendedor', valor: k.mediaVendedor ?? '—', small: '/5', sub: estrelasTxt(k.mediaVendedor), estrela: true },
      { rot: 'Nota da loja', valor: k.mediaLoja ?? '—', small: '/5', sub: estrelasTxt(k.mediaLoja), estrela: true },
    ];
    $('kpis').innerHTML = cards.map((c) => `
      <div class="kpi ${c.classe || ''}">
        <div class="kpi-rot">${c.rot}</div>
        <div class="kpi-valor" ${c.estrela ? 'style="color:var(--caramelo-escuro)"' : ''}>${c.valor}${c.small ? `<small>${c.small}</small>` : ''}</div>
        <div class="kpi-sub">${c.sub}</div>
      </div>`).join('');
  }

  /* ---------------- Barras horizontais ---------------- */
  function barras(cont, itens) {
    if (!itens.length) { cont.innerHTML = vazio('Sem dados no período.'); return; }
    const max = Math.max(...itens.map((i) => i.max || 0), 0.0001);
    cont.innerHTML = itens.map((i) => {
      const pct = Math.max(2, ((i.valor || 0) / max) * 100);
      return `
        <div class="barra-item ${i.forte ? 'forte' : ''}">
          <div class="barra-rot" title="${i.rot}">${i.rot}</div>
          <div class="barra-trilho"><div class="barra-preenchida" style="width:${i.valor ? pct : 0}%"></div></div>
          <div class="barra-valor">${i.texto}</div>
        </div>`;
    }).join('');
  }

  /* ---------------- Gráfico de linha (SVG) ---------------- */
  function graficoLinha(cont, serie) {
    if (!serie.length) { cont.innerHTML = vazio('Ainda sem avaliações no período.'); return; }
    const W = 760, H = 260, pad = { t: 18, r: 18, b: 34, l: 34 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const n = serie.length;
    const x = (i) => (n === 1 ? pad.l + iw / 2 : pad.l + (i / (n - 1)) * iw);
    const y = (v) => pad.t + (1 - (v - 1) / 4) * ih;

    let grid = '';
    for (let v = 1; v <= 5; v++) {
      const yy = y(v);
      grid += `<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="${COR.trilho}" stroke-width="1"/>`;
      grid += `<text x="${pad.l - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="${COR.marrom}" opacity="0.6">${v}</text>`;
    }

    const pts = serie.map((s, i) => [x(i), y(s.media)]);
    const linha = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = `${linha} L ${pts[pts.length - 1][0].toFixed(1)} ${y(1)} L ${pts[0][0].toFixed(1)} ${y(1)} Z`;

    const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#fff" stroke="${COR.caramelo}" stroke-width="2.5"><title>${dataBR(serie[i].dia)} · ${serie[i].media} (${serie[i].qtd})</title></circle>`).join('');

    const passo = Math.ceil(n / 6);
    const labels = serie.map((s, i) => (i % passo === 0 || i === n - 1)
      ? `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="${COR.marrom}" opacity="0.7">${dataBR(s.dia)}</text>` : '').join('');

    cont.innerHTML = `
      <svg class="grafico-linha" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${COR.caramelo}" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="${COR.caramelo}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#gradArea)"/>
        <path d="${linha}" fill="none" stroke="${COR.caramelo}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}${labels}
      </svg>`;
  }

  /* ---------------- Donut NPS (SVG) ---------------- */
  function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arco(cx, cy, r, ini, fim) {
    const [x1, y1] = polar(cx, cy, r, ini);
    const [x2, y2] = polar(cx, cy, r, fim);
    const grande = fim - ini > 180 ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${grande} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  function donut(cont, k) {
    const total = k.promotores + k.neutros + k.detratores;
    if (!total) { cont.innerHTML = vazio('Sem respostas de recomendação.'); return; }
    const cx = 80, cy = 80, r = 62, esp = 20;
    const segs = [
      { val: k.promotores, cor: COR.verde, nome: 'Promotores (9-10)' },
      { val: k.neutros, cor: COR.neutro, nome: 'Neutros (7-8)' },
      { val: k.detratores, cor: COR.terracota, nome: 'Detratores (0-6)' },
    ];
    let ang = 0, paths = '';
    for (const s of segs) {
      if (!s.val) continue;
      const frac = s.val / total;
      if (frac >= 0.999) {
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.cor}" stroke-width="${esp}"/>`;
      } else {
        const fim = ang + frac * 360;
        paths += `<path d="${arco(cx, cy, r, ang + 1, fim - 1)}" fill="none" stroke="${s.cor}" stroke-width="${esp}" stroke-linecap="round"/>`;
        ang = fim;
      }
    }
    const legenda = segs.map((s) => `
      <div><span class="ponto" style="background:${s.cor}"></span>${s.nome} — <strong>${s.val}</strong> (${total ? Math.round(s.val / total * 100) : 0}%)</div>`).join('');

    cont.innerHTML = `
      <div class="donut-wrap">
        <svg viewBox="0 0 160 160" width="160" height="160" role="img">
          ${paths}
          <text x="80" y="76" text-anchor="middle" font-size="30" font-family="Inter, system-ui, sans-serif" font-weight="700" fill="${COR.marrom}">${k.nps ?? '—'}</text>
          <text x="80" y="96" text-anchor="middle" font-size="12" fill="${COR.marrom}" opacity="0.6">NPS</text>
        </svg>
        <div class="donut-legenda">${legenda}</div>
      </div>`;
  }

  /* ---------------- Comentários ---------------- */
  function renderComentarios(lista) {
    const cont = $('comentarios');
    if (!lista.length) { cont.innerHTML = vazio('Nenhum comentário ainda.'); return; }
    cont.innerHTML = lista.map((c) => `
      <div class="coment">
        <div class="coment-topo">
          <span class="coment-estrelas">${estrelasTxt(c.satisfacao)}</span>
          <span class="coment-meta">${dataBR(c.criadoEm)} · ${c.loja || 'Loja'}${c.vendedor ? ' · ' + c.vendedor : ''}</span>
        </div>
        <div class="coment-texto">"${escapar(c.feedback)}"</div>
        ${c.nome ? `<div class="coment-autor">— ${escapar(c.nome)}</div>` : ''}
      </div>`).join('');
  }
  function escapar(s) { return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

  /* ---------------- Carregar dados ---------------- */
  async function carregar() {
    const params = new URLSearchParams({
      loja: $('fLoja').value, vendedor: $('fVendedor').value, dias: $('fPeriodo').value,
    });
    const d = await api('/api/bi?' + params).then((r) => r.json());

    renderKpis(d.kpis);
    graficoLinha($('graficoTempo'), d.serieTemporal);
    donut($('graficoNps'), d.kpis);

    barras($('graficoDistrib'), d.distribSatisfacao.slice().reverse().map((x) => ({
      rot: '★'.repeat(x.estrela), valor: x.qtd, max: Math.max(...d.distribSatisfacao.map((s) => s.qtd)),
      texto: String(x.qtd), forte: x.estrela >= 4,
    })));

    barras($('graficoCriterios'), d.criterios.map((c) => ({
      rot: c.rotulo, valor: c.media || 0, max: 5, texto: c.media ? c.media.toFixed(1) : '—', forte: (c.media || 0) >= 4,
    })));

    barras($('graficoVendedores'), d.rankingVendedores.map((v) => ({
      rot: v.nome, valor: v.mediaVendedor || 0, max: 5,
      texto: `${v.mediaVendedor ? v.mediaVendedor.toFixed(1) : '—'} · ${v.qtd}`, forte: (v.mediaVendedor || 0) >= 4,
    })));

    barras($('graficoLojas'), d.rankingLojas.map((l) => ({
      rot: l.nome, valor: l.satisfacao || 0, max: 5,
      texto: `${l.satisfacao ? l.satisfacao.toFixed(1) : '—'} · ${l.qtd}`, forte: (l.satisfacao || 0) >= 4,
    })));

    renderComentarios(d.comentarios);
    $('atualizadoEm').textContent = new Date().toLocaleString('pt-BR');
  }

  /* ---------------- Configurações ---------------- */
  function linhaEdit(container, valor) {
    const div = document.createElement('div');
    div.className = 'linha';
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = valor || '';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'icone-btn'; btn.textContent = '✕';
    btn.onclick = () => div.remove();
    div.appendChild(inp); div.appendChild(btn);
    container.appendChild(div);
  }
  function lerLista(container) {
    return [...container.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean);
  }

  async function abrirConfig() {
    const cfg = await api('/api/admin/config').then((r) => r.json());
    $('cfgNome').value = cfg.marca.nome || '';
    $('cfgCidade').value = cfg.marca.cidade || '';
    $('cfgSlogan').value = cfg.marca.slogan || '';
    $('listaLojas').innerHTML = '';
    cfg.lojas.forEach((l) => linhaEdit($('listaLojas'), l));
    $('listaVendedores').innerHTML = '';
    cfg.vendedores.forEach((v) => linhaEdit($('listaVendedores'), v));
    $('avisoConfig').className = 'aviso';
    $('modalConfig').style.display = 'block';
  }

  async function salvarConfig() {
    const patch = {
      marca: { nome: $('cfgNome').value.trim(), cidade: $('cfgCidade').value.trim(), slogan: $('cfgSlogan').value.trim() },
      lojas: lerLista($('listaLojas')),
      vendedores: lerLista($('listaVendedores')),
    };
    const btn = $('salvarConfig');
    btn.disabled = true; btn.textContent = 'Salvando…';
    try {
      await api('/api/admin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      $('modalConfig').style.display = 'none';
      await popularFiltros();
      await carregar();
    } catch {
      $('avisoConfig').textContent = 'Erro ao salvar.';
      $('avisoConfig').className = 'aviso erro';
    } finally {
      btn.disabled = false; btn.textContent = 'Salvar alterações';
    }
  }

  async function popularFiltros() {
    const cfg = await api('/api/admin/config').then((r) => r.json());
    $('marcaSub').textContent = `${cfg.marca.nome} · ${cfg.marca.cidade}`;
    const fLoja = $('fLoja'), fVend = $('fVendedor');
    const lojaSel = fLoja.value, vendSel = fVend.value;
    fLoja.innerHTML = '<option value="">Todas as lojas</option>';
    cfg.lojas.forEach((l) => fLoja.add(new Option(l, l)));
    fVend.innerHTML = '<option value="">Todos os vendedores</option>';
    cfg.vendedores.forEach((v) => fVend.add(new Option(v, v)));
    fLoja.value = lojaSel; fVend.value = vendSel;
  }

  /* ---------------- Eventos ---------------- */
  async function iniciar() {
    const exportCsv = $('exportCsv');
    if (exportCsv) {
      exportCsv.href = AppUrls.hasSheets && !AppUrls.hasApi
        ? AppUrls.sheetsUrl('export', { token: AppUrls.adminToken() })
        : AppUrls.api('/api/export.csv');
    }
    ['fLoja', 'fVendedor', 'fPeriodo'].forEach((id) => $(id).addEventListener('change', carregar));
    $('btnSair').addEventListener('click', async () => {
      if (AppUrls.hasSheets && !AppUrls.hasApi) AppUrls.clearAdminToken();
      else await AppUrls.fetchApi('/api/logout', { method: 'POST' });
      window.location.href = AppUrls.page('login');
    });
    $('btnConfig').addEventListener('click', abrirConfig);
    $('fecharConfig').addEventListener('click', () => { $('modalConfig').style.display = 'none'; });
    $('modalConfig').addEventListener('click', (e) => { if (e.target === $('modalConfig')) $('modalConfig').style.display = 'none'; });
    $('addLoja').addEventListener('click', () => linhaEdit($('listaLojas'), ''));
    $('addVendedor').addEventListener('click', () => linhaEdit($('listaVendedores'), ''));
    $('salvarConfig').addEventListener('click', salvarConfig);

    try {
      await popularFiltros();
      await carregar();
    } catch (e) { if (e.message !== 'sessao') console.error(e); }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
