#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json,sys,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1]
config=json.loads((root/'docs/search-publishing.json').read_text())
urls=sys.argv[1:]
if not urls or len(urls)>10000:raise SystemExit('Provide 1–10000 changed canonical URLs.')
origin='https://'+config['host']
for value in urls:
    p=urlparse(value)
    if p.scheme!='https' or p.netloc!=config['host'] or p.query or p.fragment:raise SystemExit('Only canonical URLs on this site are allowed.')
key=(root/'site'/config['indexnow_key_file']).read_text().strip()
key_url=origin+'/'+config['indexnow_key_file']
with urllib.request.urlopen(key_url,timeout=20) as response:
    if response.status!=200 or response.read().decode().strip()!=key:raise SystemExit('Live verification file is not ready.')
payload={'host':config['host'],'key':key,'keyLocation':key_url,'urlList':list(dict.fromkeys(urls))}
request=urllib.request.Request('https://api.indexnow.org/indexnow',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json; charset=utf-8'},method='POST')
try:
    with urllib.request.urlopen(request,timeout=30) as response:print('IndexNow notification response:',response.status,'for',len(payload['urlList']),'changed URLs. This does not guarantee indexing or rankings.')
except urllib.error.HTTPError as error:raise SystemExit('IndexNow notification not accepted: HTTP '+str(error.code))
