import json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from rigcfg import CFG
src='referencias/'
out='sprites/'
import os; os.makedirs(out, exist_ok=True)
meta={}
for i,c in CFG.items():
    a=np.asarray(Image.open(f'{src}{i}.webp').convert('RGB')).astype(int)
    bg=a[3,3]; d=np.abs(a-bg).max(2)
    lab,n=ndimage.label(d<22)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fg=~np.isin(lab,list(edge)); fg=ndimage.binary_opening(fg,iterations=1); fg=ndimage.binary_erosion(fg,iterations=1)
    alpha=ndimage.gaussian_filter(fg.astype(float),0.8)
    rgb=a.astype(np.uint8)
    m={'parts':{}, 'piv':{k:list(v) for k,v in c['piv'].items()}, 'ground':c['ground']}
    for name,poly in c['parts'].items():
        pm=Image.new('L',(1024,1024),0); ImageDraw.Draw(pm).polygon(poly,fill=255)
        pa=(np.asarray(pm)/255.0)*alpha
        ys,xs=np.where(pa>0.02)
        x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        img=np.dstack([rgb,(pa*255).astype(np.uint8)])[y0:y1,x0:x1]
        fn=f'p{i}-{name}.webp'
        Image.fromarray(img,'RGBA').save(out+fn,'WEBP',quality=90,method=6)
        m['parts'][name]={'src':'sprites/'+fn,'x':int(x0),'y':int(y0),'w':int(x1-x0),'h':int(y1-y0)}
    meta[i]=m
open(out+'rig.json','w').write(json.dumps(meta))
print('ok', sum(os.path.getsize(out+f) for f in os.listdir(out))//1024,'KB')
