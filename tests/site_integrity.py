"""Read-only validation of the maintained static site; no network or submissions."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from collections import Counter
import hashlib,json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]/'site'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=[];self.links=[];self.assets=[];self.h1=0;self.main=0;self.images=[];self.forms=[];self.schema=[];self.current=None;self.meta={}
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'id' in a:self.ids.append(a['id'])
  if t=='h1':self.h1+=1
  if t=='main':self.main+=1
  if t=='a' and 'href' in a:self.links.append(a['href'])
  if t in ('img','script','source') and a.get('src'):self.assets.append(a['src'])
  if t=='link' and a.get('href') and a.get('rel') in ['stylesheet','preload','icon','manifest','apple-touch-icon']:self.assets.append(a['href'])
  if t=='img':self.images.append(a)
  if t=='form':self.forms.append(a)
  if t=='meta' and a.get('name'):self.meta[a['name']]=a.get('content','')
  if t=='script' and a.get('type')=='application/ld+json':self.current=''
 def handle_endtag(self,t):
  if t=='script' and self.current is not None:self.schema.append(self.current);self.current=None
 def handle_data(self,s):
  if self.current is not None:self.current+=s
errors=[];pages={}
for p in ROOT.rglob('*.html'):
 if p.name.startswith('__'):continue
 s=p.read_text();d=Page();d.feed(s);pages[p]=d
 def check(ok,msg):
  if not ok:errors.append(f'{p.relative_to(ROOT)}: {msg}')
 check(d.h1==1,'requires one H1');check(d.main==1,'requires one main');check(not [x for x,n in Counter(d.ids).items() if n>1],'duplicate IDs')
 check(bool(re.search(r'<title>.+?</title>',s)),'missing title');check(bool(d.meta.get('description')),'missing meta description')
 check('/assets/audit-improvements.css?v=' in s,'missing shared usability stylesheet')
 for j in d.schema:
  try:json.loads(j)
  except ValueError:check(False,'invalid structured data')
 for a in d.images:
  check('alt' in a,'image lacks alt');check(not a.get('src') or 'width' in a and 'height' in a,'image lacks intrinsic dimensions')
 for src in d.assets:
  u=urlsplit(src)
  if u.scheme or u.netloc or not u.path.startswith('/'):continue
  f=ROOT/unquote(u.path).lstrip('/')
  check(f.exists(),f'missing asset {u.path}')
  if f.suffix in ('.js','.css') and f.parent==ROOT/'assets':check(u.query=='v='+hashlib.md5(f.read_bytes()).hexdigest()[:8],f'stale asset version {u.path}')
 check(not re.search(r'Google Street View|/assets/examples/viz-(?:before|after|open|evening|editor|site)\.',s),'retired example imagery remains')
for p,d in pages.items():
 for href in d.links:
  u=urlsplit(href)
  if u.scheme or u.netloc or not u.path.startswith('/'):continue
  f=ROOT/unquote(u.path).lstrip('/')
  if f==ROOT:f=ROOT/'index.html'
  if not f.exists() and not f.suffix:f=f.with_suffix('.html')
  # Netlify serves selected assets through explicit upstream proxy rules.
  if not f.exists():errors.append(f'{p.relative_to(ROOT)}: unresolved internal link {href}')
  elif u.fragment and f in pages and u.fragment not in pages[f].ids and not (f.name=='fence-designer.html' and u.fragment=='design'):errors.append(f'{p.relative_to(ROOT)}: unresolved anchor {href}')
contact=pages[ROOT/'contact-us.html'];forms=[f for f in contact.forms if f.get('name')=='residential-quote']
assert len(forms)==1 and forms[0].get('data-netlify')=='true' and forms[0].get('method','').upper()=='POST' and forms[0].get('enctype')=='multipart/form-data'
assert 'noindex' in pages[ROOT/'quote-received.html'].meta.get('robots','')
assert 'quote-received' not in (ROOT/'sitemap.xml').read_text()
ET.parse(ROOT/'sitemap.xml')
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages; headings, IDs, local links/assets, image dimensions, cache versions, JSON-LD, form declaration and sitemap.')
