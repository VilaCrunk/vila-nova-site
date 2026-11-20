# PROJETO VN SITE — estado do projeto (handoff)

Site institucional da **VN Consultoria / Vila Nova** (planejamento e governança do prazo em obras).
Direção visual escura/premium (preto + âmbar/cobre) com seções claras (ivory) intercaladas.
Copy: **somente** do documento "Retrofit_Copy_Site_Implementacao_Final" (escrito pela Marina).
Não criar copy por conta própria; microcopy de interface nova deve ser validada.

## Stack e arquivos
- HTML/CSS/JS vanilla, sem build. Funções serverless em `api/` (Vercel, Node ESM).
- Páginas: `index.html`, `o-que-fazemos.html`, `segmentos.html`, `treinamentos.html`,
  `politica-de-privacidade.html`, `termos-de-uso.html`, `404.html`.
  Header, footer e banner de cookies estão **repetidos em todas** — alterar em todas.
- `css/style.css` (tudo; bloco final "RETROFIT VN 2027") · `js/main.js` (menu, carrossel, contato, cookies).
- Quiz "Avalie sua obra": `js/avalie/conteudo.js` (textos do Autodiagnóstico), `motor.js`
  (regras do §8, sem pontuação 0–30), `app.js` (interface).
- `assets/img/*.webp` (já otimizadas), `assets/img/logos/*.webp`, `assets/fonts/*.woff2` (auto-hospedadas).
- Cache-bust: `?v=AAAAMMDD` nos links de CSS/JS — trocar a data ao alterar esses arquivos.
- Git: branch por trabalho + PR; `main` faz deploy automático na Vercel.
- Domínio canônico: `https://vilanovaconsultoria.com` (confirmado; verificado no Resend).

## Backend (Vercel)
- `api/contato.js` — formulário de contato → grava no Neon e envia e-mail via Resend.
- `api/avaliacao.js` — eventos do quiz (só com cookies aceitos), resultado anônimo, cópia por e-mail.
- Variáveis de ambiente: `DATABASE_URL` (Neon, via Vercel Storage), `RESEND_API_KEY`,
  opcionais `CONTACT_TO` (padrão contato@vilanovaconsultoria.com) e `MAIL_FROM`.
  As tabelas são criadas automaticamente na primeira requisição.
- DNS na HostGator; e-mail na Titan — **não mexer nos registros MX**.

## Testes e verificação
- `npm install` e `npm test` (motor do quiz + API com fetch simulado, sem banco).
- Servir local: `python -m http.server 8137` (sem URLs limpas: abrir `/segmentos.html` etc.;
  `/api` não roda local — use `vercel dev` ou simule).
- Desktop aprovado não deve mudar ao mexer no mobile: conferir 1280px e 390px.

## LGPD / cookies
- Banner Aceitar/Rejeitar (`localStorage` `vn-cookies`). Vercel Web Analytics e métricas do quiz
  só carregam com "Aceitar". Link "Preferências de cookies" no rodapé reabre o banner.
- Qualquer novo dado coletado ou fornecedor deve entrar na Política de Privacidade.

## Pendências
- URLs reais das redes sociais no rodapé (`.foot-soc` hoje `href="#"`).
- Possível ganho de performance mobile: subset da fonte Newsreader (~270 KB nas duas variantes).
