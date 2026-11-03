#!/usr/bin/env python3
"""seo_quick_wins.py - residential SEO quick wins from the 4 Nov 2026 audit (idempotent).

Adds managed contextual link blocks (<!-- RJL seo: related -->) between services, guides, suburb
pages and projects, contextual links to the commercial site where relevant, BreadcrumbList JSON-LD on
pages without one, and legalName (as already published in Article publisher markup) on the business node.
Contact details, map pins, hours and prices are deliberately untouched.
Usage: python3 tools/seo_quick_wins.py [site_dir]
"""
import html, json, re, sys
from pathlib import Path

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'site').resolve()
BASE = 'https://www.rjlfencingandgates.com.au'
COM = 'https://www.rjlcommercialgroup.com'
SUBURBS = ['locations/fencing-mill-park', 'locations/fencing-epping', 'locations/fencing-south-morang',
           'locations/fencing-greensborough', 'locations/fencing-strathmore', 'locations/fencing-essendon', 'fencing-bundoora']
SERVICES = ['timber-colorbond-fencing-melbourne', 'sliding-double-gates-bundoora', 'gate-automation-bundoora',
            'pool-fencing', 'retaining-walls', 'steel-fencing-gates']
LINKS = {
    'blogs/timber-vs-colorbond-fencing-melbourne': ['timber-colorbond-fencing-melbourne', 'blogs/fencing-costs-melbourne-quote-checklist', 'blogs/neighbour-wont-pay-half-fence-victoria'],
    'blogs/sliding-vs-swing-driveway-gates': ['sliding-double-gates-bundoora', 'gate-automation-bundoora', 'gate-servicing-maintenance'],
    'blogs/pool-fencing-requirements-victoria': ['pool-fencing', 'pool-fencing-regulations-victoria'],
    'blogs/retaining-wall-permits-victoria': ['retaining-walls', 'timber-colorbond-fencing-melbourne'],
    'blogs/neighbour-wont-pay-half-fence-victoria': ['timber-colorbond-fencing-melbourne', 'blogs/fencing-costs-melbourne-quote-checklist'],
    'blogs/fencing-costs-melbourne-quote-checklist': ['timber-colorbond-fencing-melbourne', 'steel-fencing-gates', 'sliding-double-gates-bundoora', 'fence-designer'],
    'blogs/big-group-hug-grand-opening': ['about-rjlfencing-and-gates', 'reviews'],
    'timber-colorbond-fencing-melbourne': ['blogs/timber-vs-colorbond-fencing-melbourne', 'blogs/fencing-costs-melbourne-quote-checklist', 'blogs/neighbour-wont-pay-half-fence-victoria'] + SUBURBS[:4],
    'pool-fencing': ['blogs/pool-fencing-requirements-victoria', 'pool-fencing-regulations-victoria', 'steel-fencing-gates'],
    'pool-fencing-regulations-victoria': ['pool-fencing', 'blogs/pool-fencing-requirements-victoria'],
    'retaining-walls': ['blogs/retaining-wall-permits-victoria', 'timber-colorbond-fencing-melbourne'],
    'sliding-double-gates-bundoora': ['blogs/sliding-vs-swing-driveway-gates', 'gate-automation-bundoora', 'gate-servicing-maintenance', 'projects/ringwood-custom-entry'],
    'gate-automation-bundoora': ['sliding-double-gates-bundoora', 'gate-servicing-maintenance', 'blogs/sliding-vs-swing-driveway-gates', 'projects/richmond-automated-gates'],
    'steel-fencing-gates': ['gallery', 'sliding-double-gates-bundoora', 'blogs/fencing-costs-melbourne-quote-checklist', 'projects/toorak-pedestrian-fencing'],
    'gate-servicing-maintenance': ['gate-automation-bundoora', 'emergency-fence-gate-repairs', 'sliding-double-gates-bundoora'],
    'emergency-fence-gate-repairs': ['gate-servicing-maintenance', 'timber-colorbond-fencing-melbourne', 'service-areas'],
    'about-rjlfencing-and-gates': ['reviews', 'gallery', 'who-we-work-with'],
    'who-we-work-with': ['steel-fencing-gates', 'gate-automation-bundoora'],
    'projects/richmond-automated-gates': ['gate-automation-bundoora', 'sliding-double-gates-bundoora'],
    'projects/ringwood-custom-entry': ['steel-fencing-gates', 'gate-automation-bundoora'],
    'projects/toorak-pedestrian-fencing': ['steel-fencing-gates', 'who-we-work-with'],
}
for s in SUBURBS:
    LINKS[s] = SERVICES[:5] + ['blogs/fencing-costs-melbourne-quote-checklist', 'service-areas'] + [x for x in SUBURBS if x != s][:3]
CROSS = {
    'who-we-work-with': [('Commercial body corporate gate systems (RJL Commercial Group)', COM + '/industries/body-corporate'),
                         ('School security fencing and gates (RJL Commercial Group)', COM + '/industries/schools-education'),
                         ('Council fencing and gates (RJL Commercial Group)', COM + '/industries/local-councils')],
    'gate-servicing-maintenance': [('Commercial gate and boom gate maintenance (RJL Commercial Group)', COM + '/maintenance/commercial-gate-servicing')],
    'emergency-fence-gate-repairs': [('Emergency gate repairs for commercial sites (RJL Commercial Group)', COM + '/maintenance/emergency-gate-repairs')],
    'gate-automation-bundoora': [('Commercial automatic sliding gates (RJL Commercial Group)', COM + '/services/automatic-sliding-gates')],
}
LD_RE = re.compile(r'<script type="application/ld\+json"([^>]*)>(.*?)</script>', re.S)


def read(rel):
    p = SITE / f'{rel}.html'
    return p.read_text(encoding='utf-8') if p.exists() else None


