#!/usr/bin/env python3
"""
build_fence_designer.py - turns the master RJL Fence & Gate Designer into website files.

Source of truth:  tools/designer/rjl-fence-gate-designer.html  (the full internal RJL tool,
                  with materials list and quote). Edit that file, then re-run this script.

Outputs (website mode: no materials, no prices, no rules; adds "Add to online quote"):
  site/assets/fence-designer.css        styles, scoped under #rjl-designer, light theme only
  site/assets/fence-designer.js         designer script (same code as the master)
  site/assets/vendor/three.min.js       three.js r128 (MIT) - self-hosted because the site CSP
  site/assets/vendor/OrbitControls.js   only allows scripts from this site ('self')
  site/fence-designer.html              RJL Fencing & Gates page (header/footer copied from contact-us)
  dist/commercial-fence-designer/       drop-in folder for rjlcommercialgroup.com (RJL Commercial logo,
                                         commercial defaults, its own email quote page)

Safety interlocks:
  - aborts if the master is missing the markers it relies on (style block, main script, render guards)
  - aborts if any inline <script> would end up in a site page (site CSP blocks inline scripts)
  - every run is appended to tools/audit-log.txt
Usage:  python3 tools/build_fence_designer.py
"""
import hashlib, os, re, shutil, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, 'tools', 'designer', 'rjl-fence-gate-designer.html')
SITE = os.path.join(ROOT, 'site')
DIST = os.path.join(ROOT, 'dist', 'commercial-fence-designer')
THREE_SRC = os.environ.get('THREE_SRC', '')          # folder containing three@0.128.0 (node_modules/three)
LOG = os.path.join(ROOT, 'tools', 'audit-log.txt')


def die(msg):
    print('BUILD ABORTED:', msg); sys.exit(1)


def log(msg):
    with open(LOG, 'a') as f:
        f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} build_fence_designer: {msg}\n")


def short_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()[:8]


# --------------------------------------------------------------------------- read master
if not os.path.exists(MASTER):
    die(f'master not found: {MASTER}')
master = open(MASTER, encoding='utf-8').read()
m_css = re.search(r'<style>(.*?)</style>', master, re.S)
scripts = re.findall(r'<script>(.*?)</script>', master, re.S)
if not m_css or not scripts:
    die('could not find the <style> block or the main inline <script> in the master')
css, js = m_css.group(1), scripts[-1]
for marker in ["const WEB = CFG.mode === 'web'", "on('#addToQuote'", "if (!$('#bomTable')) return;"]:
    if marker not in js:
        die(f'master script is missing "{marker}" - website mode would not work')

# --------------------------------------------------------------------------- CSS: light only, scoped
def strip_dark(c):
    """Remove the dark-theme token blocks; the website is light only."""
    c = re.sub(r'@media \(prefers-color-scheme: dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{.*?\}\s*\}', '', c, flags=re.S)
    c = re.sub(r':root\[data-theme="dark"\]\{.*?\}', '', c, flags=re.S)
    return c


def scope_selectors(sel, scope):
    out = []
    for part in sel.split(','):
        p = part.strip()
        if not p:
            continue
        if p in (':root', 'body', 'html'):
            out.append(scope)
        elif p.startswith(':root'):
            out.append(scope + p[5:])
        elif p == '*':
            out.append(f'{scope}, {scope} *')
        else:
            out.append(f'{scope} {p}')
    return ', '.join(out)


