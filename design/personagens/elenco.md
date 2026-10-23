# Elenco — Uhuu Rollers (v2, rascunho 1)

Estilo: vetorial "flat" (cores chapadas, uma sombra dura por peça, membros de macarrão, cabeça grande, olhos de feijão
com brilho e bochechas coradas). O rock fica nos detalhes. Todo mundo patina de inline com capacete, joelheira,
cotoveleira e munhequeira. O código é `personagens.js` (`drawChar(g, CAST.<id>, pose, t)`), na mesma escala de unidades
do jogo (bloco = 16).

| Personagem | Papel | Tipo | Altura visual | Cor dominante |
|---|---|---|---|---|
| Gabriel Rock | herói (nome padrão do jogador) | Punk-pop | ~24,5 un | verde-limão + crista laranja no capacete creme |
| Lua Riff | heroína (patinadora) | Grunge-pop | ~24 un | amarelo + capacete menta + pontas rosa |
| Merlin | mentor (professor do treino) | Rock clássico | ~37 un | preto + capacete e patins laranja + bandana azul |

Poses: parado, remada, pulo, grab, powerslide, grind e comemoração (chifrinho do rock; no Merlin, o "V" apontando).

Hitbox: os heróis continuam com a hitbox do baixinho (12×14); o desenho fica ~15% acima da altura antiga (~21 un).

Sons por personagem: pulo, aterrissagem, powerslide e grind já existem no jogo e servem para os três. Faltam um bordão
curto falado para cada um e um "uhuu" de comemoração da Lua.
