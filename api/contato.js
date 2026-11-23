/* POST /api/contato — formulário de contato do site.
   Envia a mensagem para a caixa da VN (Resend) e guarda uma cópia no banco (Neon),
   com o registro separado do consentimento de resposta e do opt-in de marketing. */

import { validarRequisicao, limitar, texto, emailValido, uuidValido, esc, enviarEmail, garantirSchema, db, CONTACT_TO } from './_lib/util.js';

export default async function handler(req, res) {
  if (!validarRequisicao(req, res)) return;
  if (!limitar(req, 'contato', 5, 10 * 60 * 1000)) return res.status(429).json({ ok: false, erro: 'limite' });

  const b = req.body;
  // Anti-spam silencioso: campo-isca preenchido ou envio rápido demais → finge sucesso.
  if (b.website || (typeof b.elapsed === 'number' && b.elapsed < 2500)) { console.warn('contato: descartado como spam', b.website ? 'honeypot' : 'rapido'); return res.status(200).json({ ok: true }); }

  const nome = texto(b.name, 120);
  const email = texto(b.email, 160);
  const telefone = texto(b.phone, 40);
  const mensagem = texto(b.message, 4000);
  const marketing = b.marketing === true;
  const avaliacao = uuidValido(b.avaliacao) ? b.avaliacao : null;
  if (!nome || !emailValido(email) || !mensagem || b.consent !== true) {
    return res.status(400).json({ ok: false, erro: 'dados' });
  }

  let id = null;
  try {
    if (await garantirSchema()) {
      const rows = await db()`INSERT INTO contatos (nome, email, telefone, mensagem, consentimento_resposta, marketing, avaliacao_id)
        VALUES (${nome}, ${email}, ${telefone || null}, ${mensagem}, true, ${marketing}, ${avaliacao}) RETURNING id`;
      id = rows[0].id;
    }
  } catch (e) { console.error('contato:db', e.message); }

  const linhas = [
    ['Nome', nome], ['E-mail', email], ['Telefone', telefone || '(não informado)'],
    ['Aceita comunicações (marketing)', marketing ? 'Sim' : 'Não'],
    ['Avaliação "Avalie sua obra"', avaliacao ? avaliacao : '(nenhuma)'],
  ];
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#201e1a">
    <h2 style="font-size:18px">Novo contato pelo site</h2>
    <table cellpadding="6" style="border-collapse:collapse">${linhas.map(([k, v]) => `<tr><td style="color:#565049"><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>
    <p style="margin-top:16px"><b>Mensagem</b></p><p style="white-space:pre-wrap">${esc(mensagem)}</p></div>`;
  const text = linhas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMensagem:\n${mensagem}`;

  try {
    await enviarEmail({ to: CONTACT_TO, subject: `Novo contato pelo site - ${nome}`, html, text, replyTo: email });
    if (id) db()`UPDATE contatos SET enviado_email = true WHERE id = ${id}`.catch(() => {});
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contato:email', e.message);
    return res.status(502).json({ ok: false, erro: 'envio' });
  }
}
