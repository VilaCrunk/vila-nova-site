# Site Vila Nova (VN)

Site institucional/premium da Vila Nova. Projeto novo, construído do zero.

## Stack
Site estático — HTML + CSS + JS vanilla. Sem framework, sem build.

## Estrutura
```
PROJETO VN SITE/
├── index.html        Página principal
├── css/
│   └── style.css     Estilos globais + seções
├── js/
│   └── main.js       Interações
└── assets/
    └── img/          Imagens
```

## Direção visual
Definida seção por seção pelo responsável do projeto. Nada é inventado:
tokens (cores/tipografia) e layout entram conforme a especificação de cada seção.

## Imagens (fluxo de placeholder)
As fotos reais entram depois. Enquanto isso, cada imagem usa um placeholder
temporário (`.img-ph`). Para trocar, basta:
- soltar o arquivo real em `assets/img/` e apontar a `<img>` para ele, ou
- se a `<img>` já apontar para o caminho final, só sobrescrever o arquivo.

## Referência
`Site VN.pdf` (mockup do layout premium).
