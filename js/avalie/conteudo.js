/* =============================================================
   AVALIE SUA OBRA — conteúdo do instrumento (versão 1.0)
   Fonte única: RETROFIT/AUTODIAGNOSTICO_PROJETO_OFICIAL.docx
   (Projeto oficial 1.0, 11/11/2026) e Retrofit_Copy_Site_Implementacao_Final (A07).

   Regra: todo texto abaixo vem literalmente do documento oficial,
   com a seção de origem indicada. Textos marcados [UI] são rótulos
   de interface (botões, progresso, avisos de navegação) que não
   existem no documento e precisam de validação da Marina.
   ============================================================= */

export const VERSAO = 'autodiagnostico-1.0';

/* §8.2 / §6 — escala única das 15 perguntas */
export const RESPOSTAS = [
  { id: 'F', rotulo: 'Frequentemente' },
  { id: 'A', rotulo: 'Às vezes' },
  { id: 'R', rotulo: 'Raramente ou nunca' },
  { id: 'N', rotulo: 'Não sei avaliar' },
];

/* §7 — pilares oficiais do Método VN (camada técnica; não é linguagem de abertura) */
export const PILARES = {
  RE: { nome: 'Responsabilidade Estruturada', capacidade: 'Clareza de compromissos, responsáveis e decisões' },
  ME: { nome: 'Método Executivo', capacidade: 'Sustentação da estratégia, recursos e condições de execução' },
  AA: { nome: 'Alerta Antecipado e Visibilidade Executiva', capacidade: 'Percepção antecipada, tendências e decisões oportunas' },
  II: { nome: 'Interfaces Integradas', capacidade: 'Dependências, liberações e coordenação entre áreas' },
  RM: { nome: 'Registro e Memória de Gestão', capacidade: 'Confiabilidade, rastreabilidade e memória decisória' },
};

/* §5, §6, §9.2 e Anexo A — cinco situações, 15 perguntas, perfis narrativos */
export const SITUACOES = [
  {
    id: 'S1',
    nome: 'Compromissos que não se sustentam',
    pergunta: 'Por que datas e metas precisam ser revistas?',
    perfil: {
      titulo: 'Compromissos sob pressão',
      relatada: 'Datas e metas assumidas sem sustentação ou frequentemente revistas.',
      consequencia: 'Risco de assumir compromissos sem condições verificadas.',
      movimento: 'Confrontar metas com estratégia executiva, recursos, dependências e decisões necessárias.',
    },
    questoes: [
      { id: 'Q01', pilar: 'ME', texto: 'Com que frequência sua obra assume datas ou metas sem ter clareza se existem equipes, recursos e condições suficientes para cumpri-las?' },
      { id: 'Q02', pilar: 'ME', texto: 'Com que frequência os compromissos de prazo precisam ser revistos porque a forma de executar não foi suficientemente definida antes?' },
      { id: 'Q03', pilar: 'RE', texto: 'Quando uma data importante deixa de ser cumprida, com que frequência fica difícil identificar qual condição ou decisão provocou o desvio?' },
    ],
  },
  {
    id: 'S2',
    nome: 'Problemas que chegam tarde',
    pergunta: 'Por que descobrimos ameaças quando é difícil reagir?',
    perfil: {
      titulo: 'Gestão no modo reação',
      relatada: 'Surpresas, urgências recorrentes e riscos tratados tardiamente.',
      consequencia: 'Perda de alternativas de resposta antes da materialização dos impactos.',
      movimento: 'Criar visibilidade antecipada de riscos, restrições, suprimentos e marcos.',
    },
    questoes: [
      { id: 'Q04', pilar: 'AA', texto: 'Com que frequência problemas que ameaçam a obra só ganham atenção da gestão quando já provocaram atraso ou perda de produção?' },
      { id: 'Q05', pilar: 'AA', texto: 'Com que frequência a liderança é surpreendida por mudanças nas previsões de entrega que não haviam sido sinalizadas antecipadamente?' },
      { id: 'Q06', pilar: 'AA', texto: 'Com que frequência sua equipe precisa tomar decisões urgentes porque riscos conhecidos não foram tratados no momento adequado?' },
    ],
  },
  {
    id: 'S3',
    nome: 'Equipes impedidas de produzir',
    pergunta: 'Por que a produção não consegue manter continuidade?',
    perfil: {
      titulo: 'Produção sem continuidade',
      relatada: 'Bloqueios, liberações pendentes e mobilização sem condições de produzir.',
      consequencia: 'Perda de produtividade e uso ineficiente de recursos mobilizados.',
      movimento: 'Verificar pré-condições de execução e coordenar sua disponibilização antes da abertura das frentes.',
    },
    questoes: [
      { id: 'Q07', pilar: 'II', texto: 'Com que frequência equipes deixam de produzir conforme previsto porque projetos, materiais, equipamentos ou liberações não estão disponíveis?' },
      { id: 'Q08', pilar: 'ME', texto: 'Com que frequência a obra mobiliza equipes ou inicia frentes sem ter confirmado todas as condições necessárias para dar continuidade aos serviços?' },
      { id: 'Q09', pilar: 'II', texto: 'Com que frequência uma atividade aparentemente concluída não permite iniciar a próxima etapa porque alguma pendência ou aprovação foi esquecida?' },
    ],
  },
  {
    id: 'S4',
    nome: 'Áreas que não se coordenam',
    pergunta: 'Por que as entregas entre áreas falham?',
    perfil: {
      titulo: 'Operação sem coordenação suficiente',
      relatada: 'Dependências entre áreas, pendências prolongadas e compromissos sem encaminhamento.',
      consequencia: 'Conversão de falhas de integração em desvios de execução.',
      movimento: 'Definir responsáveis, prazos e mecanismos de encaminhamento das interfaces críticas.',
    },
    questoes: [
      { id: 'Q10', pilar: 'II', texto: 'Com que frequência uma área descobre tarde que precisava receber uma entrega ou decisão de outra área para manter a programação?' },
      { id: 'Q11', pilar: 'RE', texto: 'Com que frequência as pendências se prolongam porque não está claro quem deve resolvê-las ou quem pode tomar a decisão necessária?' },
      { id: 'Q12', pilar: 'RE', texto: 'Com que frequência um compromisso assumido em reunião deixa de ser cumprido sem que exista um acompanhamento capaz de provocar uma resposta?' },
    ],
  },
  {
    id: 'S5',
    nome: 'Decisões sem informação confiável',
    pergunta: 'Por que não sabemos com segurança onde estamos?',
    perfil: {
      titulo: 'Decisões com visibilidade limitada',
      relatada: 'Informações conflitantes, histórico insuficiente e necessidade de apuração paralela.',
      consequencia: 'Decisões baseadas em dados incompletos, inconsistentes ou tardios.',
      movimento: 'Fortalecer a confiabilidade da informação e a rastreabilidade das decisões.',
    },
    questoes: [
      { id: 'Q13', pilar: 'RM', texto: 'Com que frequência os números apresentados sobre a situação da obra entram em conflito com aquilo que a equipe observa no campo?' },
      { id: 'Q14', pilar: 'RM', texto: 'Quando um problema altera a programação, com que frequência faltam registros que permitam compreender o que aconteceu e por que as decisões foram tomadas?' },
      { id: 'Q15', pilar: 'RM', texto: 'Com que frequência a liderança precisa buscar informações fora dos controles oficiais para entender a situação real da obra e decidir o que fazer?' },
    ],
  },
];

