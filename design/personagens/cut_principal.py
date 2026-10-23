# Personagem principal: recorta a vista LADO da ficha (referencias/principal-ficha.png) em peças para o esqueleto de perfil.
# A vista olha para a esquerda; espelha para olhar para +x, amplia 2x e trabalha em coordenadas desse recorte (320x784).
import json, os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
im = Image.open('referencias/principal-ficha.png').convert('RGB').crop((630, 60, 790, 452)).transpose(Image.FLIP_LEFT_RIGHT)
im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
a = np.asarray(im).copy(); bg = np.array([243, 236, 229])
lab, n = ndimage.label(np.abs(a.astype(int) - bg).max(2) < 16)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fg = ndimage.binary_fill_holes(ndimage.binary_opening(~np.isin(lab, list(edge)), iterations=1))
# tira a borda branca de "adesivo" da ficha: ela apareceria no meio do corpo quando as peças se mexem
white = (a.min(2) > 196) & ~ndimage.binary_erosion(fg, iterations=6)
fg = ndimage.binary_opening(fg & ~white, iterations=1)
alpha = ndimage.gaussian_filter(fg.astype(float), 0.7)
R = lambda x0, y0, x1, y1: [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
ARM = [(122, 272), (186, 272), (186, 368), (182, 410), (198, 414), (198, 500), (108, 500), (110, 410), (134, 404), (132, 368)]
C = lambda cx, cy, r: ('c', cx, cy, r)
# cada peça é a união de polígonos e círculos; os círculos arredondam o corte nas juntas (joelho e cotovelo)
PARTS = {
  'head': [[(30, 26), (296, 26), (296, 240), (252, 270), (196, 272), (150, 262), (30, 262)]],
  'torso': [[(52, 256), (244, 256), (244, 458), (120, 458), (120, 440), (52, 440)]],
  'uarm': [R(120, 268, 188, 388), C(157, 392, 24)],
  'farm': [R(104, 400, 202, 502), C(157, 394, 26)],
  'thigh': [R(102, 428, 240, 520), C(166, 532, 58)],
  'shin': [R(98, 540, 230, 644), C(166, 536, 50)],
  'skate': [R(80, 612, 280, 772)],
}
PIV = {'torso': [168, 446], 'head': [176, 262], 'uarm': [154, 290], 'farm': [158, 392], 'thigh': [168, 452], 'shin': [165, 535], 'skate': [165, 628]}
def poly_mask(shapes):
    m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m)
    for s in shapes:
        if s[0] == 'c': _, cx, cy, r = s; d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
        else: d.polygon(s, fill=255)
    return np.asarray(m) > 0
arm = poly_mask([ARM]) & fg
out = 'sprites/'; meta = {'parts': {}, 'piv': PIV, 'ground': 761}
for name, poly in PARTS.items():
    pm = poly_mask(poly); rgb = a.copy(); al = alpha * pm
    if name in ('torso', 'thigh'):   # tapa o buraco que o braço deixa quando balança
        hole = ndimage.binary_dilation(arm, iterations=2)
        if name == 'thigh':   # na coxa, a barra da camiseta também vira calça (ela fica por baixo do tronco e aparece ao dobrar)
            yy = np.arange(a.shape[0])[:, None]
            hole = hole | ((a.min(2) > 120) & (yy < 476))
        hole = (hole & pm & fg).astype(np.uint8) * 255
        rgb = cv2.inpaint(rgb, hole, 6, cv2.INPAINT_TELEA)
    if name in ('uarm', 'farm'): al = al * ndimage.gaussian_filter(arm.astype(float), 0.6)
    ys, xs = np.where(al > 0.02); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    img = np.dstack([rgb, (al * 255).astype(np.uint8)])[y0:y1, x0:x1]
    fn = f'principal-{name}.webp'; Image.fromarray(img, 'RGBA').save(out + fn, 'WEBP', quality=92, method=6)
    meta['parts'][name] = {'src': 'sprites/' + fn, 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}
json.dump(meta, open(out + 'principal.json', 'w'))
print('ok')
