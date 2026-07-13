# PROJETO VN SITE — estado do projeto (handoff)

Site institucional estático da **Vila Nova** (planejamento e controle de obras).
Direção visual escura/premium (preto + âmbar/cobre) com seções claras (ivory) intercaladas.

## Stack e arquivos
- HTML/CSS/JS vanilla, sem build.
- `index.html` (única página) · `css/style.css` (tudo) · `js/main.js` · `assets/img/`.
- Git: um commit por etapa. Ver histórico: `git log --oneline`.

## Como visualizar
- Servir local: `python -m http.server 8137` (na raiz) → abrir `http://127.0.0.1:8137`.
- **O preview embutido do Claude NÃO pinta pixels** (screenshots travam; transições/IO/lazy não rodam).
  Verifique layout por **geometria/getComputedStyle via JS**, ou peça pro usuário olhar no navegador dele.
- **CSS e JS ficam cacheados no preview** — force refetch trocando o `href` do stylesheet com `?v=timestamp`, ou o usuário dá Ctrl+F5.

## Design tokens (`:root` em style.css)
- Escuro: `--page #08090b`, `--amber #d69a4e`, `--amber-bright #e7ac60`, `--offwhite`, `--warm-gray`.
- Claro (seções ivory): `--ivory #f3efe6`, `--charcoal`, `--charcoal-soft`, `--amber-deep #9c6a1c`.
- Fontes: **Newsreader** (display/serif) + **Hanken Grotesk** (corpo/UI). `--maxw 1280`, `--gutter`.

## Seções (todas implementadas, header→footer)
Header (barra flutuante) · Hero (imagem `Hero-obra.png` + régua) · Sobre · **O que fazemos** (cápsula escura + carrossel de 6 cards) · Segmentos (mosaico, imgs `Edificacoes/Logistica/Infraestrutura/Complexas.png`) · Logos · Método (timeline, `metodo-background.png`) · Diagnóstico (`diagnostico-background.png`) · CTA final · Footer (logo `logo-modelo4-trim.png`).

## Fluxo de imagens
- Imagens grandes tratadas ficam em `assets/img/`. Ao receber JPG com fundo, remover fundo (Pillow, chave de luminância) e recortar padding → salvar `*-trim.png`.
- Fundo da cápsula "O que fazemos" = `.cap-photo` via `--services-photo` (fazemos-background.png).

## TAREFA CONCLUÍDA (cards "O que fazemos")
Cards 02–06 do carrossel preenchidos com fotos. Fotos copiadas para nomes sem espaço
(`assets/img/card-02.png` … `card-06.png`) e apontadas via `--card-photo` nas classes
`.svc-2`…`.svc-6` (base do card, `.svc-media` com `cover` + overlay escuro).
Cards 02–06 crescem para **243×442** e ficam **todos do mesmo tamanho**; **card 01**
(`.svc-card--hero`) permanece com o mini-gráfico CSS e **não cresce**.
Obs.: os PNGs originais com espaço/`01 gestao prazo.png` continuam na pasta (não usados pelo site).

## Pendências finais
- Converter PNGs pesados (~1–3 MB cada) para **WebP** (hero, segmentos, método, diagnóstico, cápsula, e os `card-02..06.png`).
- Conectar **WhatsApp/telefone e e-mail reais** nos botões (hoje placeholders `#`).
- Revisão final de consistência.