/* §3.3 / §11.2 — contextualização prévia */
export const CONTEXTO = {
  papel: {
    rotulo: 'Qual seu papel?',
    obrigatorio: true,
    opcoes: [
      { id: 'decisor', rotulo: 'Decisor/proprietário' },
      { id: 'diretoria', rotulo: 'Diretoria/gestão de contratos' },
      { id: 'gerente', rotulo: 'Gerente de obra' },
      { id: 'tecnico', rotulo: 'Planejamento/engenharia/produção' },
      { id: 'outro', rotulo: 'Outro' },
    ],
  },
  unidade: {
    rotulo: 'Sobre qual contexto responderá?',
    obrigatorio: true,
    opcoes: [
      { id: 'obra', rotulo: 'Uma obra específica' },
      { id: 'conjunto', rotulo: 'Conjunto de obras que acompanha' },
      { id: 'geral', rotulo: 'Experiência geral (leitura mais limitada)' },
    ],
  },
  fase: {
    rotulo: 'Qual a fase da obra?',
    obrigatorio: false,
    opcoes: [
      { id: 'pre', rotulo: 'Pré-mobilização' },
      { id: 'inicio', rotulo: 'Início' },
      { id: 'execucao', rotulo: 'Execução' },
      { id: 'conclusao', rotulo: 'Conclusão' },
      { id: 'varia', rotulo: 'Não sei/varia' },
    ],
  },
};

/* §8.3 — rótulos comunicacionais por situação */
export const ROTULOS_NIVEL = {
  baixa: 'Baixa recorrência declarada',
  atencao: 'Atenção à recorrência',
  sinal: 'Sinal relevante de exposição',
  recorrente: 'Exposição recorrente na dimensão',
  insuficiente: 'Leitura insuficiente / parcial',
};

