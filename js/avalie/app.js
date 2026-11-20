/* =============================================================
   AVALIE SUA OBRA — interface do instrumento digital (A07)
   Jornada (§4): contextualização → 15 questões em 5 situações →
   revisão → resultado em tela, sem cadastro obrigatório.
   Envio por e-mail e contato são opcionais e separados (§10, §12).
   ============================================================= */

import { SITUACOES, RESPOSTAS, CONTEXTO, TEXTOS, UI, RESULTADOS_ESPECIAIS, VERSAO } from './conteudo.js';
import { interpretar, perfilDe } from './motor.js';

const ETAPA_CONTEXTO = 0;
const ETAPA_REVISAO = SITUACOES.length + 1;
const ETAPA_RESULTADO = SITUACOES.length + 2;
const STORE_KEY = 'vn-avalie-v1';

const root = document.getElementById('avalie-sua-obra');
const app = document.getElementById('avalie-app');
const startBtns = document.querySelectorAll('[data-avalie-start]');
if (!root || !app) throw new Error('Seção Avalie sua obra ausente.');

/* ---------- utilidades ---------- */
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
  return el;
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
}));
const arrow = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', 'M5 12h14M13 6l6 6-6 6'); s.append(p); return s;
};
const consentAnalytics = () => { try { return localStorage.getItem('vn-cookies') === 'aceito'; } catch { return false; } };

/* ---------- estado (sessionStorage: some ao fechar a aba) ---------- */
let state = load() || novo();
function novo() { return { etapa: ETAPA_CONTEXTO, contexto: {}, respostas: {}, sessao: uid(), resultadoId: null, origem: origem() }; }
function load() { try { return JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch { return null; } }
function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* sem storage: segue em memória */ } }
function origem() {
  // Origem da visita (§10.4) sem identificar ninguém: utm_source/medium/campaign e domínio de referência.
  try {
    const p = new URLSearchParams(location.search);
    const ref = document.referrer ? new URL(document.referrer).hostname : '';
    return {
      utm_source: p.get('utm_source') || null, utm_medium: p.get('utm_medium') || null,
      utm_campaign: p.get('utm_campaign') || null, ref: ref && ref !== location.hostname ? ref : null,
    };
  } catch { return {}; }
}

/* ---------- métricas anônimas (§10.4): início, abandono por etapa ---------- */
function registrarEvento(etapa) {
  if (!consentAnalytics()) return; // métricas de navegação só com consentimento
  const body = JSON.stringify({ acao: 'evento', sessao: state.sessao, etapa, versao: VERSAO });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/avaliacao', new Blob([body], { type: 'application/json' }));
    else fetch('/api/avaliacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch { /* métrica não pode quebrar a experiência */ }
}

/* ---------- abrir / fechar ---------- */
function abrir() {
  root.classList.add('is-running');
  app.hidden = false;
  if (state.etapa === ETAPA_CONTEXTO && !state.contexto.papel) registrarEvento('inicio');
  render();
  root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
function fechar() {
  root.classList.remove('is-running');
  app.hidden = true;
  const b = startBtns[0]; if (b) b.focus();
}
startBtns.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); abrir(); }));
if (location.hash === '#avalie-sua-obra') setTimeout(abrir, 60);

function irPara(etapa) {
  state.etapa = etapa; save(); render();
  registrarEvento(etapa === ETAPA_RESULTADO ? 'resultado' : etapa === ETAPA_REVISAO ? 'revisao' : etapa === 0 ? 'contexto' : 'S' + etapa);
  const t = app.querySelector('.av-focus'); if (t) t.focus({ preventScroll: true });
  const top = app.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * .4) app.scrollIntoView({ block: 'start' });
}

