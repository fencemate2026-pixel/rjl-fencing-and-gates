import asyncio, glob, os, json
from playwright.async_api import async_playwright
BASE="http://127.0.0.1:8765"
pages=["/"]+["/"+p[len("site/"):-5] for p in sorted(glob.glob("site/*.html")+glob.glob("site/blogs/*.html")) if not p.endswith("index.html")]
async def main():
    res={"errors":[], "bad_requests":[]}
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        ctx=await b.new_context(viewport={"width":1366,"height":900})
        for path in pages:
            pg=await ctx.new_page()
            pg.on("console", lambda m,path=path: m.type=="error" and res["errors"].append((path,m.text)))
            pg.on("pageerror", lambda e,path=path: res["errors"].append((path,str(e))))
            pg.on("response", lambda r,path=path: (r.url.startswith(BASE) and r.status>=400) and res["bad_requests"].append((path,r.url,r.status)))
            await pg.goto(BASE+path, wait_until="networkidle"); await pg.close()
        pg=await ctx.new_page(); await pg.goto(BASE+"/",wait_until="networkidle")
        await pg.screenshot(path="shot_home.png",full_page=True)
        await pg.goto(BASE+"/service-areas",wait_until="networkidle"); await pg.screenshot(path="shot_areas.png",full_page=True)
        await pg.goto(BASE+"/pool-fencing",wait_until="networkidle")
        el=await pg.query_selector("#page-reviews-title"); res["pool_reviews_band"]=bool(el)
        # contact form
        await pg.goto(BASE+"/contact-us",wait_until="networkidle")
        await pg.fill("#enquiry-name","Test Person"); await pg.fill("#enquiry-email","t@example.com"); await pg.fill("#enquiry-message","Test 20m Colorbond")
        await pg.click("button[type=submit]")
        await pg.wait_for_timeout(500)
        res["form_status"]=await pg.inner_text(".email-enquiry form .form-status") if await pg.query_selector(".email-enquiry form .form-status") else None
        href=await pg.get_attribute(".email-enquiry form .form-status a","href")
        res["form_mailto_ok"]= bool(href and href.startswith("mailto:info@rjlfencing.com.au") and "Test%20Person" in href)
        # mobile
        m=await b.new_context(viewport={"width":390,"height":844},is_mobile=True)
        mp=await m.new_page(); await mp.goto(BASE+"/",wait_until="networkidle")
        await mp.screenshot(path="shot_mobile_closed.png")
        vis0=await mp.is_visible("#mobile-navigation-panel")
        await mp.click(".mobile-menu-toggle"); await mp.wait_for_timeout(300)
        vis1=await mp.is_visible("#mobile-navigation-panel"); await mp.screenshot(path="shot_mobile_open.png")
        await mp.keyboard.press("Escape"); vis2=await mp.is_visible("#mobile-navigation-panel")
        res["mobile_menu"]=(vis0,vis1,vis2)
        await mp.goto(BASE+"/service-areas",wait_until="networkidle"); await mp.screenshot(path="shot_mobile_areas.png",full_page=True)
        await b.close()
    res["pages_checked"]=len(pages)
    print(json.dumps(res,indent=1))
asyncio.run(main())
