// Testes do motor do "Avalie sua obra" — cenários do §13.1 e critérios do §13.3.
// Rodar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretar, classificarSituacao, validarRespostas } from '../js/avalie/motor.js';
import { SITUACOES } from '../js/avalie/conteudo.js';

const CTX = { papel: 'gerente', unidade: 'obra' };
const IDS = SITUACOES.flatMap(s => s.questoes.map(q => q.id));
const todas = (v) => Object.fromEntries(IDS.map(id => [id, v]));
const com = (base, mudancas) => ({ ...base, ...mudancas });
const sit = (r, id) => r.porSituacao.find(s => s.id === id);

test('§13.3 — quinze perguntas, cinco situações, três por situação, pilar primário definido', () => {
  assert.equal(IDS.length, 15);
  assert.equal(new Set(IDS).size, 15);
  assert.equal(SITUACOES.length, 5);
  SITUACOES.forEach(s => {
    assert.equal(s.questoes.length, 3);
    s.questoes.forEach(q => assert.ok(['RE', 'ME', 'AA', 'II', 'RM'].includes(q.pilar)));
  });
});

test('§7 — correspondência com os pilares confere com a tabela oficial', () => {
  const porPilar = {};
  SITUACOES.forEach(s => s.questoes.forEach(q => { (porPilar[q.pilar] ||= []).push(q.id); }));
  assert.deepEqual(porPilar.RE.sort(), ['Q03', 'Q11', 'Q12']);
  assert.deepEqual(porPilar.ME.sort(), ['Q01', 'Q02', 'Q08']);
  assert.deepEqual(porPilar.AA.sort(), ['Q04', 'Q05', 'Q06']);
  assert.deepEqual(porPilar.II.sort(), ['Q07', 'Q09', 'Q10']);
  assert.deepEqual(porPilar.RM.sort(), ['Q13', 'Q14', 'Q15']);
});

test('§8.3 — regras por situação de três perguntas', () => {
  assert.equal(classificarSituacao({ F: 0, A: 0, R: 3, N: 0 }).nivel, 'baixa');
  assert.equal(classificarSituacao({ F: 0, A: 1, R: 2, N: 0 }).nivel, 'baixa');
  assert.equal(classificarSituacao({ F: 0, A: 2, R: 1, N: 0 }).nivel, 'atencao');
  assert.equal(classificarSituacao({ F: 0, A: 3, R: 0, N: 0 }).nivel, 'atencao');
  assert.equal(classificarSituacao({ F: 1, A: 0, R: 2, N: 0 }).nivel, 'sinal');
  assert.equal(classificarSituacao({ F: 2, A: 1, R: 0, N: 0 }).nivel, 'recorrente');
  assert.equal(classificarSituacao({ F: 3, A: 0, R: 0, N: 0 }).nivel, 'recorrente');
  assert.equal(classificarSituacao({ F: 0, A: 0, R: 1, N: 2 }).nivel, 'insuficiente');
  // frequente + desconhecida: destaca a ocorrência conhecida e indica limitação
  const fn = classificarSituacao({ F: 1, A: 0, R: 0, N: 2 });
  assert.equal(fn.nivel, 'sinal');
  assert.equal(fn.parcial, true);
});

test('Respostas incompletas são rejeitadas; "Não sei avaliar" é resposta válida', () => {
  const r = todas('R'); delete r.Q07;
  assert.equal(validarRespostas(r).ok, false);
  assert.deepEqual(validarRespostas(r).faltando, ['Q07']);
  assert.equal(validarRespostas(todas('N')).ok, true);
  assert.throws(() => interpretar(CTX, r));
});

test('Cenário 1 — ocorrências frequentes concentradas em uma situação', () => {
  const r = interpretar(CTX, com(todas('R'), { Q04: 'F', Q05: 'F', Q06: 'A' }));
  assert.equal(r.tipo, 'principal');
  assert.deepEqual(r.destaques, ['S2']);
  assert.equal(sit(r, 'S2').nivel, 'recorrente');
  assert.deepEqual(sit(r, 'S2').capacidades.map(c => c.id), ['AA']);
});

test('Cenário 2 — exposições frequentes em duas ou mais situações', () => {
  const r = interpretar(CTX, com(todas('R'), { Q04: 'F', Q05: 'F', Q07: 'F', Q13: 'F' }));
  assert.equal(r.tipo, 'multiplas');
  assert.deepEqual(r.destaques, ['S2']);           // maior predominância de frequentes
  assert.deepEqual(r.combinadas.sort(), ['S3', 'S5']); // combinação apresentada, sem causa-raiz
});