/* §9.3, §9.4, §9.5 — resultados especiais */
export const RESULTADOS_ESPECIAIS = {
  baixa: {
    titulo: 'Sua operação relata baixa ocorrência das situações avaliadas.',
    texto: 'Suas respostas indicam que os problemas apresentados não são recorrentes na operação considerada. Essa percepção é positiva, mas não constitui comprovação de que todos os riscos estejam controlados. Vale verificar se os mecanismos atuais permanecem eficazes em mudanças de equipe, aumento de complexidade e momentos de pressão.',
  },
  multiplas: {
    titulo: 'Problemas em diferentes partes da operação podem estar se reforçando.',
    texto: 'Suas respostas indicam ocorrências recorrentes em mais de uma dimensão. Uma liberação tardia pode afetar a produção, deslocar compromissos e exigir decisões adicionais. Compreender a conexão entre essas situações é importante para identificar prioridades de intervenção.',
  },
  insuficiente: {
    titulo: 'Ainda não há informação suficiente para uma leitura consistente.',
    texto: "Parte relevante das situações foi marcada como 'Não sei avaliar'. Isso impede interpretar com segurança a condição da operação. O primeiro movimento é identificar fontes e responsáveis pelas informações necessárias para compreender o que de fato acontece.",
  },
};

/* Textos de abertura, instrução, ressalva e conversão */
export const TEXTOS = {
  instrucao: 'Pense em uma obra que você conhece bem, preferencialmente aquela pela qual possui responsabilidade direta. Responda considerando o que realmente acontece na rotina, não apenas o que está previsto nos procedimentos da empresa.', // §6
  ressalva: 'Esta leitura é indicativa, construída a partir de respostas autodeclaradas. Não substitui avaliação profissional da obra.', // §9.6
  aviso: 'Esta ferramenta apresenta uma leitura indicativa de situações relatadas pelo respondente. Suas respostas não são verificadas por documentos ou observação de campo, e o resultado não constitui diagnóstico técnico, auditoria, garantia de desempenho ou determinação de causas e responsabilidades. A avaliação especializada de uma obra exige análise de evidências e conhecimento de seu contexto.', // Anexo B
  conversaoDecisor: 'Problemas recorrentes não deveriam continuar surpreendendo sua gestão. A VN Consultoria ajuda organizações a compreender e tratar fragilidades que comprometem a coordenação da execução, a previsibilidade e a proteção dos resultados dos empreendimentos. Quer conversar sobre o que está acontecendo na sua obra?', // §10.1
  ctaDecisor: 'Conversar sobre minha obra', // §10.1
  conversaoTecnico: 'Quer ampliar sua capacidade de antecipar problemas e apoiar decisões na obra? Conheça os conteúdos e treinamentos da VN e desenvolva uma visão de gestão que vai além da atualização de cronogramas.', // §10.2
  ctaTecnico: 'Conhecer conteúdos e treinamentos', // §10.2
};

/* [UI] Rótulos de interface — não constam do documento; validar com a Marina */
export const UI = {
  comecar: 'Começar',
  voltar: 'Voltar',
  avancar: 'Avançar',
  revisar: 'Revisar respostas',
  verResultado: 'Ver resultado',
  editar: 'Alterar',
  refazer: 'Refazer a avaliação',
  fechar: 'Fechar',
  etapaContexto: 'Contexto',
  etapaRevisao: 'Revisão',
  opcional: 'opcional',
  situacao: 'Situação',
  de: 'de',
  faltaResponder: 'Responda às três perguntas para avançar. "Não sei avaliar" é uma resposta válida.',
  faltaContexto: 'Selecione seu papel e o contexto da resposta para avançar.',
  mapaTitulo: 'Mapa das cinco situações',
  maiorAtencao: 'Situação de maior atenção',
  maioresAtencoes: 'Situações de maior atenção',
  oQueIndica: 'O que suas respostas indicam',
  oQuePodeEstar: 'O que pode estar acontecendo',
  capacidade: 'Capacidade de gestão a investigar',
  oQueCompromete: 'O que isso pode comprometer',
  primeiroMovimento: 'Primeiro movimento recomendado',
  coberturaParcial: 'Parte das respostas desta situação foi marcada como "Não sei avaliar".',
  geralLimitada: 'Você respondeu com base na sua experiência geral, o que torna a leitura mais limitada.',
  contagem: { F: 'frequentes', A: 'ocasionais', R: 'baixa ocorrência', N: 'sem avaliação' },
  receberCopia: 'Receber uma cópia do resultado por e-mail',
  enviarCopia: 'Enviar cópia',
  complementares: 'Também com ocorrências declaradas', // [UI] reaproveita a nota anterior
  copiaEnviada: 'Pronto. A cópia do resultado foi enviada para o seu e-mail.',
  copiaErro: 'Não foi possível enviar agora. Tente novamente em instantes.',
  consentEnvio: 'Autorizo o uso do meu e-mail para receber esta cópia do resultado, conforme a Política de Privacidade.',
  consentMarketing: 'Quero receber conteúdos e comunicações da VN Consultoria (opcional).',
  imprimir: 'Imprimir ou salvar em PDF',
};
