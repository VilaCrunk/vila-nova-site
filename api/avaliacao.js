/* POST /api/avaliacao — instrumento "Avalie sua obra".
   acao = 'evento'    → métrica anônima de etapa (início/abandono), só enviada com consentimento de análise
   acao = 'resultado' → registro anônimo e recalculável (ID, versão, respostas literais) — sem dados pessoais
   acao = 'copia'     → envia a cópia do resultado para o e-mail informado (pedido voluntário)
   O servidor recalcula o resultado com o mesmo motor do navegador: nada do texto enviado é confiado. */

import { validarRequisicao, limitar, texto, emailValido, uuidValido, esc, enviarEmail, garantirSchema, db } from './_lib/util.js';
import { interpretar, validarRespostas, perfilDe } from '../js/avalie/motor.js';
import { CONTEXTO, SITUACOES, RESULTADOS_ESPECIAIS, TEXTOS, VERSAO, UI } from '../js/avalie/conteudo.js';

const ETAPAS = new Set(['inicio', 'contexto', 'S1', 'S2', 'S3', 'S4', 'S5', 'revisao', 'resultado']);
const opcao = (campo, v) => (CONTEXTO[campo].opcoes.some(o => o.id === v) ? v : null);

function contextoValido(c) {
  if (!c || typeof c !== 'object') return null;
  const papel = opcao('papel', c.papel), unidade = opcao('unidade', c.unidade);
  if (!papel || !unidade) return null;
  return { papel, unidade, fase: c.fase ? opcao('fase', c.fase) : null };
}
function respostasValidas(r) {
  if (!r || typeof r !== 'object') return null;
  const limpo = {};
  SITUACOES.forEach(s => s.questoes.forEach(q => { limpo[q.id] = r[q.id]; }));
  return validarRespostas(limpo).ok ? limpo : null;
}
function origemLimpa(o) {
  if (!o || typeof o !== 'object') return null;
  const out = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(k => { const v = texto(o[k], 120); if (v) out[k] = v; });
  return Object.keys(out).length ? out : null;
}

export default async function handler(req, res) {
  if (!validarRequisicao(req, res)) return;
  const b = req.body;

  if (b.acao === 'evento') {
    if (!limitar(req, 'evento', 60, 10 * 60 * 1000)) return res.status(204).end();
    if (!uuidValido(b.sessao) || !ETAPAS.has(b.etapa)) return res.status(400).json({ ok: false });
    try { if (await garantirSchema()) await db()`INSERT INTO avaliacao_eventos (sessao, etapa, versao) VALUES (${b.sessao}, ${b.etapa}, ${VERSAO})`; }
    catch (e) { console.error('avaliacao:evento', e.message); }
    return res.status(204).end();
  }

  const contexto = contextoValido(b.contexto);
  const respostas = respostasValidas(b.respostas);
  if (!contexto || !respostas) return res.status(400).json({ ok: false, erro: 'dados' });
  const r = interpretar(contexto, respostas);

  if (b.acao === 'resultado') {
    if (!limitar(req, 'resultado', 20, 10 * 60 * 1000)) return res.status(429).json({ ok: false });
    if (!uuidValido(b.id)) return res.status(400).json({ ok: false });
    try {
      if (await garantirSchema()) {
        await db()`INSERT INTO avaliacoes (id, versao, sessao, papel, unidade, fase, respostas, tipo, destaques, origem)
          VALUES (${b.id}, ${VERSAO}, ${uuidValido(b.sessao) ? b.sessao : null}, ${contexto.papel}, ${contexto.unidade}, ${contexto.fase},
                  ${JSON.stringify(respostas)}, ${r.tipo}, ${r.destaques}, ${JSON.stringify(origemLimpa(b.origem))})
          ON CONFLICT (id) DO UPDATE SET respostas = EXCLUDED.respostas, tipo = EXCLUDED.tipo, destaques = EXCLUDED.destaques,
            papel = EXCLUDED.papel, unidade = EXCLUDED.unidade, fase = EXCLUDED.fase, criado_em = now()`;
      }
    } catch (e) { console.error('avaliacao:resultado', e.message); }
    return res.status(200).json({ ok: true });
  }

  if (b.acao === 'copia') {
    if (b.website) return res.status(200).json({ ok: true });
    if (!limitar(req, 'copia', 3, 10 * 60 * 1000)) return res.status(429).json({ ok: false, erro: 'limite' });
    const email = texto(b.email, 160);
    const nome = texto(b.nome, 120);
    if (!emailValido(email)) return res.status(400).json({ ok: false, erro: 'email' });
    // Só guardamos o contato quando há opt-in de marketing; a cópia sozinha não gera cadastro.
    if (b.marketing === true) {
      try {
        if (await garantirSchema()) await db()`INSERT INTO avaliacao_relacionamento (avaliacao_id, nome, email, marketing)
          VALUES (${uuidValido(b.id) ? b.id : null}, ${nome || null}, ${email}, true)`;
      } catch (e) { console.error('avaliacao:relacionamento', e.message); }
    }
    try {
      const { html, text } = emailResultado(r, nome);
      await enviarEmail({ to: email, subject: 'Seu resultado - Avalie sua obra | VN Consultoria', html, text });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('avaliacao:copia', e.message);
      return res.status(502).json({ ok: false, erro: 'envio' });
    }
  }

  return res.status(400).json({ ok: false, erro: 'acao' });
}

