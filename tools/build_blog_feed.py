#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime,date,time
from zoneinfo import ZoneInfo
from email.utils import format_datetime
import html,json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
CONFIG=json.loads((ROOT/'docs/search-publishing.json').read_text())
ORIGIN='https://'+CONFIG['host']
def build():
    index=(SITE/CONFIG['blog_index']).read_text()
    linked={html.unescape(v) for v in re.findall(r'href="([^"]+)"',index)}
    rows=[]
    for p in (SITE/CONFIG['blog_directory']).glob('*.html'):
        for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>',p.read_text(),re.S):
            data=json.loads(raw)
            if data.get('@type') not in ['Article','BlogPosting']:continue
            url=data.get('mainEntityOfPage')
            if isinstance(url,dict):url=url.get('@id')
            if not isinstance(url,str) or not url.startswith(ORIGIN+'/'):continue
            if url.removeprefix(ORIGIN) not in linked and url not in linked:continue
            published=data.get('datePublished','')[:10]
            d=date.fromisoformat(published)
            if d>date.today():continue
            rows.append(dict(url=url,title=data['headline'],description=data['description'],published=published))
    rows=sorted({r['url']:r for r in rows}.values(),key=lambda r:r['published'],reverse=True)
    if not rows:raise ValueError('No published, linked articles found')
    ET.register_namespace('atom','http://www.w3.org/2005/Atom')
    root=ET.Element('rss',{'version':'2.0'});channel=ET.SubElement(root,'channel')
    for key,value in [('title',CONFIG['feed_title']),('link',ORIGIN+CONFIG['blog_path']),('description',CONFIG['feed_description']),('language','en-au')]:ET.SubElement(channel,key).text=value
    ET.SubElement(channel,'{http://www.w3.org/2005/Atom}link',{'href':ORIGIN+'/blog-feed.xml','rel':'self','type':'application/rss+xml'})
    for row in rows[:30]:
        item=ET.SubElement(channel,'item')
        for key,value in [('title',row['title']),('link',row['url']),('description',row['description'])]:ET.SubElement(item,key).text=value
        ET.SubElement(item,'guid',{'isPermaLink':'true'}).text=row['url']
        dt=datetime.combine(date.fromisoformat(row['published']),time(0),ZoneInfo('Australia/Melbourne'))
        ET.SubElement(item,'pubDate').text=format_datetime(dt)
    ET.indent(root);ET.ElementTree(root).write(SITE/'blog-feed.xml',encoding='utf-8',xml_declaration=True)
    print('Article feed rebuilt:',len(rows),'published articles')
    return rows
if __name__=='__main__':build()
