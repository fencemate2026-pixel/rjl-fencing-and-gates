# Serves the built site AS www.rjlfencingandgates.com.au (via request routing)
# and records every GA4 hit, to prove page views and lead events fire.
import asyncio, os, re, json, urllib.parse, mimetypes
from playwright.async_api import async_playwright
ROOT="site"; HOST="https://www.rjlfencingandgates.com.au"
def local(path):
    p=os.path.join(ROOT,path.lstrip('/').split('?')[0]) or ROOT
    if os.path.isdir(p): p=os.path.join(p,'index.html')
    if not os.path.exists(p) and os.path.exists(p+'.html'): p+='.html'
    return p
async def main():
    hits=[]
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        ctx=await b.new_context(viewport={"width":1366,"height":900})
        async def serve(route):
            u=urllib.parse.urlparse(route.request.url); p=local(u.path)
            if os.path.exists(p):
                await route.fulfill(path=p, content_type=mimetypes.guess_type(p)[0] or "text/html")
            else: await route.fulfill(status=404, body="nf")
        await ctx.route(HOST+"/**", serve)
        async def collect(route):
            u=route.request.url; body=route.request.post_data or ""
            for line in ([u]+body.split("\n")):
                m=re.findall(r'(?:^|[&?])en=([^&]+)', line.split('?',1)[-1] if '?' in line else line)
                hits.extend(m)
            await route.fulfill(status=204, body="")
        await ctx.route(re.compile(r"https://[^/]*google-analytics\.com/g/collect.*"), collect)
        pg=await ctx.new_page()
        reqs=[]; pg.on("request",lambda r: ("google" in r.url) and reqs.append(r.url+"\n"+(r.post_data or "")))
        
        await pg.add_init_script("document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^=tel],a[href^=mailto]');if(a)e.preventDefault();});")
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.goto(HOST+"/contact-us", wait_until="load"); await pg.wait_for_timeout(3000)
        await pg.click('.footer a[href^="tel:"]')
        await pg.click('.footer a[href^="mailto:"]')
        await pg.fill("#enquiry-name","Test"); await pg.fill("#enquiry-email","t@example.com"); await pg.fill("#enquiry-message","test")
        await pg.click(".email-enquiry button[type=submit]")
        await pg.click(".chat-launcher")
        await pg.wait_for_timeout(4000)
        await pg.goto(HOST+"/about-rjlfencing-and-gates", wait_until="load"); await pg.wait_for_timeout(3000)
        dl=None
        await b.close()
    ev={}
    hosts=set()
    for u in reqs:
        first,_,body=u.partition("\n")
        q=urllib.parse.urlparse(first); hosts.add(q.netloc)
        if "/g/collect" in q.path:
            d=urllib.parse.parse_qs(q.query); tid=d.get("tid",["?"])[0]
            for e in d.get("en",[]): ev.setdefault(tid,[]).append(e)
            for line in body.split("\n"):
                for e in urllib.parse.parse_qs(line).get("en",[]): ev.setdefault(tid,[]).append(e)
    print(json.dumps({"ga_events_by_property":ev,"js_errors":errs,"google_hosts_contacted":sorted(hosts)},indent=1))
asyncio.run(main())
