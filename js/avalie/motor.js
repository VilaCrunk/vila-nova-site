/* =============================================================
   AVALIE SUA OBRA — motor de interpretação (versão 1.0)
   Implementa o capítulo 8 do projeto oficial do Autodiagnóstico:
   - leitura indicativa de exposição percebida (não maturidade);
   - sem pontuação 0–30 (§8.6);
   - "Não sei avaliar" é lacuna, nunca nota zero (§6, §8.2);
   - regras por situação de três perguntas (§8.3);
   - ordem de processamento (§8.4) e casos especiais (§8.5).
   Módulo puro: roda no navegador e no servidor (recalculável).
   ============================================================= */

import { SITUACOES, PILARES, ROTULOS_NIVEL, VERSAO } from './conteudo.js';

export const PESO_NIVEL = { insuficiente: 0, baixa: 1, atencao: 2, sinal: 3, recorrente: 4 };

/* Limiares globais de suficiência (hipóteses operacionais — §8.3 pede calibração com casos reais) */
export const LIMIARES = {
  situacoesInsuficientes: 3, // a partir de 3 das 5 situações sem leitura → resultado "informação insuficiente"
  respostasDesconhecidas: 8, // ou 8+ das 15 respostas como "Não sei avaliar"
};

const VALIDAS = new Set(['F', 'A', 'R', 'N']);

/** Valida o conjunto de respostas: Q01–Q15 obrigatórias, valores F/A/R/N. */
export function validarRespostas(respostas) {
  const faltando = [];
  for (const s of SITUACOES) {
    for (const q of s.questoes) {
      if (!respostas || !VALIDAS.has(respostas[q.id])) faltando.push(q.id);
    }
  }
  return { ok: faltando.length === 0, faltando };
}

/** §8.3 — classifica uma situação a partir das três respostas. */
export function classificarSituacao(contagem) {
  const { F, A, N } = contagem;
  let nivel;
  if (F >= 2) nivel = 'recorrente';
  else if (F === 1) nivel = 'sinal';
  else if (N >= 2) nivel = 'insuficiente'; // respostas desconhecidas impedem interpretação
  else if (A >= 2) nivel = 'atencao';
  else nivel = 'baixa';
  // Ocorrência frequente + desconhecidas: destaca a ocorrência conhecida e indica a limitação de cobertura.
  const parcial = N >= 1 && nivel !== 'insuficiente';
  return { nivel, rotulo: ROTULOS_NIVEL[nivel], parcial };
}

function contar(situacao, respostas) {
  const c = { F: 0, A: 0, R: 0, N: 0 };
  situacao.questoes.forEach(q => { c[respostas[q.id]] += 1; });
  return c;
}

/** Capacidades sob exame: pilar primário das questões com ocorrência declarada (sem dupla contagem — §7). */
function capacidades(situacao, respostas) {
  const ids = [];
  situacao.questoes.forEach(q => {
    if ((respostas[q.id] === 'F' || respostas[q.id] === 'A') && !ids.includes(q.pilar)) ids.push(q.pilar);
  });
  return ids.map(id => ({ id, ...PILARES[id] }));
}

/**
 * §8.4 — processamento completo.
 * @param {object} contexto  { papel, unidade, fase? }
 * @param {object} respostas { Q01: 'F'|'A'|'R'|'N', ... }
 */
export function interpretar(contexto, respostas) {
  const v = validarRespostas(respostas);
  if (!v.ok) throw new Error('Respostas incompletas: ' + v.faltando.join(', '));

  // 2–4. Contagem, suficiência e rótulos por situação.
  const porSituacao = SITUACOES.map(s => {
    const contagem = contar(s, respostas);
    return { id: s.id, nome: s.nome, contagem, ...classificarSituacao(contagem), capacidades: capacidades(s, respostas) };
  });

  const totais = porSituacao.reduce((t, s) => {
    ['F', 'A', 'R', 'N'].forEach(k => { t[k] += s.contagem[k]; });
    return t;
  }, { F: 0, A: 0, R: 0, N: 0 });

  const insuficientes = porSituacao.filter(s => s.nivel === 'insuficiente');
  const expostas = porSituacao.filter(s => s.contagem.F >= 1);
  const atencao = porSituacao.filter(s => s.nivel === 'atencao');

  // 5. Situação principal por predominância de ocorrências frequentes; empate → múltiplas áreas.
  const maiores = (lista, chave) => {
    if (!lista.length) return [];
    const max = Math.max(...lista.map(s => s.contagem[chave]));
    return lista.filter(s => s.contagem[chave] === max);
  };

  let tipo;
  let destaques = [];
  let combinadas = [];

  if (insuficientes.length >= LIMIARES.situacoesInsuficientes || totais.N >= LIMIARES.respostasDesconhecidas) {
    // Dados insuficientes: não gerar síntese categórica; ocorrências conhecidas continuam destacadas.
    tipo = 'insuficiente';
    destaques = maiores(expostas, 'F');
    combinadas = expostas.filter(s => !destaques.includes(s));
  } else if (expostas.length >= 2) {
    tipo = 'multiplas';
    destaques = maiores(expostas, 'F');
    combinadas = expostas.filter(s => !destaques.includes(s));
  } else if (expostas.length === 1) {
    tipo = 'principal';
    destaques = expostas;
  } else if (atencao.length >= 1) {
    tipo = 'atencao';
    destaques = maiores(atencao, 'A');
    combinadas = atencao.filter(s => !destaques.includes(s));
  } else {
    // Baixa ocorrência em todas as dimensões interpretáveis: reconhecer; não fabricar problema.
    tipo = 'baixa';
  }

  return {
    versao: VERSAO,
    contexto: { papel: contexto.papel, unidade: contexto.unidade, fase: contexto.fase || null },
    tipo,
    empate: destaques.length > 1,
    destaques: destaques.map(s => s.id),
    combinadas: combinadas.map(s => s.id),
    porSituacao,
    totais,
    leituraLimitada: contexto.unidade === 'geral',
  };
}

/** Perfil narrativo (§9.2) de uma situação. */
export function perfilDe(id) {
  const s = SITUACOES.find(x => x.id === id);
  return s ? s.perfil : null;
}

/** Situações que não são destaque mas têm ocorrências ou sinais de atenção declarados.
 *  Exibidas como leitura complementar (perfil completo), depois dos destaques. */
export function complementares(r) {
  const com = new Set(r.combinadas);
  return r.porSituacao
    .filter(s => !r.destaques.includes(s.id) && (com.has(s.id) || ['recorrente', 'sinal', 'atencao'].includes(s.nivel)))
    .map(s => s.id);
}