/* ---------- componentes ---------- */
function cabecalho() {
  const total = ETAPA_REVISAO; // contexto + 5 situações + revisão
  const atual = Math.min(state.etapa, total);
  const pct = state.etapa >= ETAPA_RESULTADO ? 100 : Math.round((atual / total) * 100);
  const passos = [UI.etapaContexto, ...SITUACOES.map((_, i) => String(i + 1)), UI.etapaRevisao];
  return h('div', { class: 'av-head' },
    h('div', { class: 'av-brand' }, h('span', { class: 'av-brand-mark', 'aria-hidden': 'true' }), 'VN Consultoria · Autodiagnóstico'),
    h('button', { class: 'av-close', type: 'button', 'aria-label': UI.fechar, onclick: fechar }, '×'),
    h('div', { class: 'av-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': 'Progresso da avaliação' },
      h('span', { class: 'av-progress-bar', style: `width:${pct}%` })),
    h('ol', { class: 'av-steps', 'aria-hidden': 'true' },
      passos.map((p, i) => h('li', { class: i < state.etapa || state.etapa >= ETAPA_RESULTADO ? 'done' : i === state.etapa ? 'now' : '' }, p)))
  );
}

function grupoRadio({ name, legenda, opcoes, valor, onChange, opcional, compacto }) {
  const legId = 'lg-' + name;
  return h('fieldset', { class: 'av-q' + (compacto ? ' av-q--ctx' : '') },
    h('legend', { id: legId, class: 'av-q-text' }, legenda, opcional ? h('span', { class: 'av-opt' }, ' (' + UI.opcional + ')') : null),
    h('div', { class: 'av-choices' + (compacto ? ' av-choices--wrap' : '') },
      opcoes.map(o => {
        const id = `${name}-${o.id}`;
        return h('label', { class: 'av-choice' + (o.id === 'N' ? ' av-choice--na' : ''), for: id },
          h('input', { type: 'radio', id, name, value: o.id, checked: valor === o.id, onchange: () => onChange(o.id) }),
          h('span', {}, o.rotulo));
      })));
}

function rodape({ voltar, avancar, rotulo, desabilitado, aviso }) {
  return h('div', { class: 'av-foot' },
    voltar ? h('button', { class: 'av-btn av-btn--ghost', type: 'button', onclick: voltar }, UI.voltar) : h('span'),
    h('div', { class: 'av-foot-right' },
      h('p', { class: 'av-hint', role: 'status', 'aria-live': 'polite' }, desabilitado ? aviso : ''),
      h('button', { class: 'av-btn', type: 'button', 'aria-disabled': desabilitado ? 'true' : 'false',
        onclick: () => { if (desabilitado) { app.querySelector('.av-hint').textContent = aviso; return; } avancar(); } },
        rotulo, arrow())));
}

/* ---------- etapas ---------- */
function etapaContexto() {
  const c = state.contexto;
  const ok = !!(c.papel && c.unidade);
  const set = (k) => (v) => { state.contexto[k] = v; save(); refazerRodape(); };
  return h('div', { class: 'av-body' },
    h('p', { class: 'av-eyebrow' }, UI.etapaContexto),
    h('h3', { class: 'av-title av-focus', tabindex: '-1' }, 'Antes de começar'),
    h('p', { class: 'av-lead' }, TEXTOS.instrucao),
    ['papel', 'unidade', 'fase'].map(k => grupoRadio({
      name: 'ctx-' + k, legenda: CONTEXTO[k].rotulo, opcoes: CONTEXTO[k].opcoes, valor: c[k],
      onChange: set(k), opcional: !CONTEXTO[k].obrigatorio, compacto: true,
    })),
    rodape({ avancar: () => irPara(1), rotulo: UI.avancar, desabilitado: !ok, aviso: UI.faltaContexto }));
}

