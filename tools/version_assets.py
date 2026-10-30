"""Refresh immutable stylesheet/script URLs after editing maintained site/ assets."""
from pathlib import Path
import hashlib,re
root=Path(__file__).resolve().parents[1]/'site'
for p in root.rglob('*.html'):
 if p.name.startswith('__'):continue
 def version(m):
  f=root/m[2].lstrip('/')
  return m[1]+m[2]+'?v='+hashlib.md5(f.read_bytes()).hexdigest()[:8]+m[3] if f.exists() else m.group()
 s=p.read_text();n=re.sub(r'(["\'])(/assets/[^"\'?]+\.(?:js|css))(?:\?v=[^"\']*)?(["\'])',version,s)
 if n!=s:p.write_text(n)
print('Asset versions refreshed.')
