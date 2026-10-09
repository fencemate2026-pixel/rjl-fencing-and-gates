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
  --line:#d9d3c7;--muted:#555d63;--scene:#e3e7ea;--ground:#c9cec4;--grid:#9aa39a;
  --f-display:var(--display, inherit);--f-body:var(--body, inherit);
  padding:0;background:transparent;font-size:15px;color:var(--ink)}
#rjl-designer .quote-cta{padding:16px;display:flex;flex-direction:column;gap:10px;border-top:4px solid var(--accent)}
#rjl-designer .quote-cta h2{font-size:22px}
#rjl-designer .quote-cta p{margin:0}
#rjl-designer .btn.primary{font-size:16px;padding:11px 18px;justify-content:center}
#rjl-designer .v-fallback{margin:0}
#rjl-designer .btn[aria-pressed="true"], #rjl-designer .chip.gate{color:#fff}
#rjl-designer .toast{color:#fff}
@media (max-width:920px){#rjl-designer .stage{order:-1}#rjl-designer #viewport{height:clamp(300px,52vh,520px)}}
"""

web_css = scope_css(strip_dark(css)) + WEB_OVERRIDES
# drop artifact-only header/banner styles (not used on the website)
web_css = '/* Generated by tools/build_fence_designer.py from tools/designer/rjl-fence-gate-designer.html - do not edit. */\n' + web_css

web_js = ('/* Generated by tools/build_fence_designer.py from tools/designer/rjl-fence-gate-designer.html - do not edit.\n'
          ' * three.js r128 and OrbitControls are loaded first from /assets/vendor/. */\n' + js)

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
      <div id="viewport"><span class="v-note">Drag to turn · scroll or pinch to zoom · right-drag to move</span></div>
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

# --------------------------------------------------------------------------- site page from contact-us template
tpl = open(os.path.join(SITE, 'contact-us.html'), encoding='utf-8').read()
head_end, main_s, main_e = tpl.index('</head>'), tpl.index('<main'), tpl.index('</main>') + len('</main>')
head = tpl[:head_end]
TITLE = '3D Fence &amp; Gate Designer | RJL Fencing and Gates'
DESC = 'Design your fence and gate in 3D: Colorbond, timber, slat, pool and security fencing with swing, sliding and automated gates. Add your design to an online quote.'
head = re.sub(r'<title>.*?</title>', f'<title>{TITLE}</title>', head)
head = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + DESC, head)
head = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>3D Fence &amp; Gate Designer | RJL Fencing and Gates', head)
head = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + DESC, head)
head = re.sub(r'(<meta property="og:url" content=")[^"]*', r'\g<1>https://www.rjlfencingandgates.com.au/fence-designer', head)
head = re.sub(r'(<link rel="canonical" href=")[^"]*', r'\g<1>https://www.rjlfencingandgates.com.au/fence-designer', head)
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)   # contact-page schema doesn't apply
head += css_tag
main = f"""<main id="main-content"><section class="page-hero"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span><span aria-hidden="true">/</span><b>3D designer</b></span></nav><span class="eyebrow">3D fence designer</span><h1>Design your fence and gate in 3D.</h1><p class="lead">Pick a fence style, enter your lengths and add a gate. Turn the model to see it from any side, then add the design to an online quote.</p></div></section><section class="content-section"><div class="shell">{designer_markup('residential', '/contact-us', False)}</div></section></main>"""
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
