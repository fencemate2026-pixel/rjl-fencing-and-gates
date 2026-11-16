from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET
import json, os, time

origin = os.environ['ARTICLE_ORIGIN']
path = '/blogs/fencing-sloping-block-melbourne'
canonical = 'https://www.rjlfencingandgates.com.au/blogs/fencing-sloping-block-melbourne'
title = 'Fencing a sloping block in Melbourne'
class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.heading = []
        self.active_heading = False
        self.canonical = None
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'h1':
            self.active_heading = True
        if tag == 'a':
            self.links.append(values.get('href'))
        if tag == 'link' and values.get('rel') == 'canonical':
            self.canonical = values.get('href')
    def handle_endtag(self, tag):
        if tag == 'h1':
            self.active_heading = False
    def handle_data(self, data):
        if self.active_heading:
            self.heading.append(data)

def get(route):
    with urlopen(Request(origin + route, headers={'User-Agent': 'RJL publication check'}), timeout=12) as response:
        if response.status != 200 or not response.url.startswith(origin + '/'):
            raise RuntimeError(f'Unexpected response for {route}: {response.status} {response.url}')
        return response.read().decode()

def check():
    with ThreadPoolExecutor() as pool:
        page, listing, home, sitemap, rss = pool.map(get, [path,'/blogs','/','/sitemap.xml','/blog-feed.xml'])
    post = Page(page)
    assert title == ''.join(post.heading).strip()
    assert post.canonical == canonical
    assert 'Checklist before requesting a quote' in page and '/contact-us' in post.links
    assert path in Page(listing).links and title in listing
    assert path in Page(home).links and 'design-launch-title' in home
    assert canonical in [item.text for item in ET.fromstring(sitemap).findall('{*}url/{*}loc')]
    assert canonical in [item.text for item in ET.fromstring(rss).findall('./channel/item/link')]
    print('Verified public article heading and canonical, visible listing and homepage links, 3D promotion, RSS and sitemap.')

for attempt in range(12):
    try:
        check()
        break
    except Exception as error:
        if attempt == 11:
            raise
        print(f'Waiting for publish: {error}')
        time.sleep(8)
