#!/usr/bin/env python3
"""
port_visualiser.py - brings the photo visualiser from rjlcommercialgroup.com to this site.

The visualiser is developed in the RJL Commercial repo. One script serves both sites: the
#rjl-viz element's data-site="residential" switches logo, phone, web address and defaults.
This tool copies the shared files in and rebuilds the visualiser markup on this site's page,
with the RJL Fencing and Gates wording (form fields, consent, phone, privacy link).

Copies (from $COMMERCIAL_SITE, default ../website/site):
  assets/photo-visualiser.js|.css, photo-visualiser-ar.js, photo-visualiser-ai.js,
  photo-visualiser-inpaint.js, assets/vendor/three-ar/*
  ../netlify/functions/ai-finish.mjs and ../package.json (optional AI photo-real finish, consent first)
Rewrites:
  site/photo-visualiser.html   the <div id="rjl-viz"> block (page header, hero and footer kept)
  every page                   ?v=<hash> for the assets above and the designer files, so browsers
                               never keep an old copy (assets are cached for a year)
Safety interlocks: aborts if a marker it relies on is missing or a residential wording swap does not
apply exactly once; nothing is written until every check has passed. Logs to tools/audit-log.txt.
Usage:  python3 tools/port_visualiser.py   (COMMERCIAL_SITE=/path/to/website/site to override)
"""
import datetime, glob, hashlib, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
SRC = os.environ.get('COMMERCIAL_SITE', os.path.join(os.path.dirname(ROOT), 'website', 'site'))
LOG = os.path.join(ROOT, 'tools', 'audit-log.txt')
FILES = ['photo-visualiser.js', 'photo-visualiser.css', 'photo-visualiser-ar.js', 'photo-visualiser-ai.js',
         'photo-visualiser-inpaint.js']

# commercial wording -> residential wording (each must occur exactly once in the copied block)
SWAPS = [
    ('<div id="rjl-viz"', '<div id="rjl-viz" data-site="residential"'),
    ('Send your commercial concept to RJL', 'Send your picture to RJL'),
    ('action="/thank-you"', 'action="/photo-visualiser"'),
    ('<label>Company<input autocomplete="organization" name="company"/></label>',
     '<label>Unit / apartment (optional)<input autocomplete="address-line2" name="unit" maxlength="80"/></label>'),
    ('I agree to RJL Commercial keeping these photos to prepare my quote. They are not published or shared.',
     'I agree to RJL Fencing and Gates keeping these photos to prepare my quote. They are not published or shared. '
     '<a href="/privacy-policy">Read our privacy policy</a>.'),
    ('<a href="tel:+61400101132">0400 101 132</a>', '<a href="tel:+61412467840">0412 467 840</a>'),
]


def die(m):
    print('ABORTED:', m); sys.exit(1)


def h(path, n=8):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()[:n]


def main():
    for f in FILES:
        if not os.path.exists(os.path.join(SRC, 'assets', f)):
            die(f'missing {f} in {SRC}/assets')
    src_page = open(os.path.join(SRC, 'photo-visualiser.html'), encoding='utf-8').read()
    a = src_page.find('<div id="rjl-viz"'); b = src_page.find('<div id="rjl-designer"', a)
    if a < 0 or b < 0:
        die('could not find the #rjl-viz block in the commercial page')
    blk = src_page[a:b]
    for old, new in SWAPS:
        if blk.count(old) != 1:
            die(f'wording swap found {blk.count(old)} times (expected 1): {old[:60]}')
        blk = blk.replace(old, new)
    blk = blk.replace('href="/privacy"', 'href="/privacy-policy"')
    if 'rjlcommercialgroup' in blk or '0400 101 132' in blk:
        die('commercial address or phone left in the residential block')

    page_path = os.path.join(SITE, 'photo-visualiser.html')
    page = open(page_path, encoding='utf-8').read()
    c = page.find('<div id="rjl-viz"'); d = page.find('<div id="rjl-designer"', c)
    if c < 0 or d < 0:
        die('could not find the #rjl-viz block in this site\'s page')

    # ---- all checks passed: write
    for f in FILES:
        shutil.copyfile(os.path.join(SRC, 'assets', f), os.path.join(SITE, 'assets', f))
    tdir = os.path.join(SITE, 'assets', 'vendor', 'three-ar')
    if os.path.isdir(tdir):
        shutil.rmtree(tdir)
    shutil.copytree(os.path.join(SRC, 'assets', 'vendor', 'three-ar'), tdir)
    fn_src = os.path.join(os.path.dirname(SRC), 'netlify', 'functions', 'ai-finish.mjs')
    os.makedirs(os.path.join(ROOT, 'netlify', 'functions'), exist_ok=True)
    shutil.copyfile(fn_src, os.path.join(ROOT, 'netlify', 'functions', 'ai-finish.mjs'))
    shutil.copyfile(os.path.join(os.path.dirname(SRC), 'package.json'), os.path.join(ROOT, 'package.json'))
    page = page[:c] + blk + page[d:]
    open(page_path, 'w', encoding='utf-8').write(page)

    # ---- cache-busting: one hash per asset, applied on every page
    assets = FILES + ['fence-designer.js', 'fence-designer.css', 'vendor/three.min.js']
    vers = {f: h(os.path.join(SITE, 'assets', f)) for f in assets}
    n = 0
    for p in glob.glob(os.path.join(SITE, '**', '*.html'), recursive=True):
        t = open(p, encoding='utf-8').read(); u = t
        for f, v in vers.items():
            u = re.sub(r'/assets/' + re.escape(f) + r'\?v=[0-9a-f]+', f'/assets/{f}?v={v}', u)
        if u != t:
            open(p, 'w', encoding='utf-8').write(u); n += 1
    msg = f'visualiser ported from {SRC}; {n} pages version-bumped'
    print(msg)
    with open(LOG, 'a', encoding='utf-8') as fh:
        fh.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} port_visualiser: {msg}\n")


if __name__ == '__main__':
    main()
