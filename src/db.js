// Pool de conexão PostgreSQL compartilhado pela API.
import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const host = process.env.PGHOST;
  if (!connectionString && !host) {
    throw new Error(
      'DATABASE_URL não definida. Ex.: postgres://usuario:senha@localhost:5432/posvenda',
    );
  }

  pool = new Pool({
    ...(connectionString
      ? { connectionString }
      : {
          host,
          port: Number(process.env.PGPORT || 5432),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
        }),
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
  });

  pool.on('error', (err) => {
    console.error('[db] erro inesperado no pool:', err.message);
  });

  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

/** Aguarda o banco aceitar conexões (útil no Docker enquanto o Postgres sobe). */
export async function waitForDb({ retries = 30, delayMs = 1000 } = {}) {
  let lastError;
  for (let i = 1; i <= retries; i++) {
    try {
      await query('SELECT 1');
      return;
    } catch (err) {
      lastError = err;
      console.log(`[db] aguardando PostgreSQL (${i}/${retries})…`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError || new Error('Não foi possível conectar ao PostgreSQL');
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