function etapaSituacao(i) {
  const s = SITUACOES[i];
  const ok = s.questoes.every(q => state.respostas[q.id]);
  const set = (qid) => (v) => { state.respostas[qid] = v; save(); refazerRodape(); };
  return h('div', { class: 'av-body' },
    h('p', { class: 'av-eyebrow' }, `${UI.situacao} ${i + 1} ${UI.de} ${SITUACOES.length}`),
    h('h3', { class: 'av-title av-focus', tabindex: '-1' }, s.nome),
    h('p', { class: 'av-question' }, s.pergunta),
    s.questoes.map((q, n) => grupoRadio({
      name: q.id, legenda: h('span', {}, h('b', { class: 'av-qn' }, q.id.replace('Q', '') + '.'), ' ', q.texto),
      opcoes: RESPOSTAS, valor: state.respostas[q.id], onChange: set(q.id),
    })),
    rodape({
      voltar: () => irPara(i), avancar: () => irPara(i + 2),
      rotulo: i === SITUACOES.length - 1 ? UI.revisar : UI.avancar, desabilitado: !ok, aviso: UI.faltaResponder,
    }));
}

function etapaRevisao() {
  const rot = Object.fromEntries(RESPOSTAS.map(r => [r.id, r.rotulo]));
  const ctxRot = (k) => { const o = CONTEXTO[k].opcoes.find(x => x.id === state.contexto[k]); return o ? o.rotulo : '—'; };
  return h('div', { class: 'av-body' },
    h('p', { class: 'av-eyebrow' }, UI.etapaRevisao),
    h('h3', { class: 'av-title av-focus', tabindex: '-1' }, UI.revisar),
    h('div', { class: 'av-review' },
      h('section', { class: 'av-rev-group' },
        h('div', { class: 'av-rev-head' }, h('h4', {}, UI.etapaContexto), h('button', { type: 'button', class: 'av-link', onclick: () => irPara(0) }, UI.editar)),
        h('dl', { class: 'av-rev-list' }, ['papel', 'unidade', 'fase'].map(k => [h('dt', {}, CONTEXTO[k].rotulo), h('dd', {}, ctxRot(k))]))),
      SITUACOES.map((s, i) => h('section', { class: 'av-rev-group' },
        h('div', { class: 'av-rev-head' }, h('h4', {}, s.nome), h('button', { type: 'button', class: 'av-link', onclick: () => irPara(i + 1), 'aria-label': `${UI.editar}: ${s.nome}` }, UI.editar)),
        h('dl', { class: 'av-rev-list' }, s.questoes.map(q => [h('dt', {}, q.texto), h('dd', { 'data-r': state.respostas[q.id] }, rot[state.respostas[q.id]] || '—')]))))),
    rodape({ voltar: () => irPara(SITUACOES.length), avancar: concluir, rotulo: UI.verResultado }));
}

function concluir() {
  const r = interpretar(state.contexto, state.respostas);
  state.resultadoId = state.resultadoId || uid();
  save();
  // Registro anônimo e recalculável (Anexo A): ID, versão e respostas literais. Sem dados pessoais.
  fetch('/api/avaliacao', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
    body: JSON.stringify({ acao: 'resultado', id: state.resultadoId, sessao: state.sessao, versao: VERSAO,
      contexto: state.contexto, respostas: state.respostas, tipo: r.tipo, destaques: r.destaques, origem: state.origem }),
  }).catch(() => {});
  irPara(ETAPA_RESULTADO);
}

/* ---------- resultado (§9.1) ---------- */
function blocoPerfil(id, r) {
  const p = perfilDe(id);
  const sit = r.porSituacao.find(s => s.id === id);
  return h('article', { class: 'av-profile' },
    h('p', { class: 'av-profile-sit' }, sit.nome, ' · ', h('span', { class: 'av-badge', 'data-nivel': sit.nivel }, sit.rotulo)),
    h('h4', { class: 'av-profile-title' }, p.titulo),
    h('dl', { class: 'av-profile-dl' },
      h('dt', {}, UI.oQueIndica), h('dd', {}, p.relatada),
      sit.capacidades.length ? [h('dt', {}, UI.capacidade), h('dd', {}, sit.capacidades.map((c, i) => [i ? h('br') : null, h('b', {}, c.nome), ' — ', c.capacidade]))] : null,
      h('dt', {}, UI.oQueCompromete), h('dd', {}, p.consequencia),
      h('dt', {}, UI.primeiroMovimento), h('dd', { class: 'av-move' }, p.movimento)),
    sit.parcial ? h('p', { class: 'av-note' }, UI.coberturaParcial) : null);
}

