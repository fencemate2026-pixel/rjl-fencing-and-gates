import asyncio, json, sys
from playwright.async_api import async_playwright
BASE=sys.argv[1]
Q=["Do you do Officer?","Can you come to Berwick","Do you cover Mill Park?","How much is a colorbond fence","Google reviews","what is your favourite colour","Are you licensed","Kew"]
async def main():
    out={"errors":[]}
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        for vp,name in [((1366,900),"desktop"),((390,844),"mobile")]:
            pg=await (await b.new_context(viewport={"width":vp[0],"height":vp[1]})).new_page()
            pg.on("pageerror",lambda e: out["errors"].append(str(e)))
            pg.on("console",lambda m: m.type=="error" and out["errors"].append(m.text))
            await pg.goto(BASE+"/",wait_until="networkidle")
            out[name+"_closed_panel_visible"]=await pg.is_visible(".chat-panel")
            await pg.click(".chat-launcher")
            out[name+"_open_panel_visible"]=await pg.is_visible(".chat-panel")
            if name=="desktop":
                for q in Q:
                    await pg.fill("#rjl-question",q); await pg.click(".chat-form button[type=submit]")
                    out[q]=await pg.inner_text(".chat-answer h3")
                await pg.fill("#rjl-question","Do you do Officer?"); await pg.click(".chat-form button[type=submit]")
            await pg.screenshot(path=f"shot_chat_{name}.png")
            await pg.keyboard.press("Escape"); out[name+"_after_escape_visible"]=await pg.is_visible(".chat-panel")
        await b.close()
    print(json.dumps(out,indent=1))
asyncio.run(main())