def scope_css(c, scope='#rjl-designer'):
    """Prefix every selector with the scope. Handles one level of @media nesting."""
    res, i, n = [], 0, len(c)
    while i < n:
        j = c.find('{', i)
        if j < 0:
            res.append(c[i:]); break
        head = c[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports'):
            depth, k = 1, j + 1
            while depth and k < n:
                depth += {'{': 1, '}': -1}.get(c[k], 0); k += 1
            res.append(head + '{' + scope_css(c[j + 1:k - 1], scope) + '}')
            i = k
        else:
            k = c.find('}', j)
            res.append(scope_selectors(head, scope) + '{' + c[j + 1:k] + '}')
            i = k + 1
    return '\n'.join(res)


WEB_OVERRIDES = """
/* ---- website theme: match rjlfencingandgates.com.au (navy / orange, site fonts) ---- */
#rjl-designer{--accent:#c2461a;--accent-soft:#fbe9e0;--ink:#0b0d0f;--bg:transparent;--surface:#fff;--surface-2:#f4f1ea;
  --line:#d9d3c7;--muted:#555d63;--scene:#9fb0bf;--ground:#7b8579;--grid:#5c6559;
  --f-display:var(--display, inherit);--f-body:var(--body, inherit);
  padding:0;background:transparent;font-size:15px;color:var(--ink)}
#rjl-designer .quote-cta{padding:16px;display:flex;flex-direction:column;gap:10px;border-top:4px solid var(--accent)}
#rjl-designer .quote-cta h2{font-size:22px}
#rjl-designer .quote-cta p{margin:0}
#rjl-designer .btn.primary{font-size:16px;padding:11px 18px;justify-content:center}
#rjl-designer .btn.primary{color:#fff;font-weight:600}   /* white on orange, same as the site's own buttons */
/* section headings stand out: bold, site orange */
#rjl-designer legend,#rjl-designer .pgroup,#rjl-designer .panel>summary,#rjl-designer .quote-cta h2,#rjl-designer .sum h3{color:var(--accent)!important;font-weight:700!important;letter-spacing:.06em}
#rjl-designer .v-fallback{margin:0}
#rjl-designer .btn[aria-pressed="true"], #rjl-designer .chip.gate{color:#fff}
#rjl-designer .toast{color:#fff}
@media (max-width:920px){#rjl-designer .stage{order:-1}#rjl-designer #viewport{height:clamp(300px,52vh,520px)}}
/* ---- full-screen designer ("app"): its own page, laid out like a professional fence planner ---- */
html.rjl-app-on,html.rjl-app-on body{overflow:hidden!important}
html.rjl-app-on .chat-widget,html.rjl-app-on .chat-launcher,html.rjl-app-on .rjl-chat-launcher,html.rjl-app-on [class*="rjl-chat"],html.rjl-app-on .sticky-quote{display:none!important}
#rjl-designer .app-open{margin-right:6px}
#rjl-designer.app{--navy:#071f38;--aline:#dfe3e8;position:fixed;inset:0;z-index:2147483000;display:grid;grid-template-rows:60px minmax(0,1fr);background:#fff;margin:0;padding:0;max-width:none}
#rjl-designer.app .app-bar{display:flex;align-items:center;gap:14px;padding:0 18px;background:#fff;border-bottom:1px solid var(--aline);box-shadow:0 1px 8px rgba(7,31,56,.08);position:relative;z-index:5;min-width:0}
#rjl-designer.app .app-logo{height:36px;width:auto;flex:none}
#rjl-designer.app .app-title{display:flex;flex-direction:column;line-height:1.25;padding-left:14px;border-left:1px solid var(--aline);min-width:0}
#rjl-designer.app .app-title strong{font-size:16px;color:var(--navy);white-space:nowrap}
#rjl-designer.app .app-title span{font-size:12.5px;color:#5b6570;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rjl-designer.app .app-views{display:inline-flex;border:1px solid #cfd6de;border-radius:8px;overflow:hidden;margin-left:10px;flex:none}
#rjl-designer.app .app-views .btn{border:0;border-radius:0;border-right:1px solid #cfd6de;background:#fff;min-height:38px;padding:7px 14px}
#rjl-designer.app .app-views .btn:last-child{border-right:0}
#rjl-designer.app .app-views .btn:hover{background:#f3f5f7}
#rjl-designer.app .app-sp{flex:1}
#rjl-designer.app .app-acts{display:flex;align-items:center;gap:8px;flex:none}
#rjl-designer.app .app-bar .btn{min-height:40px;border-radius:8px}
#rjl-designer.app .app-bar .btn.primary{font-size:14px;padding:9px 16px}
#rjl-designer.app .controls > .rjl-copy{margin:4px 2px 8px;font-size:11.5px}
#rjl-designer.app .app-close{border-color:var(--aline);color:var(--navy);flex:none}
#rjl-designer.app .work{display:grid;grid-template-columns:minmax(0,1fr) 410px;gap:0;min-height:0;margin:0;align-items:stretch}
#rjl-designer.app .stage{order:1;position:relative;display:flex;flex-direction:column;min-height:0;padding:0;margin:0;top:auto}
#rjl-designer.app .stage .toolbar{display:none}
#rjl-designer.app #viewport{flex:1 1 auto;height:auto!important;min-height:0;border:0;border-radius:0}
#rjl-designer.app .v-note{top:14px;bottom:auto;left:14px;background:rgba(255,255,255,.88);color:#3a434c;border-radius:6px;padding:5px 9px}
#rjl-designer.app .summary{position:absolute;left:20px;bottom:20px;z-index:3;max-width:min(720px,calc(100% - 40px));margin:0;background:#fff;border-radius:10px;
  border-left:4px solid var(--accent);box-shadow:0 8px 26px rgba(7,31,56,.24);padding:10px 14px}
#rjl-designer.app .summary:empty{display:none}
#rjl-designer.app .summary .panel{border:0;padding:0;margin:0;background:none;box-shadow:none}
#rjl-designer.app .summary .panel + .panel{margin-top:8px;padding-top:8px;border-top:1px solid var(--aline)}
#rjl-designer.app .controls{order:2;min-height:0;overflow-y:auto;background:#f3f5f7;border-left:1px solid var(--aline);padding:12px;margin:0;position:static;max-height:none;overscroll-behavior:contain}
#rjl-designer.app .controls > .panel{background:none;border:0;box-shadow:none;padding:0;margin:0}
/* cards */
#rjl-designer.app #runTabs,#rjl-designer.app #runEditor > *,#rjl-designer.app .controls > details,#rjl-designer.app .controls > .quote-cta,#rjl-designer.app .controls > .warns:not(:empty){
  background:#fff;border:1px solid var(--aline);border-radius:10px;padding:14px;margin:0 0 12px}
#rjl-designer.app #runTabs{display:flex;flex-wrap:wrap;gap:8px;border-radius:10px 10px 0 0;margin:0;border-bottom:0}
#rjl-designer.app #runEditor > label.f:first-child{border-radius:0 0 10px 10px;border-top:0;padding-top:4px}
#rjl-designer.app #runEditor{display:block;padding:0;border:0}
#rjl-designer.app #runEditor > fieldset{display:block;min-width:0}
#rjl-designer.app #runEditor > fieldset > legend{float:left;width:100%;padding:0;margin:0 0 12px;font-size:15px}
#rjl-designer.app #runEditor > fieldset > legend + *{clear:both}
#rjl-designer.app #runEditor > .grid2:first-of-type{border-radius:10px 10px 0 0;margin-bottom:0;border-bottom:0}
#rjl-designer.app #runEditor > .grid2:first-of-type::before{content:"Size and layout";grid-column:1/-1;font-weight:700;font-size:15px;color:var(--accent);letter-spacing:.06em}
#rjl-designer.app #runEditor > .slide-row{border-radius:0;border-top:0;border-bottom:0;margin:0;padding-top:4px;padding-bottom:4px}
#rjl-designer.app #runEditor > .slide-row + .hint{border-radius:0 0 10px 10px;border-top:0;padding-top:4px}
#rjl-designer.app #runEditor > .row-actions{display:flex;gap:8px;flex-wrap:wrap}
#rjl-designer.app .controls > .warns:not(:empty){background:#fff8ec;border-color:#f1d29a}
#rjl-designer.app .controls > .quote-cta{border-top:4px solid var(--accent)}
/* plain font for labels and small print (brand font kept for headings and buttons) */
#rjl-designer.app .app-title span,#rjl-designer.app .hint,#rjl-designer.app .f > span,#rjl-designer.app input,#rjl-designer.app select,#rjl-designer.app .chk,
#rjl-designer.app .chip,#rjl-designer.app .sum-h span,#rjl-designer.app .v-note,#rjl-designer.app .quote-cta p,#rjl-designer.app .warns,#rjl-designer.app .pcard span,#rjl-designer.app .rjl-copy{
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important;text-transform:none!important;letter-spacing:normal!important}
@media (max-width:1180px) and (min-width:921px){#rjl-designer.app .work{grid-template-columns:minmax(0,1fr) 350px}#rjl-designer.app .app-title span{display:none}}
@media (max-width:920px){
  #rjl-designer.app{display:flex;flex-direction:column}
  #rjl-designer.app .app-bar{flex:0 0 auto;flex-wrap:wrap;gap:6px 8px;padding:6px 8px}
  #rjl-designer.app .app-logo{margin-right:auto}
  #rjl-designer.app .app-views,#rjl-designer.app .app-acts{order:5}
  #rjl-designer.app .app-views .btn,#rjl-designer.app .app-acts .btn{padding:5px 7px!important;font-size:11.5px!important;min-height:32px!important}
  #rjl-designer.app .app-acts{gap:4px}
  #rjl-designer.app .app-title,#rjl-designer.app .app-sp{display:none}
  #rjl-designer.app .app-logo{height:28px}
  #rjl-designer.app .app-views{margin-left:0}
  #rjl-designer.app .app-views .btn,#rjl-designer.app .app-acts .btn{padding:6px 9px;font-size:12.5px;min-height:36px}
  #rjl-designer.app .app-close span{display:none}
  #rjl-designer.app .work{display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
  #rjl-designer.app .stage{order:0;flex:0 0 auto}
  #rjl-designer.app #viewport{flex:none;height:46dvh!important}
  #rjl-designer.app .summary{position:static;max-width:none;margin:8px;padding:8px 10px;box-shadow:none;border:1px solid var(--aline);border-left:4px solid var(--accent)}
  #rjl-designer.app .v-note{display:none}
  #rjl-designer.app .controls{order:1;flex:1 1 auto;border-left:0;border-top:1px solid var(--aline);padding:10px}
}
/* ---- launch section: examples of what it does, then "Start designing". The designer shows only full screen. ---- */
#rjl-designer:not(.app) > .work{display:none}
#rjl-designer.app > .dz-launch{display:none}
#rjl-designer .dz-launch{color:#071f38}
#rjl-designer .dz-hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:40px;align-items:center}
#rjl-designer .dz-copy h2{font-size:clamp(26px,2.6vw,36px);line-height:1.1;margin:0 0 14px;color:#071f38}
#rjl-designer .dz-copy p,#rjl-designer .dz-small,#rjl-designer .dz-examples figcaption,#rjl-designer .dz-list li{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;text-transform:none!important;letter-spacing:normal!important}
#rjl-designer .dz-copy p{max-width:52ch;margin:0 0 22px;font-size:17px;line-height:1.6;color:#2f3b47}
#rjl-designer .dz-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px}
#rjl-designer .dz-begin{font-size:17px;padding:15px 28px;text-decoration:none;border-radius:8px}
#rjl-designer .dz-small{font-size:13.5px;color:#5b6570}
#rjl-designer .dz-launch figure{margin:0}
#rjl-designer .dz-launch img{display:block;width:100%;height:auto;aspect-ratio:900/560;object-fit:cover;border-radius:10px;box-shadow:0 16px 40px rgba(7,31,56,.22)}
#rjl-designer .dz-examples{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;margin:52px 0 0}
#rjl-designer .dz-examples figcaption{margin-top:14px;font-size:15px;line-height:1.5;color:#2f3b47}
#rjl-designer .dz-examples figcaption strong{display:block;font-size:17px;color:#071f38;margin-bottom:2px}
#rjl-designer .dz-list{background:#071f38;border-radius:10px;padding:22px 24px;color:#fff;border-top:4px solid var(--accent)}
#rjl-designer .dz-list figcaption{margin:0 0 10px}
#rjl-designer .dz-list figcaption strong{color:#fff}
#rjl-designer .dz-list ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
#rjl-designer .dz-list li{position:relative;padding-left:28px;font-size:14.5px;line-height:1.45;color:#dbe4ee}
#rjl-designer .dz-list li::before{content:"\\2713";position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:50%;background:var(--accent);color:#fff;font:700 11px/19px system-ui,sans-serif;text-align:center}
@media (max-width:920px){#rjl-designer .dz-hero{grid-template-columns:1fr;gap:24px}#rjl-designer .dz-examples{grid-template-columns:1fr;margin-top:32px}#rjl-designer .dz-begin{width:100%;text-align:center;justify-content:center}}
/* ---- app finish: navy bar, drawing title block, numbered steps, chips (memorable element = the title block) ---- */
#rjl-designer.app .app-bar{background:var(--navy);border-bottom:0;box-shadow:0 2px 14px rgba(7,31,56,.35);color:#fff}
#rjl-designer.app .app-logo{background:#fff;border-radius:7px;padding:4px 8px;height:40px;box-sizing:border-box}
#rjl-designer.app .app-title{border-left-color:rgba(255,255,255,.18)}
#rjl-designer.app .app-title strong{color:#fff}
#rjl-designer.app .app-title span{color:#a9b7c6}
#rjl-designer.app .app-views{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06)}
#rjl-designer.app .app-views .btn{background:transparent;color:#dbe4ee;border-right-color:rgba(255,255,255,.18)}
#rjl-designer.app .app-views .btn:hover{background:rgba(255,255,255,.1);color:#fff}
#rjl-designer.app .app-acts .btn,#rjl-designer.app .app-close{background:transparent;color:#fff;border-color:rgba(255,255,255,.3)}
#rjl-designer.app .app-acts .btn[aria-pressed="true"]{background:#fff;color:var(--navy);border-color:#fff}
#rjl-designer.app .app-bar .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 14px rgba(194,70,26,.45)}
/* stage frame */
#rjl-designer.app .stage::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(7,31,56,.18);z-index:1}
#rjl-designer.app .summary{display:none}
#rjl-designer.app .v-note{z-index:2}
/* title block, like the box on a fabrication drawing */
#rjl-designer.app .app-titleblock{position:absolute;left:20px;bottom:20px;z-index:3;display:grid;grid-template-columns:62px minmax(150px,1.6fr) repeat(3,minmax(70px,1fr));
  max-width:min(760px,calc(100% - 150px));background:var(--navy);color:#fff;border-radius:10px;overflow:hidden;box-shadow:0 14px 40px rgba(7,31,56,.38);border-top:4px solid var(--accent)}
#rjl-designer.app .app-titleblock:empty{display:none}
#rjl-designer.app .tb-mark{grid-row:span 2;display:flex;align-items:center;justify-content:center;background:var(--accent);font-weight:800;font-size:17px;letter-spacing:.04em}
#rjl-designer.app .tb-cell{padding:8px 12px;border-left:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);min-width:0}
#rjl-designer.app .tb-cell small{display:block;font-size:11px;color:#9fb0c2;margin-bottom:2px}
#rjl-designer.app .tb-cell strong{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rjl-designer.app .tb-cell strong i{width:12px;height:12px;border-radius:3px;border:1px solid rgba(255,255,255,.5);flex:none}
#rjl-designer.app .tb-main strong{font-size:15px}
#rjl-designer.app .tb-gate{grid-column:span 2}
#rjl-designer.app .tb-err{grid-column:2 / -1;padding:8px 12px;background:#7a1f12;font-size:12.5px}
/* zoom buttons */
#rjl-designer.app .app-zoom{position:absolute;right:20px;bottom:20px;z-index:3;display:flex;flex-direction:column;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(7,31,56,.25)}
#rjl-designer.app .app-zoom button{width:46px;height:42px;border:0;border-bottom:1px solid var(--aline);background:#fff;color:var(--navy);font:600 20px/1 system-ui,sans-serif;cursor:pointer}
#rjl-designer.app .app-zoom button:last-child{border-bottom:0;font-size:12px}
#rjl-designer.app .app-zoom button:hover{background:#f3f5f7}
#rjl-designer.app .app-zoom button:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}
/* numbered steps (they are a sequence: system, size, ground, colour, gate) */
#rjl-designer.app #runEditor{counter-reset:step}
#rjl-designer.app #runEditor > fieldset > legend,#rjl-designer.app #runEditor > .grid2:first-of-type::before{counter-increment:step}
#rjl-designer.app #runEditor > fieldset > legend::before,#rjl-designer.app #runEditor > .grid2:first-of-type::before{color:var(--accent)}
#rjl-designer.app #runEditor > fieldset > legend::before{content:counter(step);display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;margin-right:10px;
  border-radius:50%;background:var(--navy);color:#fff;font-size:12.5px;font-weight:700;vertical-align:2px}
#rjl-designer.app #runEditor > .grid2:first-of-type::before{content:counter(step) "  Size and layout"}
#rjl-designer.app #runEditor > fieldset > legend{color:var(--navy)!important}
#rjl-designer.app #runEditor > *{box-shadow:0 1px 2px rgba(7,31,56,.05)}
/* picker tiles */
#rjl-designer.app .products{gap:8px}
#rjl-designer.app .pcard{background:#fff;border:1.5px solid var(--aline);border-radius:10px;padding:12px 6px 10px;gap:6px;transition:border-color .12s,box-shadow .12s}
#rjl-designer.app .pcard:hover{border-color:#b9c3cd;box-shadow:0 4px 12px rgba(7,31,56,.1)}
#rjl-designer.app .pcard svg{width:58px;height:34px;color:#4b5866}
#rjl-designer.app .pcard.on{border-color:var(--accent);background:#fff7f3;box-shadow:0 0 0 3px rgba(194,70,26,.15)}
#rjl-designer.app .pcard.on::after{content:"\\2713";position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;font:700 11px/18px system-ui,sans-serif}
/* colour chips with names */
#rjl-designer.app .swatches{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 8px}
#rjl-designer.app .sw{width:100%;height:auto;aspect-ratio:auto;border:0;border-radius:0;background:none!important;display:flex;flex-direction:column;align-items:center;gap:5px;padding:0}
#rjl-designer.app .sw::before{content:"";display:block;width:100%;height:38px;border-radius:8px;background:var(--chip);border:1px solid rgba(0,0,0,.18);box-shadow:inset 0 -8px 14px rgba(0,0,0,.12)}
#rjl-designer.app .sw::after{content:attr(title);font:500 11.5px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#3a434c;text-align:center;text-transform:none}
#rjl-designer.app .sw.on::before{outline:3px solid var(--accent);outline-offset:2px}
#rjl-designer.app .sw-custom{width:100%;height:38px;border-radius:8px}
/* inputs */
#rjl-designer.app .f input:not([type=range]),#rjl-designer.app .f select{min-height:42px;border-radius:8px;border-color:#cfd6de}
#rjl-designer.app .f input:focus,#rjl-designer.app .f select:focus{outline:3px solid rgba(194,70,26,.3);border-color:var(--accent)}
/* quote bar pinned to the bottom of the panel */
#rjl-designer.app .controls > .quote-cta{position:sticky;bottom:-12px;margin:12px -12px -12px;border-radius:0;border:0;border-top:4px solid var(--accent);
  background:var(--navy);color:#fff;padding:14px 16px 16px;box-shadow:0 -8px 24px rgba(7,31,56,.18);z-index:4}
#rjl-designer.app .controls > .quote-cta h2{color:#fff!important;font-size:17px;margin:0}
#rjl-designer.app .controls > .quote-cta > p:not(.err-text){display:none}
#rjl-designer.app .app-stats{display:flex;flex-wrap:wrap;gap:4px 14px;font:400 13px/1.4 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#c5d1dd}
#rjl-designer.app .app-stats b{color:#fff;font-weight:700}
#rjl-designer.app .controls > .rjl-copy{order:9}
@media (max-width:920px){
  #rjl-designer.app .app-titleblock{position:static;margin:8px;max-width:none;grid-template-columns:48px 1fr 1fr 1fr}
  #rjl-designer.app .tb-main{grid-column:span 3}
  #rjl-designer.app .tb-gate{grid-column:span 3}
  #rjl-designer.app .app-zoom{right:10px;bottom:auto;top:10px}
  #rjl-designer.app .stage::after{display:none}
  #rjl-designer.app .swatches{grid-template-columns:repeat(3,minmax(0,1fr))}
}
"""

web_css = scope_css(strip_dark(css)) + WEB_OVERRIDES
# drop artifact-only header/banner styles (not used on the website)
web_css = '/* Generated by tools/build_fence_designer.py from tools/designer/rjl-fence-gate-designer.html - do not edit. */\n' + web_css

# --------------------------------------------------------------------------- website protection
# Anything a browser runs can be downloaded, so this cannot make copying impossible. It makes a copy
# hard to read and useless off RJL's sites:
#   1. price ranges (PRODUCTS.market) are removed - the website never shows prices
#   2. a domain lock stops the designer running on any site except RJL's (and local/preview builds)
#   3. the code is minified and renamed with terser (unreadable variable names, no comments)
#   4. a copyright notice is kept at the top of the file
WEB_MARKER = '/*! RJL-WEB-BUILD */'
COPYRIGHT = ('/*! RJL 3D Fence & Gate Designer. Copyright (c) ' + str(datetime.date.today().year) +
             ' RJL Commercial Fencing and Gates (VIC) Pty Ltd. All rights reserved. '
             'Copying, reverse engineering or reuse of this code, in whole or in part, is prohibited. */')
ALLOWED_HOSTS = (r'^(www\.)?(rjlfencingandgates\.com\.au|rjlcommercialgroup\.com)$'
                 r'|^(localhost|127\.0\.0\.1)$'
                 r'|^([a-z0-9-]+--)?(rjlfencingandgates|rjlcommercial)\.netlify\.app$')
GUARD = ("(function(){var ok=/" + ALLOWED_HOSTS.replace('/', '\\/') + "/i.test(location.hostname);"
         "if(!ok){var el=document.getElementById('rjl-designer');"
         "if(el)el.innerHTML='<p style=\"padding:24px;font:16px sans-serif\">This designer is only available at "
         "<a href=\"https://www.rjlfencingandgates.com.au/fence-designer\">rjlfencingandgates.com.au</a> and "
         "<a href=\"https://www.rjlcommercialgroup.com/fence-designer\">rjlcommercialgroup.com</a>.</p>';"
         "throw new Error('RJL designer: unlicensed host');}})();\n")
n_market = len(re.findall(r'market:\[\d+,\d+\]', js))
web_src = re.sub(r'market:\[\d+,\d+\]', 'market:null', js)
if n_market < 5 or 'market:[' in web_src:
    die(f'price ranges not fully removed from the website build ({n_market} found)')
web_src = GUARD + web_src
TERSER = os.environ.get('TERSER', 'npx --yes terser@5.31.6')
tmp_in, tmp_out = os.path.join(ROOT, 'tools', '.web-src.js'), os.path.join(ROOT, 'tools', '.web-min.js')
open(tmp_in, 'w', encoding='utf-8').write(web_src)
import subprocess
r = subprocess.run(f'{TERSER} "{tmp_in}" --compress passes=2 --mangle --comments false -o "{tmp_out}"',
                   shell=True, capture_output=True, text=True)
if r.returncode != 0 or not os.path.exists(tmp_out):
    die('terser failed: ' + (r.stderr or r.stdout)[-400:])
minified = open(tmp_out, encoding='utf-8').read()
os.remove(tmp_in); os.remove(tmp_out)
for leak in ('market:[', 'DEFAULT_RULES', 'const WEB'):
    if leak in minified:
        die(f'website build still contains "{leak}"')
web_js = COPYRIGHT + '\n' + WEB_MARKER + '\n' + minified + '\n'
log(f'website js: {len(web_src)} -> {len(minified)} bytes minified, {n_market} price ranges removed, domain lock on')

# --------------------------------------------------------------------------- designer markup (website)
def designer_markup(brand, quote_url, turnstiles):
    turn = ''
    if turnstiles:
        turn = """
      <details class="panel" id="turnPanel">
        <summary>Turnstiles</summary>
        <div class="inner">
          <div class="grid2">
            <label class="f"><span>Quantity</span><input type="number" id="t-count" data-t="count" min="0" max="20" step="1"></label>
            <label class="f"><span>Type</span><select id="t-type" data-t="type"><option value="single">Single rotor</option><option value="double">Double rotor</option></select></label>
          </div>
          <label class="f"><span>Access control</span><select id="t-access" data-t="access"></select></label>
        </div>
      </details>"""
    return f"""
<div id="rjl-designer" data-mode="web" data-brand="{brand}" data-quote-url="{quote_url}">
  <div class="work">
    <section class="controls" aria-label="Fence runs">
      <div class="panel">
        <div class="tabs" id="runTabs" role="tablist" aria-label="Runs"></div>
        <div class="editor" id="runEditor"></div>
      </div>{turn}
    </section>
    <section class="stage" aria-label="3D view">
      <div class="toolbar" role="toolbar" aria-label="View controls">
        <button class="btn" type="button" data-view="iso">3D view</button>
        <button class="btn" type="button" data-view="front">Front</button>
        <button class="btn" type="button" data-view="top">Plan</button>
        <span class="sep" aria-hidden="true"></span>
        <button class="btn" type="button" id="btnOpen" aria-pressed="false">Open gates</button>
        <button class="btn" type="button" id="btnDims" aria-pressed="true">Dimensions</button>
      </div>
      <div id="viewport"><span class="v-note">Drag the gate or a panel to slide it (phone: hold, then drag) · drag elsewhere to turn</span></div>
      <div class="summary" id="layoutSummary" aria-live="polite"></div>
      <div class="warns" id="warns"></div>
      <div class="panel quote-cta">
        <h2>Happy with your design?</h2>
        <p>Add it to an online quote. We measure on site and confirm the price before any work starts.</p>
        <button type="button" class="btn primary" id="addToQuote">Add to online quote</button>
        <p class="err-text" id="addMsg" hidden></p>
      </div>
    </section>
  </div>
</div>"""


SCRIPTS = ('<script src="/assets/vendor/three.min.js?v={t}" defer></script>'
           '<script src="/assets/vendor/OrbitControls.js?v={o}" defer></script>'
           '<script src="/assets/fence-designer.js?v={j}" defer></script>')

# --------------------------------------------------------------------------- write site assets
os.makedirs(os.path.join(SITE, 'assets', 'vendor'), exist_ok=True)
open(os.path.join(SITE, 'assets', 'fence-designer.css'), 'w', encoding='utf-8').write(web_css)
open(os.path.join(SITE, 'assets', 'fence-designer.js'), 'w', encoding='utf-8').write(web_js)
vendor = {'three.min.js': 'build/three.min.js', 'OrbitControls.js': 'examples/js/controls/OrbitControls.js'}
for name, rel in vendor.items():
    dst = os.path.join(SITE, 'assets', 'vendor', name)
    if THREE_SRC:
        shutil.copyfile(os.path.join(THREE_SRC, rel), dst)
    if not os.path.exists(dst):
        die(f'{dst} missing - run once with THREE_SRC=/path/to/node_modules/three (three@0.128.0)')
vh = {n: short_hash(open(os.path.join(SITE, 'assets', 'vendor', n), encoding='utf-8').read()) for n in vendor}
scripts_tag = SCRIPTS.format(t=vh['three.min.js'], o=vh['OrbitControls.js'], j=short_hash(web_js))
css_tag = f'<link rel="stylesheet" href="/assets/fence-designer.css?v={short_hash(web_css)}"/>'

# Regenerate shared assets without replacing the hand-maintained site pages or
# commercial distribution when changing the residential catalogue.
if '--assets-only' in sys.argv:
    print('ok - updated shared designer assets; page wrappers preserved')
    sys.exit(0)

# --------------------------------------------------------------------------- site page from contact-us template
tpl = open(os.path.join(SITE, 'contact-us.html'), encoding='utf-8').read()
head_end, main_s, main_e = tpl.index('</head>'), tpl.index('<main'), tpl.index('</main>') + len('</main>')
head = tpl[:head_end]
TITLE = '3D Fence &amp; Gate Designer | RJL Fencing and Gates'
DESC = 'Design your residential fence and gate in 3D: Colorbond, timber, slat, batten and pool fencing with swing, sliding and automated gates. Add your design to a quote.'
head = re.sub(r'<title>.*?</title>', f'<title>{TITLE}</title>', head)
head = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + DESC, head)
head = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>3D Fence &amp; Gate Designer | RJL Fencing and Gates', head)
head = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + DESC, head)
head = re.sub(r'(<meta property="og:url" content=")[^"]*', r'\g<1>https://www.rjlfencingandgates.com.au/fence-designer', head)
head = re.sub(r'(<link rel="canonical" href=")[^"]*', r'\g<1>https://www.rjlfencingandgates.com.au/fence-designer', head)
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)   # contact-page schema doesn't apply
head += css_tag
main = f"""<main id="main-content"><section class="page-hero"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span><span aria-hidden="true">/</span><b>3D designer</b></span></nav><span class="eyebrow">3D fence designer</span><h1>Design your fence and gate in 3D.</h1><p class="lead">Pick a fence style, enter your lengths and add a gate. Turn the model to see it from any side, then add the design to an online quote.</p><div class="button-row"><a class="button button-primary" href="#design" data-open-designer>Start designing</a><a class="button" href="/photo-visualiser">Try the photo visualiser</a></div></div></section><section class="content-section"><div class="shell">{designer_markup('residential', '/contact-us', False)}</div></section></main>"""
tail = tpl[main_e:]
tail = tail.replace('</body>', scripts_tag + '</body>', 1)
page = head + tpl[head_end:main_s] + main + tail
if re.search(r'<script>(?!\s*</script>)', page):
    die('inline <script> found in the generated page - the site CSP would block it')
