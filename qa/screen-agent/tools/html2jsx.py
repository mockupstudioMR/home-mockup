import sys, re, os, json
from bs4 import BeautifulSoup, NavigableString, Comment, Tag
VOID={'img','input','br','hr','meta','link','source','col','area'}
ATTR={'class':'className','for':'htmlFor','stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin',
 'fill-rule':'fillRule','clip-rule':'clipRule','viewbox':'viewBox','tabindex':'tabIndex','readonly':'readOnly','maxlength':'maxLength',
 'stroke-dasharray':'strokeDasharray','stop-color':'stopColor','stop-opacity':'stopOpacity','font-size':'fontSize','font-weight':'fontWeight',
 'text-anchor':'textAnchor','dominant-baseline':'dominantBaseline','stroke-opacity':'strokeOpacity','fill-opacity':'fillOpacity','letter-spacing':'letterSpacing',
 'font-family':'fontFamily','colspan':'colSpan','rowspan':'rowSpan','autocomplete':'autoComplete','srcset':'srcSet','crossorigin':'crossOrigin','preserveaspectratio':'preserveAspectRatio',
 'stroke-dashoffset':'strokeDashoffset','marker-end':'markerEnd','vector-effect':'vectorEffect','paint-order':'paintOrder','xlink:href':'xlinkHref','gradientunits':'gradientUnits','patternunits':'patternUnits'}
def camel(p): 
    p=p.strip()
    if p.startswith('--'): return json.dumps(p)
    return re.sub(r'-([a-z])',lambda m:m.group(1).upper(),p)
def style_obj(s):
    out=[]
    for decl in s.split(';'):
        if ':' not in decl: continue
        k,v=decl.split(':',1); k=k.strip(); v=v.strip()
        if not k: continue
        out.append(f'{camel(k)}: {json.dumps(v)}')
    return '{{ '+', '.join(out)+' }}'
def text(s):
    s=str(s)
    if not s.strip(): return ' ' if s else ''
    s=re.sub(r'\s+',' ',s)
    return s.replace('{','{"{"}').replace('}','{"}"}').replace('<','&lt;').replace('>','&gt;')
def emit(el,ind=0):
    pad='  '*ind
    if isinstance(el,Comment): return ''
    if isinstance(el,NavigableString):
        t=text(el); return t if t.strip() else ''
    name=el.name
    attrs=[]
    for k,v in el.attrs.items():
        if isinstance(v,list): v=' '.join(v)
        kk=ATTR.get(k.lower(),k)
        if k=='style': attrs.append(f'style={style_obj(v)}'); continue
        if k.startswith('on'): continue
        if k=='href' and v.endswith('.dc.html'): attrs.append(f'data-to="{v[:-8]}"'); kk='href'; v='#'
        if v=='' and k in('checked','disabled','selected','readonly','hidden','open'): attrs.append(kk); continue
        if k=='checked': attrs.append('defaultChecked'); continue
        if k=='value' and name in('input','textarea'): attrs.append(f'defaultValue={json.dumps(v)}'); continue
        if k=='selected': continue
        attrs.append(f'{kk}={json.dumps(v)}')
    a=(' '+' '.join(attrs)) if attrs else ''
    if name in VOID: return f'<{name}{a} />'
    kids=[emit(c,ind+1) for c in el.children]
    kids=[k for k in kids if k!='']
    if name=='select':
        pass
    if not kids: return f'<{name}{a}></{name}>'
    inner=''.join(kids)
    if len(inner)<90 and '\n' not in inner: return f'<{name}{a}>{inner}</{name}>'
    body='\n'.join(pad+'  '+k.strip() for k in kids)
    return f'<{name}{a}>\n{body}\n{pad}</{name}>'
src=sys.argv[1]; out=sys.argv[2]
soup=BeautifulSoup(open(src).read(),'html.parser')
css='\n'.join(s.get_text() for s in soup.select('helmet style'))
app=soup.select_one('.app')
board=os.path.basename(src).replace('.dc.html','')
open(os.path.join(out,board+'.jsx.txt'),'w').write(emit(app))
open(os.path.join(out,board+'.css'),'w').write(css)
