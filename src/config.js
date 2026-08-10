// Configuração da loja (marca, unidades, vendedores, critérios e segredos) no PostgreSQL.
import crypto from 'node:crypto';
import { query } from './db.js';

const DEFAULTS = {
  marca: {
    nome: 'Cred Móveis',
    cidade: 'Itabaiana',
    slogan: 'Móveis que fazem do seu lar um lugar melhor',
  },
  lojas: ['Itabaiana - Centro', 'Itabaiana - Avenida'],
  vendedores: ['Ana Souza', 'Bruno Lima', 'Carla Menezes', 'Diego Santos'],
  criterios: [
    { id: 'atendimento', rotulo: 'Atendimento' },
    { id: 'produto', rotulo: 'Qualidade do produto' },
    { id: 'entrega', rotulo: 'Prazo de entrega' },
    { id: 'preco', rotulo: 'Preço e condições' },
  ],
  adminPassword: 'credmoveis',
  sessionSecret: null,
};

let cache = null;

function mergeConfig(disco) {
  return {
    ...DEFAULTS,
    ...disco,
    marca: { ...DEFAULTS.marca, ...(disco?.marca || {}) },
    lojas: Array.isArray(disco?.lojas) ? disco.lojas : DEFAULTS.lojas,
    vendedores: Array.isArray(disco?.vendedores) ? disco.vendedores : DEFAULTS.vendedores,
    criterios: Array.isArray(disco?.criterios) ? disco.criterios : DEFAULTS.criterios,
  };
}

async function persist(cfg) {
  await query(
    `INSERT INTO app_config (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [JSON.stringify(cfg)],
  );
}

export async function loadConfig() {
  if (cache) return cache;

  const { rows } = await query(`SELECT data FROM app_config WHERE id = 1`);
  let cfg = mergeConfig(rows[0]?.data || {});

  if (!cfg.sessionSecret) {
    cfg.sessionSecret = crypto.randomBytes(32).toString('hex');
    await persist(cfg);
  } else if (!rows[0]) {
    await persist(cfg);
  }

  cache = cfg;
  return cache;
}

export function invalidateConfigCache() {
  cache = null;
}

export async function saveConfig(patch) {
  const cfg = await loadConfig();
  if (patch.marca) cfg.marca = { ...cfg.marca, ...patch.marca };
  if (Array.isArray(patch.lojas)) cfg.lojas = patch.lojas.map(String).filter(Boolean);
  if (Array.isArray(patch.vendedores)) cfg.vendedores = patch.vendedores.map(String).filter(Boolean);
  if (Array.isArray(patch.criterios)) cfg.criterios = patch.criterios;
  await persist(cfg);
  cache = cfg;
  return cfg;
}

export async function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || (await loadConfig()).adminPassword;
}

export async function publicConfig() {
  const cfg = await loadConfig();
  return {
    marca: cfg.marca,
    lojas: cfg.lojas,
    vendedores: cfg.vendedores,
    criterios: cfg.criterios,
  };
}
