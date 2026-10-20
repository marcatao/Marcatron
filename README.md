# Marcatron

Jogo de plataforma de patins (fase 1-1) desenhado em canvas.

## Estrutura

- `index.html`: a página (marcação, fontes e a ordem dos scripts).
- `css/`: `base.css` (reset) e `style.css` (layout, botões de toque e caixa do nome).
- `js/`: o código do jogo, um arquivo por seção, carregados em ordem numérica (`01-constantes.js` … `21-render.js`;
  `19-treino.js` é o treino do Merlin e `20-ladeira.js`, a ladeira da Igreja Matriz).
  Todos compartilham o escopo global, então a ordem no `index.html` importa.
- `audio/`: trilhas em camadas (`.mp3`) e efeitos sonoros (`.wav`).

Não há pasta de imagens: toda a arte (herói, inimigos, cenário, blocos) é desenhada por código nos scripts.

## Rodando localmente

Sirva a pasta por HTTP (o áudio é carregado via `fetch`):

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```