function mapa(r) {
  return h('section', { class: 'av-map', 'aria-labelledby': 'av-map-h' },
    h('h4', { id: 'av-map-h', class: 'av-sub' }, UI.mapaTitulo),
    h('ul', {}, r.porSituacao.map(s => {
      const sit = SITUACOES.find(x => x.id === s.id);
      const desc = ['F', 'A', 'R', 'N'].filter(k => s.contagem[k]).map(k => `${s.contagem[k]} ${UI.contagem[k]}`).join(', ');
      return h('li', { class: 'av-map-row' + (r.destaques.includes(s.id) ? ' is-key' : '') },
        h('span', { class: 'av-map-name' }, s.nome),
        h('span', { class: 'av-cells', role: 'img', 'aria-label': desc }, sit.questoes.map(q => h('i', { 'data-r': state.respostas[q.id] }))),
        h('span', { class: 'av-badge', 'data-nivel': s.nivel }, s.rotulo));
    })),
    h('p', { class: 'av-legend', 'aria-hidden': 'true' }, RESPOSTAS.map(o => h('span', {}, h('i', { 'data-r': o.id }), o.rotulo))));
}

function etapaResultado() {
  const r = interpretar(state.contexto, state.respostas);
  const especial = RESULTADOS_ESPECIAIS[r.tipo];
  const titulo = especial ? especial.titulo : r.destaques.map(id => perfilDe(id).titulo).join(' · ');
  const eyebrow = especial ? 'Resultado' : (r.destaques.length > 1 ? UI.maioresAtencoes : UI.maiorAtencao);
  const tecnico = state.contexto.papel === 'tecnico';
  const nomes = (ids) => ids.map(id => SITUACOES.find(s => s.id === id).nome).join(', ');

  return h('div', { class: 'av-body av-result' },
    h('p', { class: 'av-eyebrow' }, eyebrow),
    h('h3', { class: 'av-title av-title--result av-focus', tabindex: '-1' }, titulo),
    especial ? h('p', { class: 'av-lead' }, especial.texto) : null,
    r.leituraLimitada ? h('p', { class: 'av-note' }, UI.geralLimitada) : null,
    mapa(r),
    r.destaques.length ? h('div', { class: 'av-profiles' }, r.destaques.map(id => blocoPerfil(id, r))) : null,
    r.combinadas.length ? h('p', { class: 'av-note' }, 'Também com ocorrências declaradas: ', h('b', {}, nomes(r.combinadas)), '.') : null,
    h('div', { class: 'av-disclaimer' }, h('p', {}, TEXTOS.ressalva), h('p', {}, TEXTOS.aviso)),
    h('section', { class: 'av-next' },
      h('p', {}, tecnico ? TEXTOS.conversaoTecnico : TEXTOS.conversaoDecisor),
      h('div', { class: 'av-next-actions' },
        tecnico
          ? h('a', { class: 'av-btn', href: '/treinamentos' }, TEXTOS.ctaTecnico, arrow())
          : h('a', { class: 'av-btn', href: '#contato', onclick: irParaContato }, TEXTOS.ctaDecisor, arrow()),
        tecnico ? h('a', { class: 'av-link', href: '#contato', onclick: irParaContato }, TEXTOS.ctaDecisor) : null)),
    formCopia(),
    h('div', { class: 'av-foot av-foot--result' },
      h('button', { class: 'av-btn av-btn--ghost', type: 'button', onclick: () => { state = novo(); save(); render(); registrarEvento('inicio'); } }, UI.refazer),
      h('button', { class: 'av-link', type: 'button', onclick: () => window.print() }, UI.imprimir)));
}