/* E-mail com a mesma estrutura do resultado em tela (§9.1). */
function emailResultado(r, nome) {
  const esp = RESULTADOS_ESPECIAIS[r.tipo];
  const titulo = esp ? esp.titulo : r.destaques.map(id => perfilDe(id).titulo).join(' · ');
  const P = (t, s = '') => `<p style="margin:0 0 12px;${s}">${esc(t)}</p>`;
  const perfis = r.destaques.map(id => {
    const p = perfilDe(id); const s = r.porSituacao.find(x => x.id === id);
    const caps = s.capacidades.map(c => `${c.nome} — ${c.capacidade}`).join('; ');
    return `<div style="border-left:3px solid #9c6a1c;padding:12px 16px;margin:0 0 14px;background:#faf7f1">
      <p style="margin:0 0 6px;color:#565049;font-size:12px">${esc(s.nome)} · ${esc(s.rotulo)}</p>
      <p style="margin:0 0 10px;font-size:17px"><b>${esc(p.titulo)}</b></p>
      <p style="margin:0 0 6px"><b>${esc(UI.oQueIndica)}:</b> ${esc(p.relatada)}</p>
      ${caps ? `<p style="margin:0 0 6px"><b>${esc(UI.capacidade)}:</b> ${esc(caps)}</p>` : ''}
      <p style="margin:0 0 6px"><b>${esc(UI.oQueCompromete)}:</b> ${esc(p.consequencia)}</p>
      <p style="margin:0"><b>${esc(UI.primeiroMovimento)}:</b> ${esc(p.movimento)}</p></div>`;
  }).join('');
  const mapa = r.porSituacao.map(s => `<tr><td style="padding:6px 10px 6px 0">${esc(s.nome)}</td><td style="padding:6px 0;color:#9c6a1c"><b>${esc(s.rotulo)}</b></td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:#201e1a;max-width:620px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.14em;color:#9c6a1c">VN CONSULTORIA · AVALIE SUA OBRA</p>
    ${nome ? P('Olá, ' + nome + '.') : ''}
    <h1 style="font-size:22px;margin:8px 0 14px">${esc(titulo)}</h1>
    ${esp ? P(esp.texto) : ''}
    ${r.leituraLimitada ? P(UI.geralLimitada, 'color:#565049') : ''}
    <p style="margin:18px 0 8px;font-size:11px;letter-spacing:.14em;color:#565049"><b>${esc(UI.mapaTitulo.toUpperCase())}</b></p>
    <table style="border-collapse:collapse;margin:0 0 18px">${mapa}</table>
    ${perfis}
    ${P(TEXTOS.ressalva, 'color:#565049;font-size:12.5px')}
    ${P(TEXTOS.aviso, 'color:#565049;font-size:12.5px')}
    <p style="margin:18px 0 0;font-size:12px;color:#565049">VN Consultoria · Planejamento que Protege Resultados · contato@vilanovaconsultoria.com · (71) 99966-6462</p></div>`;
  const text = [titulo, esp ? esp.texto : '', '', UI.mapaTitulo + ':', ...r.porSituacao.map(s => `- ${s.nome}: ${s.rotulo}`), '',
    ...r.destaques.map(id => { const p = perfilDe(id); return `${p.titulo}\n${UI.oQueIndica}: ${p.relatada}\n${UI.oQueCompromete}: ${p.consequencia}\n${UI.primeiroMovimento}: ${p.movimento}\n`; }),
    TEXTOS.ressalva, TEXTOS.aviso].join('\n');
  return { html, text };
}