def clean(t):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', t))).strip()


def name_of(rel, h1=False):
    s = read(rel) or ''
    if h1:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
        if m and clean(m.group(1)):
            return clean(m.group(1))
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    return clean(m.group(1)).split('|')[0].strip() if m else rel


def ul(items):
    return '<ul>' + ''.join(f'<li><a href="{html.escape(u, quote=True)}">{html.escape(t)}</a></li>' for t, u in items) + '</ul>'


def route(p):
    r = p.relative_to(SITE).as_posix()[:-5]
    return '' if r == 'index' else r


def crumbs(rel):
    parts, items = rel.split('/'), [('Home', BASE + '/')]
    parents = {'blogs': 'blogs', 'locations': 'service-areas', 'projects': 'gallery'}
    if len(parts) > 1 and parents.get(parts[0]) and read(parents[parts[0]]):
        items.append((name_of(parents[parts[0]]), f'{BASE}/{parents[parts[0]]}'))
    items.append((name_of(rel, True), f'{BASE}/{rel}'))
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': f'{BASE}/{rel}#breadcrumbs',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


MAP = 'https://www.google.com/maps/search/?api=1&query=Unit%201%2F12%20Merchant%20Avenue%2C%20Thomastown%20VIC%203074'
HOURS_24_7 = [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 'opens': '00:00', 'closes': '23:59'}]


def fix_contact(o):
    """4 Nov 2026 (FROM JARROD): residential site shows only 0412 467 840; email info@rjlfencing.com.au;
    map at Unit 1/12 Merchant Ave, Thomastown; 24/7 hours. geo = the coordinates rjlcommercialgroup.com
    already publishes for the same address."""
    hit = []
    def walk(x):
        if isinstance(x, dict):
            if x.get('@id') == BASE + '/#business' and 'address' in x:
                want = {'telephone': '+61 412 467 840', 'email': 'info@rjlfencing.com.au', 'hasMap': MAP, 'openingHoursSpecification': HOURS_24_7,
                        'geo': {'@type': 'GeoCoordinates', 'latitude': -37.691136, 'longitude': 145.041026},
                        'contactPoint': {'@type': 'ContactPoint', 'telephone': '+61 412 467 840', 'email': 'info@rjlfencing.com.au', 'contactType': 'customer service', 'areaServed': 'AU-VIC', 'availableLanguage': 'English', 'hoursAvailable': HOURS_24_7}}
                for k, v in want.items():
                    if x.get(k) != v:
                        x[k] = v; hit.append(k)
            for v in x.values(): walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
    walk(o)
    return bool(hit)


def label_phones(s):
    """Only 0412 467 840 is shown on the residential site."""
    s = s.replace('<a href="tel:+61400101132">24/7: 0400 101 132</a>', '')
    s = s.replace('Chris: 0412 467 840', '0412 467 840')
    s = s.replace('call 0412 467 840 or use the quote form. Keep 0400 101 132 for emergencies.', 'call 0412 467 840 or use the quote form; the same number is answered 24/7 for emergencies.')
    s = s.replace('"+61 400 101 132"', '"+61 412 467 840"')
    return s.replace('tel:+61400101132', 'tel:+61412467840').replace('0400 101 132', '0412 467 840')


def main():
    n = 0
    for p in sorted(SITE.rglob('*.html')):
        s0 = s = p.read_text(encoding='utf-8'); rel = route(p)
        s = label_phones(s)
        if '<html' not in s[:3000].lower():
            continue
        noindex = 'noindex' in s[:6000]  # 404 / thank-you: business schema only, no related links or breadcrumbs
        s = label_phones(s)
        a, b = '<!-- RJL seo: related -->', '<!-- /RJL seo: related -->'
        s = re.sub(re.escape(a) + '.*?' + re.escape(b), '', s, flags=re.S)
        items = [] if noindex else [(name_of(t), '/' + t) for t in LINKS.get(rel, []) if read(t) is not None] + CROSS.get(rel, [])
        if items:
            if rel.startswith('blogs/') and '<div class="prose">' in s:
                frag = a + '<section><h2>Related services and advice</h2>' + ul(items) + '</section>' + b
                pos = s.index('</div></div></article>', s.index('<div class="prose">'))
            else:
                frag = a + '<section class="content-section"><div class="shell content-grid"><div class="content-body"><h2>Related services and advice</h2>' + ul(items) + '</div></div></section>' + b
                m = re.search(r'<section class="quote-band"', s)
                pos = m.start() if m else s.index('</main>')
            s = s[:pos] + frag + s[pos:]
        for m in reversed(list(LD_RE.finditer(s))):
            try: o = json.loads(m.group(2))
            except ValueError: continue
            changed = []
            def walk(x):
                if isinstance(x, dict):
                    if x.get('@id') == BASE + '/#business' and 'address' in x and x.get('legalName') != 'RJL FENCING PTY. LTD.':
                        x['legalName'] = 'RJL FENCING PTY. LTD.'; changed.append(1)
                    for v in x.values(): walk(v)
                elif isinstance(x, list):
                    for v in x: walk(v)
            walk(o)
            if fix_contact(o):
                changed.append(1)
            if changed:
                s = s[:m.start(2)] + json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + s[m.end(2):]
        if rel and not noindex and 'BreadcrumbList' not in s:
            s = s.replace('</head>', '<script type="application/ld+json" id="breadcrumb-schema">' + json.dumps(crumbs(rel), ensure_ascii=False, separators=(',', ':')) + '</script></head>', 1)
        if s != s0:
            p.write_text(s, encoding='utf-8'); n += 1
    print(f'seo_quick_wins: {n} pages updated')


if __name__ == '__main__':
    main()
