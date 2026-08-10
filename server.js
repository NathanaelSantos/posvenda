// API do pós-venda Cred Móveis — avaliações, QR Code, BI e autenticação.
// Persistência: PostgreSQL (DATABASE_URL). Front estático fica no container nginx.
import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

import { waitForDb, query } from './src/db.js';
import { publicConfig, saveConfig, loadConfig } from './src/config.js';
import { addReview, listReviews } from './src/store.js';
import { agregar } from './src/bi.js';
import {
  initAuth,
  senhaConfere,
  criarSessao,
  encerrarSessao,
  estaAutenticado,
  exigirAuthApi,
  exigirAuthPagina,
} from './src/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
// Em Docker o nginx serve o front; localmente o Express pode servir o HTML.
const SERVE_STATIC = process.env.SERVE_STATIC !== 'false';

const app = express();
app.use(express.json({ limit: '100kb' }));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 404);
  }

  next();
});

// Healthcheck (Docker / orquestradores)
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

// Parser de cookies simples
app.use((req, _res, next) => {
  const header = req.headers.cookie || '';
  req.cookies = Object.fromEntries(
    header
      .split(';')
      .map((c) => {
        const i = c.indexOf('=');
        if (i === -1) return [c.trim(), ''];
        return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
      })
      .filter(([k]) => k),
  );
  next();
});

const COR = { dark: '#4a3b2a', light: '#fbf7ef' };

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/* ======================= API PÚBLICA ======================= */

app.get('/api/config', asyncHandler(async (_req, res) => {
  res.json(await publicConfig());
}));

app.post('/api/avaliacoes', asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.loja) return res.status(400).json({ erro: 'Selecione a loja.' });
  if (!b.satisfacao) return res.status(400).json({ erro: 'Informe sua satisfação.' });
  const review = await addReview(b);
  res.status(201).json({ ok: true, id: review.id });
}));

app.get('/api/qrcode', asyncHandler(async (req, res) => {
  const url = String(req.query.url || `http://localhost:${PORT}/`);
  const formato = req.query.formato === 'svg' ? 'svg' : 'png';
  const opcoes = { margin: 2, color: COR, errorCorrectionLevel: 'M', width: 720 };
  try {
    if (formato === 'svg') {
      const svg = await QRCode.toString(url, { type: 'svg', ...opcoes });
      res.type('image/svg+xml').send(svg);
    } else {
      const buf = await QRCode.toBuffer(url, { type: 'png', ...opcoes });
      res.type('image/png').send(buf);
    }
  } catch {
    res.status(400).json({ erro: 'Não foi possível gerar o QR Code.' });
  }
}));

/* ======================= AUTENTICAÇÃO ======================= */

app.post('/api/login', asyncHandler(async (req, res) => {
  const { senha } = req.body || {};
  if (!(await senhaConfere(senha))) {
    return res.status(401).json({ erro: 'Senha incorreta.' });
  }
  criarSessao(res);
  res.json({ ok: true });
}));

app.post('/api/logout', (_req, res) => {
  encerrarSessao(res);
  res.json({ ok: true });
});

app.get('/api/sessao', (req, res) => {
  res.json({ autenticado: estaAutenticado(req) });
});

/* ======================= API ADMINISTRATIVA ======================= */

app.get('/api/bi', exigirAuthApi, asyncHandler(async (req, res) => {
  res.json(await agregar({
    loja: req.query.loja || '',
    vendedor: req.query.vendedor || '',
    dias: req.query.dias || 0,
  }));
}));

app.get('/api/admin/config', exigirAuthApi, asyncHandler(async (_req, res) => {
  const cfg = await loadConfig();
  res.json({ marca: cfg.marca, lojas: cfg.lojas, vendedores: cfg.vendedores, criterios: cfg.criterios });
}));

app.put('/api/admin/config', exigirAuthApi, asyncHandler(async (req, res) => {
  const cfg = await saveConfig(req.body || {});
  res.json({ marca: cfg.marca, lojas: cfg.lojas, vendedores: cfg.vendedores, criterios: cfg.criterios });
}));

app.get('/api/export.csv', exigirAuthApi, asyncHandler(async (_req, res) => {
  const linhas = await listReviews();
  const cols = ['criadoEm', 'loja', 'vendedor', 'satisfacao', 'notaVendedor', 'notaLoja', 'nps', 'feedback', 'nome', 'telefone'];
  const escapar = (v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = [
    cols.join(','),
    ...linhas.map((r) =>
      [
        r.criadoEm,
        r.loja,
        r.vendedor,
        r.satisfacao,
        r.notaVendedor,
        r.notaLoja,
        r.nps,
        r.feedback,
        r.cliente?.nome,
        r.cliente?.telefone,
      ]
        .map(escapar)
        .join(','),
    ),
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="avaliacoes-cred-moveis.csv"');
  res.send('\uFEFF' + csv);
}));

/* ======================= PÁGINAS (modo monolito / dev local) ======================= */

if (SERVE_STATIC) {
  app.get('/login', (req, res) => {
    if (estaAutenticado(req)) return res.redirect('/loja');
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
  });
  app.get('/obrigado', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'obrigado.html'));
  });
  app.get('/loja', exigirAuthPagina, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'loja.html'));
  });
  app.get('/bi', exigirAuthPagina, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'bi.html'));
  });
  app.get('/qrcode', exigirAuthPagina, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'qrcode.html'));
  });
  app.use(express.static(PUBLIC_DIR));
}

// Erros não tratados das rotas async
app.use((err, _req, res, _next) => {
  console.error('[api]', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

function ipsDaRede() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const nome of Object.keys(nets)) {
    for (const net of nets[nome] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

async function boot() {
  console.log('[boot] conectando ao PostgreSQL…');
  await waitForDb();
  await loadConfig();
  await initAuth();

  app.listen(PORT, '0.0.0.0', async () => {
    const cfg = await loadConfig();
    console.log('\n  ' + cfg.marca.nome + ' ' + cfg.marca.cidade + ' — Pós-venda API');
    console.log('  ────────────────────────────────────────');
    console.log(`  API:                  http://localhost:${PORT}/api/health`);
    if (SERVE_STATIC) {
      console.log(`  Avaliação (cliente):  http://localhost:${PORT}/`);
      console.log(`  Área da Loja:         http://localhost:${PORT}/loja`);
      console.log(`  Painel de BI:         http://localhost:${PORT}/bi`);
      console.log(`  Gerar QR Code:        http://localhost:${PORT}/qrcode`);
    } else {
      console.log('  Front estático:       servido pelo container nginx');
    }
    for (const ip of ipsDaRede()) {
      console.log(`  Na rede:              http://${ip}:${PORT}/`);
    }
    console.log('  ────────────────────────────────────────');
    console.log(`  Banco: ${process.env.DATABASE_URL ? 'DATABASE_URL' : '(não definido)'}`);
    console.log(`  Senha do painel: ${process.env.ADMIN_PASSWORD ? '(definida por ambiente)' : cfg.adminPassword}`);
    console.log('');
  });
}

boot().catch((err) => {
  console.error('[boot] falha ao iniciar:', err);
  process.exit(1);
});