function irParaContato(e) {
  // Contato opcional: leva a referência anônima da avaliação para o formulário (sem prometer agendamento).
  try { sessionStorage.setItem('vn-avaliacao-ref', state.resultadoId || ''); } catch { /* ok */ }
  document.dispatchEvent(new CustomEvent('vn:abrir-contato', { detail: { avaliacao: state.resultadoId } }));
  if (e && e.currentTarget.getAttribute('href') === '#contato') {
    e.preventDefault();
    document.getElementById('contato').scrollIntoView({ behavior: 'smooth' });
  }
}

function formCopia() {
  const fb = h('p', { class: 'av-hint', role: 'status', 'aria-live': 'polite' });
  const btn = h('button', { class: 'av-btn av-btn--small', type: 'submit' }, UI.enviarCopia);
  const form = h('form', { class: 'av-copy', novalidate: true },
    h('details', {},
      h('summary', {}, UI.receberCopia),
      h('div', { class: 'av-copy-fields' },
        h('label', { class: 'av-field' }, h('span', {}, 'Nome ', h('span', { class: 'av-opt' }, '(' + UI.opcional + ')')),
          h('input', { name: 'nome', type: 'text', autocomplete: 'name', maxlength: '120' })),
        h('label', { class: 'av-field' }, h('span', {}, 'E-mail'),
          h('input', { name: 'email', type: 'email', autocomplete: 'email', required: true, maxlength: '160' })),
        h('input', { class: 'hp', name: 'website', type: 'text', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }),
        h('label', { class: 'av-check' }, h('input', { name: 'consentEnvio', type: 'checkbox', required: true }),
          h('span', {}, UI.consentEnvio.replace('Política de Privacidade', ''), h('a', { href: '/politica-de-privacidade', target: '_blank', rel: 'noopener' }, 'Política de Privacidade'), '.')),
        h('label', { class: 'av-check' }, h('input', { name: 'marketing', type: 'checkbox' }), h('span', {}, UI.consentMarketing)),
        btn, fb)));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const email = String(d.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fb.textContent = 'Informe um e-mail válido.'; form.email.focus(); return; }
    if (!d.get('consentEnvio')) { fb.textContent = 'Marque a autorização de envio para continuar.'; return; }
    btn.disabled = true; fb.textContent = 'Enviando…';
    try {
      const res = await fetch('/api/avaliacao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'copia', id: state.resultadoId, versao: VERSAO, contexto: state.contexto, respostas: state.respostas,
          nome: String(d.get('nome') || '').trim(), email, marketing: !!d.get('marketing'), website: d.get('website') || '' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      fb.textContent = UI.copiaEnviada; form.reset();
    } catch { fb.textContent = UI.copiaErro; }
    btn.disabled = false;
  });
  return form;
}

/* ---------- render ---------- */
function corpo() {
  if (state.etapa === ETAPA_CONTEXTO) return etapaContexto();
  if (state.etapa <= SITUACOES.length) return etapaSituacao(state.etapa - 1);
  if (state.etapa === ETAPA_REVISAO) return etapaRevisao();
  return etapaResultado();
}
function render() {
  app.replaceChildren(h('div', { class: 'av-panel' }, cabecalho(), corpo()));
}
function refazerRodape() {
  // Atualiza só o estado do botão (sem redesenhar e perder o foco do teclado).
  const body = corpo();
  const novoFoot = body.querySelector('.av-foot');
  const atual = app.querySelector('.av-foot');
  if (novoFoot && atual) { novoFoot.querySelector('.av-hint').textContent = ''; atual.replaceWith(novoFoot); }
}

// Esc fecha o painel (o progresso fica guardado na sessão).
app.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
