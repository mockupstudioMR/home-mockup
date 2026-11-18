import re, sys
def split_rules(css):
    # yields (prelude, body) at top level, keeping @media blocks
    i=0; out=[]
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    while i<len(css):
        j=css.find('{',i)
        if j<0: break
        pre=css[i:j].strip()
        depth=1;k=j+1
        while depth and k<len(css):
            if css[k]=='{': depth+=1
            elif css[k]=='}': depth-=1
            k+=1
        out.append((pre,css[j+1:k-1])); i=k
    return out
def scope_sel(sel, root, base):
    sel=sel.strip()
    if not sel: return None
    if sel in(':root','body','html'): return root
    if sel.startswith('body ') : sel=sel[5:]
    if sel.startswith('.app'): return root+sel[4:]
    if sel=='*': return f'{base} *'
    return f'{base} {sel}'
def scope(css, root, base):
    out=[]
    for pre,body in split_rules(css):
        if pre.startswith('@media') or pre.startswith('@supports'):
            out.append(pre+'{'+scope(body,root,base)+'}')
        elif pre.startswith('@'):
            out.append(pre+'{'+body+'}')
        else:
            sels=[scope_sel(s,root,base) for s in pre.split(',')]
            sels=[s for s in sels if s]
            if pre.strip()=='body' and body.strip()=='margin:0': continue
            out.append(','.join(sels)+'{'+body+'}')
    return '\n'.join(out)
if __name__=='__main__':
    print(scope(open(sys.argv[1]).read(), sys.argv[2], sys.argv[3]))
