/* Diagnóstico do envio de e-mails, sem expor segredos.
   GET /api/status → { email: { chave, remetente, dominio }, banco }
   - chave: RESEND_API_KEY está definida neste deploy
   - dominio: status do domínio do remetente no Resend ("verified", "pending", "not_started"...),
     ou "sem_permissao" se a chave for só de envio (nesse caso, ver no painel do Resend). */

import { MAIL_FROM, DB_URL } from './_lib/util.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.RESEND_API_KEY;
  const remetente = (MAIL_FROM.match(/<([^>]+)>/) || [, MAIL_FROM])[1];
  const dominioRemetente = remetente.split('@')[1] || '';
  let dominio = 'desconhecido';
  if (key) {
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000),
      });
      if (r.status === 401 || r.status === 403) {
        // Chave só de envio responde "restricted_api_key"; chave errada responde outro erro.
        const corpo = await r.text();
        dominio = /restricted/i.test(corpo) ? 'sem_permissao (chave de envio valida)' : 'chave_invalida';
      }
      else if (r.ok) {
        const lista = (await r.json()).data || [];
        const d = lista.find(x => x.name === dominioRemetente);
        dominio = d ? d.status : 'nao_cadastrado';
      }
    } catch { dominio = 'erro_consulta'; }
  }
  res.status(200).json({
    email: { chave: !!key, remetente, dominio },
    banco: !!DB_URL,
    variaveisBanco: Object.keys(process.env).filter(k => /DATABASE|POSTGRES|PG|NEON/.test(k)).sort(),
  });
}
