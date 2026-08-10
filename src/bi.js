// Agregações para o painel de BI a partir das avaliações no PostgreSQL.
import { listReviews } from './store.js';
import { loadConfig } from './config.js';

function media(nums) {
  const validos = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!validos.length) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

function dentroDoPeriodo(iso, dias) {
  if (!dias) return true;
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= limite;
}

export async function agregar(filtros = {}) {
  const cfg = await loadConfig();
  const dias = filtros.dias ? Number(filtros.dias) : 0;

  const todas = await listReviews();
  const avaliacoes = todas.filter((r) => {
    if (filtros.loja && r.loja !== filtros.loja) return false;
    if (filtros.vendedor && r.vendedor !== filtros.vendedor) return false;
    if (!dentroDoPeriodo(r.criadoEm, dias)) return false;
    return true;
  });

  const total = avaliacoes.length;

  const comNps = avaliacoes.filter((r) => typeof r.nps === 'number');
  const promotores = comNps.filter((r) => r.nps >= 9).length;
  const neutros = comNps.filter((r) => r.nps >= 7 && r.nps <= 8).length;
  const detratores = comNps.filter((r) => r.nps <= 6).length;
  const nps = comNps.length
    ? Math.round(((promotores - detratores) / comNps.length) * 100)
    : null;

  const distribSatisfacao = [1, 2, 3, 4, 5].map((estrela) => ({
    estrela,
    qtd: avaliacoes.filter((r) => r.satisfacao === estrela).length,
  }));

  const porVendedor = {};
  for (const r of avaliacoes) {
    if (!r.vendedor) continue;
    (porVendedor[r.vendedor] ||= []).push(r);
  }
  const rankingVendedores = Object.entries(porVendedor)
    .map(([nome, lista]) => ({
      nome,
      qtd: lista.length,
      mediaVendedor: round1(media(lista.map((r) => r.notaVendedor))),
      satisfacao: round1(media(lista.map((r) => r.satisfacao))),
    }))
    .sort((a, b) => (b.mediaVendedor ?? 0) - (a.mediaVendedor ?? 0) || b.qtd - a.qtd);

  const porLoja = {};
  for (const r of avaliacoes) {
    if (!r.loja) continue;
    (porLoja[r.loja] ||= []).push(r);
  }
  const rankingLojas = Object.entries(porLoja)
    .map(([nome, lista]) => ({
      nome,
      qtd: lista.length,
      mediaLoja: round1(media(lista.map((r) => r.notaLoja))),
      satisfacao: round1(media(lista.map((r) => r.satisfacao))),
    }))
    .sort((a, b) => (b.satisfacao ?? 0) - (a.satisfacao ?? 0));

  const criterios = cfg.criterios.map((c) => ({
    id: c.id,
    rotulo: c.rotulo,
    media: round1(
      media(
        avaliacoes
          .map((r) => r.criterios?.[c.id])
          .filter((n) => typeof n === 'number'),
      ),
    ),
  }));

  const porDia = {};
  for (const r of avaliacoes) {
    const dia = r.criadoEm.slice(0, 10);
    (porDia[dia] ||= []).push(r.satisfacao);
  }
  const serieTemporal = Object.entries(porDia)
    .map(([dia, notas]) => ({ dia, media: round1(media(notas)), qtd: notas.length }))
    .sort((a, b) => (a.dia < b.dia ? -1 : 1))
    .slice(-30);

  const comentarios = avaliacoes
    .filter((r) => r.feedback)
    .slice(0, 40)
    .map((r) => ({
      id: r.id,
      criadoEm: r.criadoEm,
      loja: r.loja,
      vendedor: r.vendedor,
      satisfacao: r.satisfacao,
      feedback: r.feedback,
      nome: r.cliente?.nome || '',
    }));

  return {
    kpis: {
      total,
      satisfacaoMedia: round1(media(avaliacoes.map((r) => r.satisfacao))),
      mediaVendedor: round1(media(avaliacoes.map((r) => r.notaVendedor))),
      mediaLoja: round1(media(avaliacoes.map((r) => r.notaLoja))),
      nps,
      promotores,
      neutros,
      detratores,
      totalNps: comNps.length,
    },
    distribSatisfacao,
    rankingVendedores,
    rankingLojas,
    criterios,
    serieTemporal,
    comentarios,
  };
}

function round1(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}
