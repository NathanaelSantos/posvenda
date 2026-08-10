// Lógica do formulário de avaliação do cliente.
(() => {
  const LEGENDAS = { 1: 'Péssimo 😞', 2: 'Ruim 😕', 3: 'Regular 😐', 4: 'Bom 🙂', 5: 'Excelente 🤩' };

  // Cria um grupo de estrelas (radios de 5 a 1) dentro do container.
  function montarEstrelas(container, name, { sm = false, aoMudar } = {}) {
    const grupo = document.createElement('div');
    grupo.className = 'estrelas' + (sm ? ' sm' : '');
    for (let v = 5; v >= 1; v--) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = String(v);
      input.id = `${name}-${v}`;
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.setAttribute('title', LEGENDAS[v]);
      label.textContent = '★';
      grupo.appendChild(input);
      grupo.appendChild(label);
      if (aoMudar) input.addEventListener('change', () => aoMudar(v));
    }
    container.appendChild(grupo);
    return grupo;
  }

  // Cria a escala NPS de 0 a 10.
  function montarNps(container) {
    for (let v = 0; v <= 10; v++) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'nps';
      input.value = String(v);
      input.id = `nps-${v}`;
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.textContent = String(v);
      container.appendChild(input);
      container.appendChild(label);
    }
  }

  function opcao(select, texto) {
    const o = document.createElement('option');
    o.value = texto;
    o.textContent = texto;
    select.appendChild(o);
  }

  function valorRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? Number(el.value) : null;
  }

  async function carregarConfig() {
    const cfgLocal = window.POSVENDA_CONFIG?.lojaConfig;
    if (cfgLocal) return cfgLocal;
    return AppUrls.fetchApi('/api/config').then((r) => r.json());
  }

  async function enviarAvaliacao(dados) {
    const sheetsEndpoint = window.POSVENDA_CONFIG?.sheetsEndpoint;
    if (sheetsEndpoint) {
      await fetch(sheetsEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dados),
      });
      return { ok: true };
    }

    const resp = await AppUrls.fetchApi('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.erro || 'Erro ao enviar.');
    return json;
  }

  async function iniciar() {
    // Estrelas fixas
    const legenda = document.getElementById('legendaSatisfacao');
    montarEstrelas(document.getElementById('estrelasSatisfacao'), 'satisfacao', {
      aoMudar: (v) => { legenda.textContent = LEGENDAS[v]; },
    });
    montarEstrelas(document.getElementById('estrelasVendedor'), 'notaVendedor');
    montarEstrelas(document.getElementById('estrelasLoja'), 'notaLoja');
    montarNps(document.getElementById('nps'));

    // Configuração da loja
    try {
      const cfg = await carregarConfig();
      document.getElementById('marcaNome').textContent = cfg.marca.nome;
      document.getElementById('marcaCidade').textContent = cfg.marca.cidade;
      document.getElementById('logo').alt = cfg.marca.nome;
      if (cfg.marca.slogan) document.getElementById('slogan').textContent = cfg.marca.slogan;
      document.title = `Avaliação · ${cfg.marca.nome} ${cfg.marca.cidade}`;

      const selLoja = document.getElementById('loja');
      cfg.lojas.forEach((l) => opcao(selLoja, l));
      if (cfg.lojas.length === 1) { selLoja.value = cfg.lojas[0]; }

      const selVend = document.getElementById('vendedor');
      cfg.vendedores.forEach((v) => opcao(selVend, v));

      const cont = document.getElementById('criterios');
      cfg.criterios.forEach((c) => {
        const linha = document.createElement('div');
        linha.className = 'criterio';
        const rot = document.createElement('span');
        rot.className = 'criterio-rot';
        rot.textContent = c.rotulo;
        const box = document.createElement('div');
        montarEstrelas(box, `crit-${c.id}`, { sm: true });
        linha.appendChild(rot);
        linha.appendChild(box);
        cont.appendChild(linha);
      });
    } catch {
      mostrarAviso('Não foi possível carregar as informações da loja. Recarregue a página.', 'erro');
    }

    document.getElementById('form').addEventListener('submit', enviar);
  }

  function mostrarAviso(msg, tipo) {
    const el = document.getElementById('aviso');
    el.textContent = msg;
    el.className = 'aviso ' + tipo;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function enviar(e) {
    e.preventDefault();
    const loja = document.getElementById('loja').value;
    const satisfacao = valorRadio('satisfacao');

    if (!loja) return mostrarAviso('Por favor, selecione a loja onde você comprou.', 'erro');
    if (!satisfacao) return mostrarAviso('Por favor, dê sua nota de satisfação geral.', 'erro');

    // Coleta os critérios preenchidos
    const criterios = {};
    document.querySelectorAll('input[name^="crit-"]:checked').forEach((el) => {
      const id = el.name.replace('crit-', '');
      criterios[id] = Number(el.value);
    });

    const dados = {
      loja,
      vendedor: document.getElementById('vendedor').value || '',
      satisfacao,
      notaVendedor: valorRadio('notaVendedor'),
      notaLoja: valorRadio('notaLoja'),
      nps: valorRadio('nps'),
      criterios,
      feedback: document.getElementById('feedback').value,
      nome: document.getElementById('nome').value,
      telefone: document.getElementById('telefone').value,
    };

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Enviando…';

    try {
      await enviarAvaliacao(dados);
      window.location.href = AppUrls.page('obrigado');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Enviar avaliação';
      mostrarAviso(err.message || 'Não foi possível enviar. Tente novamente.', 'erro');
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
