'use strict';
// =================================================================== constantes do mundo
const VHV = 114, BGH = 215, PX = BGH / VHV;   // altura visível do jogo (unidades; v4: ~15% mais zoom), altura visível das camadas de fundo, razão entre as escalas
const TS = 16, ROWS = 15, VH = 240, STAGE_C = 217, COLS = STAGE_C + 22, LW = COLS * TS, GOAL_C = STAGE_C + 6, GROUND_Y = 192;   // v6: arena do chefe antes do palco
const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;   // trilha "Pé na Porta" (v5): rock'n'roll em Lá
const HARM = ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'E', 'G', 'D', 'A', 'A', 'G', 'D', 'E', 'E'];
const FONT_UI = '"Barlow Condensed", "Arial Narrow", sans-serif';
const FONT_HAND = '"Permanent Marker", "Comic Sans MS", cursive';
const OUT = '#140f1f';           // contorno dos personagens
const RED = '#ff2a4a';           // emissivo da IA

const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });
const COARSE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const isTouch = COARSE || navigator.maxTouchPoints > 0;
let touchUI = COARSE;            // controles de toque visíveis (aparecem no primeiro toque, somem ao usar teclado)
