const SHEET_NAME = 'Avaliacoes';
const ADMIN_SECRET = 'credmoveis';

const DEFAULT_CONFIG = {
  marca: {
    nome: 'Cred Moveis',
    cidade: 'Itabaiana',
    slogan: 'Moveis que fazem do seu lar um lugar melhor',
  },
  lojas: ['Itabaiana - Centro', 'Itabaiana - Avenida'],
  vendedores: [],
  criterios: [
    { id: 'atendimento', rotulo: 'Atendimento' },
    { id: 'produto', rotulo: 'Qualidade do produto' },
    { id: 'entrega', rotulo: 'Prazo de entrega' },
    { id: 'preco', rotulo: 'Preco e condicoes' },
  ],
};

function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || 'health';

  try {
    if (action === 'health') return output({ ok: true, service: 'posvenda-sheets' }, p.callback);
    if (action === 'publicConfig') return output(publicConfig(), p.callback);
    if (action === 'login') return output(check(p.senha), p.callback);

    requireAdmin(p.token);
    if (action === 'auth') return output({ ok: true }, p.callback);
    if (action === 'config') return output(loadConfig(), p.callback);
    if (action === 'bi') return output(buildBi(p), p.callback);
    if (action === 'export') return exportCsv();

    return output({ ok: false, erro: 'Acao desconhecida.' }, p.callback);
  } catch (err) {
    return output({ ok: false, erro: err.message }, p.callback);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = body.action || 'addReview';

    if (action === 'addReview') {
      appendReview(body);
      return output({ ok: true });
    }

    requireAdmin(body.token);
    if (action === 'saveConfig') {
      saveConfig(body.config || {});
      return output({ ok: true });
    }
    if (action === 'deleteReview') {
      deleteReview(body.id);
      return output({ ok: true });
    }

    return output({ ok: false, erro: 'Acao desconhecida.' });
  } catch (err) {
    return output({ ok: false, erro: err.message });
  }
}

function output(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function check(senha) {
  if (String(senha || '') !== ADMIN_SECRET) throw new Error('Senha incorreta.');
  return { ok: true };
}

function requireAdmin(token) {
  if (String(token || '') !== ADMIN_SECRET) throw new Error('Nao autorizado.');
}

function publicConfig() {
  const cfg = loadConfig();
  return {
    marca: cfg.marca,
    lojas: cfg.lojas,
    vendedores: cfg.vendedores,
    criterios: cfg.criterios,
  };
}

function loadConfig() {
  const raw = PropertiesService.getScriptProperties().getProperty('config');
  if (!raw) return DEFAULT_CONFIG;
  const saved = JSON.parse(raw);
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    marca: { ...DEFAULT_CONFIG.marca, ...(saved.marca || {}) },
    lojas: Array.isArray(saved.lojas) ? saved.lojas : DEFAULT_CONFIG.lojas,
    vendedores: Array.isArray(saved.vendedores) ? saved.vendedores : DEFAULT_CONFIG.vendedores,
    criterios: Array.isArray(saved.criterios) ? saved.criterios : DEFAULT_CONFIG.criterios,
  };
}

function saveConfig(patch) {
  const cfg = loadConfig();
  const next = {
    ...cfg,
    marca: { ...cfg.marca, ...(patch.marca || {}) },
    lojas: Array.isArray(patch.lojas) ? patch.lojas.map(String).filter(Boolean) : cfg.lojas,
    vendedores: Array.isArray(patch.vendedores) ? patch.vendedores.map(String).filter(Boolean) : cfg.vendedores,
    criterios: Array.isArray(patch.criterios) ? patch.criterios : cfg.criterios,
  };
  PropertiesService.getScriptProperties().setProperty('config', JSON.stringify(next));
  return next;
}

function sheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'criadoEm', 'loja', 'vendedor', 'satisfacao', 'notaVendedor', 'notaLoja', 'nps', 'criterios', 'feedback', 'nome', 'telefone']);
  }
  return sh;
}

function appendReview(body) {
  sheet().appendRow([
    body.id || Utilities.getUuid(),
    new Date(),
    body.loja || '',
    body.vendedor || '',
    body.satisfacao || '',
    body.notaVendedor || '',
    body.notaLoja || '',
    body.nps || '',
    JSON.stringify(body.criterios || {}),
    body.feedback || '',
    body.nome || '',
    body.telefone || '',
  ]);
}

