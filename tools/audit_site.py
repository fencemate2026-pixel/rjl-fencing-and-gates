"""Validate maintained static pages without network requests or form submissions."""
from collections import Counter, defaultdict, deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import argparse, hashlib, json, re, sys, tomllib
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--file-manifest', type=Path, help='Verified GitHub tree for assets omitted from a local source mirror')
args = parser.parse_args()
ROOT = args.root.resolve()
SITE = ROOT / 'site'
known = set()
if args.file_manifest:
    known = {x['path'][5:] for x in json.loads(args.file_manifest.read_text())['tree'] if x['type'] == 'blob' and x['path'].startswith('site/')}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]; self.assets=[]; self.images=[]; self.meta={}; self.canonicals=[]; self.h1=0; self.main=0; self.schemas=[]; self.current=None; self.title=''; self.in_title=False; self.visible=[]; self.hidden=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='h1': self.h1+=1
        if tag=='main': self.main+=1
        if tag=='a' and a.get('href'): self.links.append(a['href'])
        if tag in ['img','script','source'] and a.get('src'): self.assets.append(a['src'])
        if tag=='video' and a.get('poster'): self.assets.append(a['poster'])
        if tag=='link' and a.get('href') and a.get('rel') in ['stylesheet','preload','icon','manifest','apple-touch-icon']: self.assets.append(a['href'])
        if tag=='img': self.images.append(a)
        if tag=='meta' and a.get('name'): self.meta[a['name'].lower()]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical': self.canonicals.append(a.get('href',''))
        if tag=='title': self.in_title=True
        if tag in ['script','style']: self.hidden+=1
        if tag=='script' and a.get('type')=='application/ld+json': self.current=''
    def handle_endtag(self, tag):
        if tag=='title': self.in_title=False
        if tag=='script' and self.current is not None: self.schemas.append(self.current); self.current=None
        if tag in ['script','style']: self.hidden=max(0,self.hidden-1)
    def handle_data(self, value):
        if self.in_title: self.title+=value
        if self.current is not None: self.current+=value
        if not self.hidden: self.visible.append(value)

def route(path):
    value='/' + path.relative_to(SITE).as_posix().removesuffix('.html')
    return '/' if value=='/index' else value

errors=[]; pages={}; routes={}
for path in SITE.rglob('*.html'):
    raw=path.read_text()
    if not re.search(r'<html\b',raw,re.I): continue
    page=Page(); page.feed(raw); pages[path]=page; routes[route(path)]=path
    def check(ok, message):
        if not ok: errors.append(f'{path.relative_to(SITE)}: {message}')
    check(page.h1==1 or 'noindex' in page.meta.get('robots',''),'expected one H1 on indexable page')
    check(page.main==1,'expected one main landmark')
    check(bool(page.title.strip()),'missing title')
    check(bool(page.meta.get('description')),'missing description')
    check(not [k for k,n in Counter(page.ids).items() if n>1],'duplicate IDs')
    visible=' '.join(page.visible)
    check(not re.search(r'\bVBA\s*(?:registered|registration)|Registered capability|Victorian Building Authority registration',visible,re.I),'unverified VBA registration claim')
    for schema in page.schemas:
        try: json.loads(schema)
        except ValueError: check(False,'invalid JSON-LD')
    for image in page.images:
        check('alt' in image,'image missing alt')
        check(not image.get('src') or 'width' in image and 'height' in image,'image missing intrinsic dimensions')
    for src in page.assets:
        u=urlsplit(src)
        if u.scheme or u.netloc or not u.path.startswith('/'): continue
        rel=unquote(u.path).lstrip('/'); asset=SITE/rel
        check(asset.is_file() or rel in known,f'missing asset {u.path}')
        if asset.is_file() and asset.parent==SITE/'assets' and asset.suffix in ['.js','.css'] and u.query.startswith('v='):
            value=u.query[2:]
            check(any(getattr(hashlib,alg)(asset.read_bytes()).hexdigest().startswith(value) for alg in ['md5','sha1','sha256']),f'stale asset version {u.path}')

sitemap=ET.parse(SITE/'sitemap.xml')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=sitemap.findall('s:url/s:loc',ns)
origin=urlsplit(urls[0].text); host=origin.netloc
canonical_groups=defaultdict(list); graph=defaultdict(set)
listed=set()
for loc in urls:
    url=loc.text; u=urlsplit(url); r=u.path.rstrip('/') or '/'; listed.add(r)
    path=routes.get(r)
    if not path: errors.append(f'sitemap: unresolved page {url}'); continue
    p=pages[path]; expected=urljoin(url,'/') if not u.path else url
    if p.canonicals!=[expected]: errors.append(f'{path.relative_to(SITE)}: canonical differs from sitemap ({p.canonicals})')
    if 'noindex' in p.meta.get('robots',''): errors.append(f'sitemap: noindex page {url}')
    canonical_groups[p.title].append(r)
for title,rs in canonical_groups.items():
    if len(rs)>1: errors.append(f'duplicate page title: {title}')
redirects=tomllib.loads((ROOT/'netlify.toml').read_text()).get('redirects',[])
aliases={x['from']:x['to'] for x in redirects if '*' not in x.get('from','') and x.get('status') in [301,302]}
for path,p in pages.items():
    for href in p.links:
        u=urlsplit(urljoin('https://'+host+route(path),href))
        if u.scheme not in ['http','https'] or u.netloc!=host: continue
        r=unquote(u.path).rstrip('/') or '/'
        if r.endswith('.html'): r=r[:-5]
        if r=='/index': r='/'
        r=urlsplit(aliases.get(r,r)).path
        dest=routes.get(r)
        if dest:
            graph[route(path)].add(r)
            if u.fragment and u.fragment not in pages[dest].ids: errors.append(f'{path.relative_to(SITE)}: broken anchor {href}')
        else:
            rel=unquote(u.path).lstrip('/')
            if not (SITE/rel).is_file() and rel not in known: errors.append(f'{path.relative_to(SITE)}: unresolved link {href}')
seen=set();q=deque(['/'])
while q:
    r=q.popleft()
    if r in seen: continue
    seen.add(r);q.extend(graph[r]-seen)
for r in sorted(listed-seen): errors.append(f'orphan sitemap page: {r}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages; {len(urls)} sitemap URLs; metadata, JSON-LD, assets, cache versions, links, anchors, discoverability and registration claims.')
