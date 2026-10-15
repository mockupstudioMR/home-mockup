import sys
from PIL import Image
area,b=sys.argv[1],sys.argv[2]; y0=int(sys.argv[3]) if len(sys.argv)>3 else 0; hh=int(sys.argv[4]) if len(sys.argv)>4 else 1000
a=Image.open(f'designs/{area}/{b}.jpg').convert('RGB'); c=Image.open(f'out/app/{area}-{b}.png').convert('RGB')
A=a.crop((0,y0,1440,y0+hh)); C=c.crop((0,y0,1440,y0+hh))
o=Image.new('RGB',(1440,hh//2)); o.paste(A.resize((720,hh//2)),(0,0)); o.paste(C.resize((720,hh//2)),(720,0)); o.save('out/cmp.jpg',quality=80)
print(a.size,c.size)
