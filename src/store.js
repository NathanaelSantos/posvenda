// Persistência das avaliações no PostgreSQL.
import crypto from 'node:crypto';
import { query } from './db.js';

function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function rowToReview(row) {
  return {
    id: row.id,
    criadoEm: new Date(row.criado_em).toISOString(),
    loja: row.loja || '',
    vendedor: row.vendedor || '',
    satisfacao: row.satisfacao,
    notaVendedor: row.nota_vendedor,
    notaLoja: row.nota_loja,
    nps: row.nps,
    criterios: row.criterios || {},
    feedback: row.feedback || '',
    cliente: {
      nome: row.cliente_nome || '',
      telefone: row.cliente_telefone || '',
    },
  };
}

// opts.criadoEm permite definir a data (usado pelo seed de exemplo).
export async function addReview(payload, opts = {}) {
  const criterios = {};
  if (payload.criterios && typeof payload.criterios === 'object') {
    for (const [k, v] of Object.entries(payload.criterios)) {
      const nota = clampInt(v, 1, 5);
      if (nota) criterios[String(k)] = nota;
    }
  }

  const id = crypto.randomUUID();
  const criadoEm = opts.criadoEm ? new Date(opts.criadoEm) : new Date();
  const loja = String(payload.loja || '').slice(0, 120);
  const vendedor = String(payload.vendedor || '').slice(0, 120);
  const satisfacao = clampInt(payload.satisfacao, 1, 5);
  const notaVendedor = clampInt(payload.notaVendedor, 1, 5);
  const notaLoja = clampInt(payload.notaLoja, 1, 5);
  const nps = clampInt(payload.nps, 0, 10);
  const feedback = String(payload.feedback || '').slice(0, 2000).trim();
  const clienteNome = String(payload.nome || '').slice(0, 120).trim();
  const clienteTelefone = String(payload.telefone || '').slice(0, 40).trim();

  const { rows } = await query(
    `INSERT INTO avaliacoes (
      id, criado_em, loja, vendedor, satisfacao, nota_vendedor, nota_loja,
      nps, criterios, feedback, cliente_nome, cliente_telefone
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)
    RETURNING *`,
    [
      id,
      criadoEm.toISOString(),
      loja,
      vendedor,
      satisfacao,
      notaVendedor,
      notaLoja,
      nps,
      JSON.stringify(criterios),
      feedback,
      clienteNome,
      clienteTelefone,
    ],
  );

  return rowToReview(rows[0]);
}

export async function listReviews() {
  const { rows } = await query(
    `SELECT * FROM avaliacoes ORDER BY criado_em DESC`,
  );
  return rows.map(rowToReview);
}
