// Testes das funções serverless sem rede: Resend é simulado e o banco fica desligado (sem DATABASE_URL).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.DATABASE_URL;
process.env.RESEND_API_KEY = 'teste';
const enviados = [];
globalThis.fetch = async (url, opts) => {
  enviados.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
};
const { default: contato } = await import('../api/contato.js');
const { default: avaliacao } = await import('../api/avaliacao.js');

const req = (body, extra = {}) => ({ method: 'POST', headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-for': String(Math.random()) }, body, ...extra });
const res = () => { const r = { code: 0, data: null, headers: {} };
  r.status = (c) => { r.code = c; return r; }; r.json = (d) => { r.data = d; return r; }; r.end = () => r; r.setHeader = (k, v) => { r.headers[k] = v; }; return r; };
const R = Object.fromEntries(['Q01','Q02','Q03','Q04','Q05','Q06','Q07','Q08','Q09','Q10','Q11','Q12','Q13','Q14','Q15'].map(q => [q, 'R']));
beforeEach(() => { enviados.length = 0; });

test('contato: rejeita GET e origem externa', async () => {
  const r1 = res(); await contato({ ...req({}), method: 'GET' }, r1); assert.equal(r1.code, 405);
  const r2 = res(); await contato(req({}, { headers: { host: 'site.test', origin: 'https://malicioso.test' } }), r2); assert.equal(r2.code, 403);
});

test('contato: exige consentimento e dados válidos', async () => {
  const r = res(); await contato(req({ name: 'A', email: 'a@b.co', message: 'oi', consent: false, elapsed: 9000 }), r);
  assert.equal(r.code, 400); assert.equal(enviados.length, 0);
});

test('contato: envia e escapa HTML da mensagem', async () => {
  const r = res();
  await contato(req({ name: 'Ana <b>', email: 'ana@empresa.com', message: '<script>x</script>', consent: true, marketing: false, elapsed: 9000 }), r);
  assert.equal(r.code, 200);
  assert.equal(enviados.length, 1);
  assert.match(enviados[0].body.html, /&lt;script&gt;/);
  assert.equal(enviados[0].body.reply_to, 'ana@empresa.com');
});

test('contato: campo-isca finge sucesso sem enviar', async () => {
  const r = res(); await contato(req({ name: 'Bot', email: 'b@b.co', message: 'spam', consent: true, website: 'x', elapsed: 9000 }), r);
  assert.equal(r.code, 200); assert.equal(enviados.length, 0);
});

test('avaliacao: resultado anônimo é aceito e recalculado no servidor', async () => {
  const r = res();
  await avaliacao(req({ acao: 'resultado', id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', contexto: { papel: 'gerente', unidade: 'obra' }, respostas: R }), r);
  assert.equal(r.code, 200);
});

test('avaliacao: rejeita respostas incompletas ou contexto inválido', async () => {
  const r1 = res(); await avaliacao(req({ acao: 'resultado', id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', contexto: { papel: 'gerente', unidade: 'obra' }, respostas: { Q01: 'F' } }), r1);
  assert.equal(r1.code, 400);
  const r2 = res(); await avaliacao(req({ acao: 'resultado', contexto: { papel: 'hacker', unidade: 'obra' }, respostas: R }), r2);
  assert.equal(r2.code, 400);
});

test('avaliacao: cópia por e-mail usa o resultado recalculado, não texto do cliente', async () => {
  const r = res();
  await avaliacao(req({ acao: 'copia', email: 'x@empresa.com', nome: 'Rui', contexto: { papel: 'decisor', unidade: 'obra' },
    respostas: { ...R, Q04: 'F', Q05: 'F' }, titulo: 'INJETADO' }), r);
  assert.equal(r.code, 200);
  assert.equal(enviados.length, 1);
  assert.match(enviados[0].body.html, /Gestão no modo reação/);
  assert.doesNotMatch(enviados[0].body.html, /INJETADO/);
});

test('avaliacao: evento exige sessão e etapa conhecidas', async () => {
  const r1 = res(); await avaliacao(req({ acao: 'evento', sessao: 'x', etapa: 'S1' }), r1); assert.equal(r1.code, 400);
  const r2 = res(); await avaliacao(req({ acao: 'evento', sessao: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', etapa: 'S1' }), r2); assert.equal(r2.code, 204);
});