test('Cenário 3 — baixa ocorrência em todas as perguntas: não fabrica problema', () => {
  const r = interpretar(CTX, todas('R'));
  assert.equal(r.tipo, 'baixa');
  assert.deepEqual(r.destaques, []);
  r.porSituacao.forEach(s => assert.equal(s.nivel, 'baixa'));
});

test('Cenário 4 — respostas predominantemente "Não sei avaliar"', () => {
  const r = interpretar(CTX, com(todas('N'), { Q01: 'R', Q04: 'R', Q07: 'A' }));
  assert.equal(r.tipo, 'insuficiente');
  assert.equal(r.totais.N, 12);
  // lacunas são exibidas como lacunas, nunca como baixa exposição
  r.porSituacao.forEach(s => assert.notEqual(s.nivel, 'baixa'));
});

test('Cenário 4b — lacunas com ocorrência conhecida: destaca a ocorrência e mantém a limitação', () => {
  const r = interpretar(CTX, com(todas('N'), { Q04: 'F' }));
  assert.equal(r.tipo, 'insuficiente');
  assert.deepEqual(r.destaques, ['S2']);
  assert.equal(sit(r, 'S2').parcial, true);
});

test('Cenário 5 — empate entre situações em ocorrências frequentes', () => {
  const r = interpretar(CTX, com(todas('R'), { Q01: 'F', Q02: 'F', Q10: 'F', Q11: 'F' }));
  assert.equal(r.tipo, 'multiplas');
  assert.equal(r.empate, true);
  assert.deepEqual(r.destaques.sort(), ['S1', 'S4']); // não impõe hierarquia arbitrária
});

test('Cenário 6 — uma ocorrência frequente e demais respostas favoráveis', () => {
  const r = interpretar(CTX, com(todas('R'), { Q09: 'F' }));
  assert.equal(r.tipo, 'principal');
  assert.deepEqual(r.destaques, ['S3']);
  assert.equal(sit(r, 'S3').nivel, 'sinal'); // preserva alerta qualitativo
});

test('Cenário 7 — respostas aparentemente contraditórias são lidas sem inferir causa', () => {
  // ex.: liderança raramente surpreendida (Q05) mas decisões urgentes frequentes (Q06)
  const r = interpretar(CTX, com(todas('R'), { Q05: 'R', Q06: 'F', Q13: 'A', Q15: 'A' }));
  assert.equal(r.tipo, 'principal');
  assert.deepEqual(r.destaques, ['S2']);
  assert.equal(sit(r, 'S5').nivel, 'atencao');
});

test('Cenário 8 — dois respondentes da mesma obra com percepções distintas', () => {
  const a = interpretar({ papel: 'decisor', unidade: 'obra' }, com(todas('R'), { Q07: 'F', Q08: 'F' }));
  const b = interpretar({ papel: 'tecnico', unidade: 'obra' }, com(todas('R'), { Q13: 'F', Q14: 'A', Q15: 'A' }));
  // cada leitura é independente e determinística; não há comparação nem "erro" atribuído
  assert.deepEqual(a.destaques, ['S3']);
  assert.deepEqual(b.destaques, ['S5']);
  assert.deepEqual(interpretar({ papel: 'decisor', unidade: 'obra' }, com(todas('R'), { Q07: 'F', Q08: 'F' })), a);
});

test('Sem frequentes, mas com atenção à recorrência em uma situação', () => {
  const r = interpretar(CTX, com(todas('R'), { Q10: 'A', Q11: 'A' }));
  assert.equal(r.tipo, 'atencao');
  assert.deepEqual(r.destaques, ['S4']);
});

test('§8.6 — o resultado não expõe pontuação 0–30 nem nível de maturidade', () => {
  const r = interpretar(CTX, com(todas('A'), { Q01: 'F' }));
  const json = JSON.stringify(r);
  assert.ok(!/pontua|score|nota|maturidade|cartorial|estrat[eé]gico/i.test(json));
});

test('Experiência geral sinaliza leitura mais limitada', () => {
  assert.equal(interpretar({ papel: 'outro', unidade: 'geral' }, todas('R')).leituraLimitada, true);
});

test('Varredura: todas as 4^3 combinações por situação produzem um nível válido', () => {
  const vals = ['F', 'A', 'R', 'N'];
  for (const a of vals) for (const b of vals) for (const c of vals) {
    const cont = { F: 0, A: 0, R: 0, N: 0 }; [a, b, c].forEach(x => cont[x]++);
    const { nivel } = classificarSituacao(cont);
    assert.ok(['baixa', 'atencao', 'sinal', 'recorrente', 'insuficiente'].includes(nivel));
    if (cont.N >= 2 && cont.F === 0) assert.equal(nivel, 'insuficiente');
  }
});
