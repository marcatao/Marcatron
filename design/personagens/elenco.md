# Elenco — Uhuu Rollers (v3, rascunho 4)

O **personagem principal** é o da ficha Inline City (`referencias/principal-ficha.png`). A vista LADO foi espelhada
(para olhar para +x), recortada por `cut_principal.py` (gera `sprites/principal-*.webp` e `principal.json`) e é animada
de perfil por `principal.js` (`loadMain()` e `drawMain(g, pose, t, escala)`). O braço e a perna de trás são as mesmas
peças, escurecidas. Altura no jogo: 24 unidades (um bloco e meio).

Os outros patinadores são as próprias ilustrações de referência (`referencias/1.webp`, `2.webp`, `3.webp`), recortadas em
14 peças e animadas por esqueleto (animação de recorte, "cutout").

- `cut.py` + `rigcfg.py`: tiram o fundo, recortam as peças pelos polígonos de `rigcfg.py` e gravam
  `sprites/p<n>-<peça>.webp` e `sprites/rig.json` (posição de cada peça e pivô de cada junta, em pixels da ilustração
  1024×1024). Para refazer: `python3 cut.py` dentro desta pasta (precisa de Pillow, NumPy e SciPy).
- `rig.js`: esqueleto, poses e desenho (`loadRig()` e depois `drawRig(g, id, pose, t, escala)`).
- `index.html`: a prancha de avaliação.

Poses: parado, remada, pulo, grab, powerslide, grind e comemoração. As ilustrações são de frente, então a remada é a
de um patinador visto de frente (empurra para o lado e joga o peso na perna que desliza).

| Peça | Referência | Visual |
|---|---|---|
| Patinador 1 | 1 | capacete preto com chamas vermelhas, óculos, jaqueta de brim preta com spikes, calça cargo oliva, rodas vermelhas |
| Patinador 2 | 2 | capacete com chamas laranja, cabelo azul, colete preto, camiseta vermelha, mochila camuflada, rodas ciano |
| Patinador 3 | 3 | capacete com chamas vermelhas, colete jeans desfiado, camiseta de caveira, calça cargo cáqui, rodas azuis |
