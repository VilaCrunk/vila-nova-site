/* Utilitários compartilhados das funções serverless (Vercel, runtime Node).
   Variáveis de ambiente:
   - DATABASE_URL    → criada pela integração Neon na Vercel (Storage → Neon)
   - RESEND_API_KEY  → chave da API do Resend (cadastrada só na Vercel, nunca no código)
   - CONTACT_TO      → caixa que recebe os contatos (padrão: contato@vilanovaconsultoria.com)
   - MAIL_FROM       → remetente verificado no Resend (padrão: VN Consultoria <site@vilanovaconsultoria.com>) */

import { neon } from '@neondatabase/serverless';

export const CONTACT_TO = process.env.CONTACT_TO || 'contato@vilanovaconsultoria.com';
export const MAIL_FROM = process.env.MAIL_FROM || 'VN Consultoria <site@vilanovaconsultoria.com>';

const sqlClient = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
export const db = () => sqlClient;

let schemaPronto = null;
/** Cria as tabelas na primeira chamada (idempotente). Sem migração manual. */
export function garantirSchema() {
  const sql = db();
  if (!sql) return Promise.resolve(false);
  if (!schemaPronto) {
    schemaPronto = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS contatos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        criado_em timestamptz NOT NULL DEFAULT now(),
        nome text NOT NULL, email text NOT NULL, telefone text, mensagem text NOT NULL,
        consentimento_resposta boolean NOT NULL, marketing boolean NOT NULL DEFAULT false,
        avaliacao_id uuid, enviado_email boolean NOT NULL DEFAULT false)`;
      await sql`CREATE TABLE IF NOT EXISTS avaliacoes (
        id uuid PRIMARY KEY,
        criado_em timestamptz NOT NULL DEFAULT now(),
        versao text NOT NULL, sessao uuid, papel text NOT NULL, unidade text NOT NULL, fase text,
        respostas jsonb NOT NULL, tipo text NOT NULL, destaques text[] NOT NULL DEFAULT '{}', origem jsonb)`;
      await sql`CREATE TABLE IF NOT EXISTS avaliacao_eventos (
        id bigserial PRIMARY KEY, criado_em timestamptz NOT NULL DEFAULT now(),
        sessao uuid NOT NULL, etapa text NOT NULL, versao text)`;
      await sql`CREATE TABLE IF NOT EXISTS avaliacao_relacionamento (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), criado_em timestamptz NOT NULL DEFAULT now(),
        avaliacao_id uuid, nome text, email text NOT NULL, marketing boolean NOT NULL)`;
      return true;
    })().catch((e) => { schemaPronto = null; throw e; });
  }
  return schemaPronto;
}

/** Aceita apenas POST JSON vindo do próprio site. */
export function validarRequisicao(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, erro: 'metodo' });
    return false;
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) { res.status(403).json({ ok: false, erro: 'origem' }); return false; }
    } catch { res.status(403).json({ ok: false, erro: 'origem' }); return false; }
  }
  if (!req.body || typeof req.body !== 'object') {
    // sendBeacon envia Blob JSON; a Vercel já faz o parse quando o content-type é JSON.
    try { req.body = JSON.parse(req.body || '{}'); } catch { res.status(400).json({ ok: false, erro: 'json' }); return false; }
  }
  return true;
}

/** Limite simples por IP (melhor esforço, por instância). */
const janelas = new Map();
export function limitar(req, chave, max, janelaMs) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  const k = chave + ':' + ip;
  const agora = Date.now();
  const lista = (janelas.get(k) || []).filter(t => agora - t < janelaMs);
  lista.push(agora);
  janelas.set(k, lista);
  if (janelas.size > 5000) janelas.clear();
  return lista.length <= max;
}

export const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const emailValido = (v) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);
export const uuidValido = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Envio de e-mail pela API REST do Resend (sem dependência extra). */
export async function enviarEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY ausente');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html, text, reply_to: replyTo || undefined }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}