function rows() {
  const values = sheet().getDataRange().getValues();
  return values.slice(1).filter((r) => r[0]).map((r) => ({
    id: r[0],
    criadoEm: r[1],
    loja: r[2],
    vendedor: r[3],
    satisfacao: num(r[4]),
    notaVendedor: num(r[5]),
    notaLoja: num(r[6]),
    nps: num(r[7]),
    criterios: parseJson(r[8], {}),
    feedback: r[9],
    nome: r[10],
    telefone: r[11],
  }));
}

function buildBi(p) {
  const cfg = loadConfig();
  const dias = Number(p.dias || 0);
  const limite = dias ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000) : null;
  const filtradas = rows().filter((r) => {
    const data = new Date(r.criadoEm);
    if (p.loja && r.loja !== p.loja) return false;
    if (p.vendedor && r.vendedor !== p.vendedor) return false;
    if (limite && data < limite) return false;
    return true;
  });

  const promotores = filtradas.filter((r) => r.nps >= 9).length;
  const neutros = filtradas.filter((r) => r.nps >= 7 && r.nps <= 8).length;
  const detratores = filtradas.filter((r) => r.nps !== null && r.nps <= 6).length;
  const totalNps = promotores + neutros + detratores;

  return {
    kpis: {
      total: filtradas.length,
      satisfacaoMedia: avg(filtradas.map((r) => r.satisfacao)),
      mediaVendedor: avg(filtradas.map((r) => r.notaVendedor)),
      mediaLoja: avg(filtradas.map((r) => r.notaLoja)),
      promotores,
      neutros,
      detratores,
      totalNps,
      nps: totalNps ? Math.round(((promotores - detratores) / totalNps) * 100) : null,
    },
    serieTemporal: serieTemporal(filtradas),
    distribSatisfacao: [1, 2, 3, 4, 5].map((estrela) => ({
      estrela,
      qtd: filtradas.filter((r) => r.satisfacao === estrela).length,
    })),
    criterios: cfg.criterios.map((c) => ({
      id: c.id,
      rotulo: c.rotulo,
      media: avg(filtradas.map((r) => num(r.criterios && r.criterios[c.id]))),
    })),
    rankingVendedores: ranking(filtradas, 'vendedor', 'notaVendedor').filter((v) => v.nome && v.nome !== 'Nao lembro'),
    rankingLojas: ranking(filtradas, 'loja', 'satisfacao'),
    comentarios: filtradas
      .filter((r) => r.feedback)
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
      .slice(0, 20),
  };
}

function serieTemporal(lista) {
  const map = {};
  lista.forEach((r) => {
    const dia = Utilities.formatDate(new Date(r.criadoEm), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (!map[dia]) map[dia] = [];
    map[dia].push(r.satisfacao);
  });
  return Object.keys(map).sort().map((dia) => ({
    dia,
    qtd: map[dia].filter((n) => n !== null).length,
    media: avg(map[dia]),
  }));
}

function ranking(lista, campoNome, campoNota) {
  const grupos = {};
  lista.forEach((r) => {
    const nome = r[campoNome] || '';
    if (!nome) return;
    if (!grupos[nome]) grupos[nome] = [];
    grupos[nome].push(r[campoNota]);
  });
  return Object.keys(grupos)
    .map((nome) => ({ nome, qtd: grupos[nome].length, [campoNota === 'notaVendedor' ? 'mediaVendedor' : 'satisfacao']: avg(grupos[nome]) }))
    .sort((a, b) => (b.mediaVendedor || b.satisfacao || 0) - (a.mediaVendedor || a.satisfacao || 0));
}

function exportCsv() {
  const values = sheet().getDataRange().getValues();
  const csv = values.map((row) => row.map(csvCell).join(',')).join('\r\n');
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

function deleteReview(id) {
  const sh = sheet();
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Avaliacao nao encontrada.');
}

function avg(values) {
  const nums = values.map(num).filter((n) => n !== null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

function csvCell(value) {
  return '"' + String(value === null || value === undefined ? '' : value).replace(/"/g, '""') + '"';
}
