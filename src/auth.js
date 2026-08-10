// Autenticação leve por cookie assinado (HMAC).
// Protege o painel de BI e as rotas administrativas.
import crypto from 'node:crypto';
import { loadConfig, getAdminPassword } from './config.js';

const COOKIE = 'pv_sessao';
const MAX_IDADE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

let sessionSecretCache = null;

export async function initAuth() {
  const cfg = await loadConfig();
  sessionSecretCache = process.env.SESSION_SECRET || cfg.sessionSecret;
}

function secret() {
  if (sessionSecretCache) return sessionSecretCache;
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  throw new Error('Auth não inicializado. Chame initAuth() no boot do servidor.');
}

function assinar(payload) {
  const dados = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(dados).digest('base64url');
  return `${dados}.${mac}`;
}

function verificar(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [dados, mac] = token.split('.');
  const esperado = crypto.createHmac('sha256', secret()).update(dados).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'));
    if (!payload.emitidoEm || Date.now() - payload.emitidoEm > MAX_IDADE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions() {
  const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
  return {
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite || process.env.COOKIE_SECURE === 'true',
    maxAge: MAX_IDADE_MS,
    path: '/',
  };
}

export async function senhaConfere(informada) {
  const correta = await getAdminPassword();
  const a = Buffer.from(String(informada || ''));
  const b = Buffer.from(String(correta));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function criarSessao(res) {
  const token = assinar({ emitidoEm: Date.now() });
  res.cookie(COOKIE, token, cookieOptions());
}

export function encerrarSessao(res) {
  res.clearCookie(COOKIE, cookieOptions());
}

export function estaAutenticado(req) {
  return !!verificar(req.cookies?.[COOKIE]);
}

export function exigirAuthApi(req, res, next) {
  if (estaAutenticado(req)) return next();
  return res.status(401).json({ erro: 'Não autorizado' });
}

export function exigirAuthPagina(req, res, next) {
  if (estaAutenticado(req)) return next();
  return res.redirect('/login');
}