open(os.path.join(SITE, 'fence-designer.html'), 'w', encoding='utf-8').write(page)

# --------------------------------------------------------------------------- commercial drop-in folder
os.makedirs(os.path.join(DIST, 'assets', 'vendor'), exist_ok=True)
for n in vendor:
    shutil.copyfile(os.path.join(SITE, 'assets', 'vendor', n), os.path.join(DIST, 'assets', 'vendor', n))
shutil.copyfile(os.path.join(SITE, 'assets', 'fence-designer.css'), os.path.join(DIST, 'assets', 'fence-designer.css'))
shutil.copyfile(os.path.join(SITE, 'assets', 'fence-designer.js'), os.path.join(DIST, 'assets', 'fence-designer.js'))
shutil.copyfile(os.path.join(ROOT, 'tools', 'designer', 'rjl-commercial-logo-trim.png'), os.path.join(DIST, 'assets', 'rjl-commercial-logo.png'))
c_scripts = scripts_tag.replace('/assets/', 'assets/')
c_css = css_tag.replace('/assets/', 'assets/')
C_HEAD = """<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title><meta name="description" content="{desc}"/>
<style>
body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f3f4f5;color:#111}}
.c-head{{background:#fff;border-bottom:4px solid #c4161c}}
.c-wrap{{max-width:1320px;margin:0 auto;padding:12px 16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}}
.c-head img{{height:56px;width:auto;max-width:100%}}
.c-head a.call{{font-weight:700;color:#c4161c;text-decoration:none}}
.c-main{{max-width:1320px;margin:0 auto;padding:20px 16px 48px}}
.c-main h1{{font-size:clamp(24px,4vw,34px);margin:0 0 6px}} .c-main .lead{{margin:0 0 18px;color:#444;max-width:70ch}}
.c-foot{{background:#fff;border-top:1px solid #ddd;padding:18px 16px;text-align:center;font-size:14px;color:#444}}
form.c-form{{display:grid;gap:12px;max-width:640px}} form.c-form label{{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:14px}}
form.c-form input,form.c-form textarea{{font:inherit;padding:9px 10px;border:1px solid #ccc;border-radius:4px}} form.c-form textarea{{min-height:220px}}
form.c-form button{{font:inherit;font-weight:700;padding:12px 18px;background:#c4161c;color:#fff;border:0;border-radius:4px;cursor:pointer}}
</style>{css}</head><body>
<header class="c-head"><div class="c-wrap"><a href="https://rjlcommercialgroup.com/"><img src="assets/rjl-commercial-logo.png" alt="RJL Commercial" width="800" height="192"/></a><a class="call" href="tel:+61400101132">24/7 Rapid Response 0400 101 132</a></div></header>
<main class="c-main">"""
C_FOOT = """</main><footer class="c-foot">RJL Commercial Fencing and Gates (VIC) Pty Ltd · ABN 37 652 237 431 · Unit 1/12 Merchant Avenue, Thomastown VIC 3074 · info@rjlcommercialgroup.com</footer>{scripts}</body></html>"""
c_index = (C_HEAD.format(title='3D Fence &amp; Gate Designer | RJL Commercial', desc='Design commercial fencing, security add-ons and automated gates in 3D, then add the design to an online quote.', css=c_css)
           + '<h1>Design your site fencing and gates in 3D.</h1><p class="lead">Choose a fence system, add security toppings, gates and automation, then send the design to RJL Commercial for a site measure and quote.</p>'
           + designer_markup('commercial', 'quote.html', True) + C_FOOT.format(scripts=c_scripts))
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(c_index)
QUOTE_JS = r"""/* quote.js - RJL Commercial online quote: prefills the design from the 3D designer and builds an email.
 * Nothing is sent to a server; the visitor's email app sends it. */
(function(){
  'use strict';
  var EMAIL = 'info@rjlcommercialgroup.com', f = document.getElementById('c-quote'), msg = document.getElementById('c-msg');
  try { var d = JSON.parse(sessionStorage.getItem('rjl-design-quote') || 'null');
        if (d && d.text){ msg.value = d.text + '\n\n'; document.getElementById('c-note').hidden = false; sessionStorage.removeItem('rjl-design-quote'); } } catch(e){}
  f.addEventListener('submit', function(e){
    e.preventDefault(); if (!f.reportValidity()) return;
    var v = function(id){ return (document.getElementById(id).value || '').trim(); };
    var body = ['Hello RJL Commercial,', '', 'Please quote the following.', '', 'Name: ' + v('c-name'), 'Company: ' + v('c-company'),
      'Phone: ' + v('c-phone'), 'Email: ' + v('c-email'), 'Site address: ' + v('c-site'), '', v('c-msg')].join('\r\n');
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Online quote - 3D designer') + '&body=' + encodeURIComponent(body);
    document.getElementById('c-sent').hidden = false;
  });
})();
"""
open(os.path.join(DIST, 'assets', 'quote.js'), 'w', encoding='utf-8').write(QUOTE_JS)
c_quote = (C_HEAD.format(title='Online Quote | RJL Commercial', desc='Request a quote from RJL Commercial.', css='')
           + """<h1>Online quote</h1><p class="lead">Check your design below, add your details and press Send. Your email app opens with everything filled in.</p>
<p id="c-note" hidden><strong>Your 3D design has been added.</strong> <a href="index.html">Back to the designer</a></p>
<form class="c-form" id="c-quote"><label>Full name *<input id="c-name" required maxlength="120" autocomplete="name"></label>
<label>Company<input id="c-company" maxlength="160" autocomplete="organization"></label>
<label>Phone<input id="c-phone" type="tel" maxlength="40" autocomplete="tel"></label>
<label>Email *<input id="c-email" type="email" required maxlength="254" autocomplete="email"></label>
<label>Site address<input id="c-site" maxlength="250" autocomplete="street-address"></label>
<label>Project details *<textarea id="c-msg" required maxlength="4000"></textarea></label>
<button type="submit">Send quote request</button><p id="c-sent" hidden>Your email app should now be open. Press Send there to submit your request.</p></form>"""
           + C_FOOT.format(scripts='<script src="assets/quote.js" defer></script>'))
open(os.path.join(DIST, 'quote.html'), 'w', encoding='utf-8').write(c_quote)
for f in ('index.html', 'quote.html'):
    if re.search(r'<script>(?!\s*</script>)', open(os.path.join(DIST, f)).read()):
        die(f'inline <script> in dist/{f}')

summary = f'ok - css {len(web_css)} B, js {len(web_js)} B, page fence-designer.html, commercial folder dist/commercial-fence-designer'
log(summary)
print(summary)

