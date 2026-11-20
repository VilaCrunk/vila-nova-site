# Site Vila Nova (VN)

Site institucional/premium da Vila Nova. Projeto novo, construído do zero.

## Stack
Site estático (HTML + CSS + JS vanilla, sem build) com funções serverless na Vercel (`api/`)
para o formulário de contato e o quiz "Avalie sua obra" (Neon + Resend).

## Estrutura
```
index.html, o-que-fazemos.html, segmentos.html, treinamentos.html,
politica-de-privacidade.html, termos-de-uso.html, 404.html
css/style.css          Estilos globais + seções
js/main.js             Menu, carrossel, contato, banner de cookies
js/avalie/             Quiz: conteudo.js, motor.js, app.js
api/                   contato.js, avaliacao.js, _lib/util.js
assets/img, assets/fonts
tests/                 npm test
vercel.json            URLs limpas, redirects, headers de segurança
```

## Direção visual
Definida seção por seção pelo responsável do projeto. Nada é inventado:
tokens (cores/tipografia) e layout entram conforme a especificação de cada seção.

## Imagens
Usar WebP otimizado em `assets/img/` (nomes sem espaço).

## Referência
`Site VN.pdf` (mockup do layout premium).
