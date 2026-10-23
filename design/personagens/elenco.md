# Elenco — Uhuu Rollers (v2, rascunho 2)

Estilo: rascunho 2, feito a partir de três referências de patinadores punk (capacete com chamas, óculos de proteção,
brim com spikes e patches, camiseta de banda, cinto com corrente, calça cargo, luva sem dedo e rodas que brilham), nas
proporções do rascunho 1. Vetorial com contorno escuro e uma sombra dura por peça. O código é `personagens.js`
(`drawChar(g, CAST.<id>, pose, t)`), na mesma escala de unidades do jogo (bloco = 16).

| Personagem | Papel | Tipo | Altura visual | Cor dominante |
|---|---|---|---|---|
| Gabriel Rock | herói (nome padrão do jogador) | Punk | ~24,5 un | preto + chamas vermelhas no capacete + rodas vermelhas (ref. 1) |
| Lua Riff | heroína (patinadora) | Punk-grunge | ~24 un | preto e vermelho + chamas laranja + cabelo azul com pontas ciano (ref. 2) |
| Merlin | mentor (professor do treino) | Rock clássico | ~37 un | colete jeans + calça cáqui + chamas e rodas azuis + bandana (ref. 3) |

Poses: parado, remada, pulo, grab, powerslide, grind e comemoração (chifrinho do rock; no Merlin, o "V" apontando).

Hitbox: os heróis continuam com a hitbox do baixinho (12×14); o desenho fica ~15% acima da altura antiga (~21 un).

Sons por personagem: pulo, aterrissagem, powerslide e grind já existem no jogo e servem para os três. Faltam um bordão
curto falado para cada um e um "uhuu" de comemoração da Lua.
