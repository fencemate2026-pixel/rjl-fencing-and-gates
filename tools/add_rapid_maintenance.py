"""
add_rapid_maintenance.py - Oct 2026 change set (approved by Jarrod, 7 Oct 2026).

1. Site-wide 24/7 Rapid Response bar (gate / fence emergencies -> 0400 101 132).
2. New page: /emergency-fence-gate-repairs
3. New page: /gate-servicing-maintenance (maintenance first; redacted sample report)
4. Nav (desktop + mobile) and footer links to both pages, sitemap entries.

Idempotent: every insertion is guarded by a marker, so re-running is safe.
Every change is appended to tools/audit-log.txt (page, change, count).
"""
import pathlib
import re
import json
import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
LOG = ROOT / 'tools' / 'audit-log.txt'
TEMPLATE = SITE / 'gate-automation-bundoora.html'
BASE = 'https://www.rjlfencingandgates.com.au'
RAPID_TEL = '+61400101132'
RAPID_TXT = '0400 101 132'

audit = []


def log(page, change, n=1):
    audit.append(f'{page}\t{change}\t{n}')


# ------------------------------------------------------------------ shared snippets
RAPID_BAR = (
    '<a class="rapid-bar" data-rjl="rapid-bar" href="tel:' + RAPID_TEL + '">'
    '<span class="rapid-dot" aria-hidden="true"></span>'
    '<strong>24/7 Rapid Response</strong>'
    '<span class="rapid-bar-text"> · Gate stuck or fence down? Call </span>'
    '<b>' + RAPID_TXT + '</b></a>'
)

NAV_DESKTOP_ADD = '<a href="/gate-servicing-maintenance" data-rjl="nav-maint">Servicing</a>'
NAV_MOBILE_ADD = (
    '<a href="/gate-servicing-maintenance" data-rjl="nav-maint"><span>Gate servicing &amp; maintenance</span><b aria-hidden="true">→</b></a>'
    '<a href="/emergency-fence-gate-repairs" data-rjl="nav-rapid"><span>24/7 emergency repairs</span><b aria-hidden="true">→</b></a>'
)
FOOTER_ADD = (
    '<li data-rjl="foot-maint"><a href="/gate-servicing-maintenance">Gate servicing &amp; maintenance</a></li>'
    '<li data-rjl="foot-rapid"><a href="/emergency-fence-gate-repairs">24/7 emergency repairs</a></li>'
)


def patch_common(name, html):
    """Apply site-wide changes to one page."""
    if 'data-rjl="rapid-bar"' not in html:
        html, n = re.subn(r'(<div class="header-top-stack">)', r'\1' + RAPID_BAR, html, count=1)
        log(name, 'added 24/7 Rapid Response bar', n)
    if 'data-rjl="nav-maint"' not in html:
        html, n1 = re.subn(r'(<nav class="desktop-nav"[^>]*><a href="/#services">Services</a>)',
                           r'\1' + NAV_DESKTOP_ADD, html, count=1)
        html, n2 = re.subn(r'(<nav aria-label="Mobile navigation">)', r'\1' + NAV_MOBILE_ADD, html, count=1)
        log(name, 'nav: Servicing (desktop) + servicing/emergency (mobile)', n1 + n2)
    if 'data-rjl="foot-maint"' not in html:
        html, n = re.subn(r'(<h2>Residential services</h2><ul>)', r'\1' + FOOTER_ADD, html, count=1)
        log(name, 'footer: servicing + emergency links', n)
    return html


# ------------------------------------------------------------------ page builder
def build_page(slug, title, desc, og_title, og_desc, hero_img, hero_alt, main_html, jsonld):
    """Create a page from the gate-automation template: same head assets,
    header, footer and scripts; new metadata, <main> and page JSON-LD."""
    t = TEMPLATE.read_text(encoding='utf-8')
    url = f'{BASE}/{slug}'
    t = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', t, count=1, flags=re.S)
    t = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + desc, t, count=1)
    for prop, val in (('og:title', og_title), ('og:description', og_desc), ('og:url', url),
                      ('og:image', f'{BASE}/images/{hero_img}.webp'), ('og:image:alt', hero_alt)):
        t = re.sub(rf'(<meta property="{prop}" content=")[^"]*', r'\g<1>' + val.replace('\\', ''), t, count=1)
    for name_, val in (('twitter:title', og_title), ('twitter:description', og_desc),
                       ('twitter:image', f'{BASE}/images/{hero_img}.webp')):
        t = re.sub(rf'(<meta name="{name_}" content=")[^"]*', r'\g<1>' + val, t, count=1)
    t = re.sub(r'(<link rel="canonical" href=")[^"]*', r'\g<1>' + url, t, count=1)
    t = t.replace('/images/gate-automation-', f'/images/{hero_img}-')  # hero preload srcset
    # Replace <main>…</main> (includes the template's page JSON-LD) with new content.
    t = re.sub(r'<main id="main-content">.*?</main>',
               '<main id="main-content">' + main_html +
               '<script type="application/ld+json">' + json.dumps(jsonld, ensure_ascii=False) + '</script></main>',
               t, count=1, flags=re.S)
    (SITE / f'{slug}.html').write_text(t, encoding='utf-8')
    log(f'{slug}.html', 'created page from gate-automation template', 1)


def hero(eyebrow, h1, lead, crumb, img, alt, buttons):
    srcset = ', '.join(f'/images/{img}-{w}w.webp {w}w' for w in (480, 800, 1200, 1600, 1800))
    return (
        '<section class="page-hero"><div class="shell page-hero-grid"><div>'
        f'<span class="eyebrow">{eyebrow}</span><h1>{h1}</h1><p class="lead">{lead}</p>'
        f'<div class="button-row hero-actions">{buttons}</div>'
        f'<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span><span aria-hidden="true">/</span><b>{crumb}</b></span></nav>'
        f'</div><figure class="page-hero-image"><img src="/images/{img}-1200w.webp" srcset="{srcset}" '
        f'sizes="(max-width: 900px) 100vw, 50vw" alt="{alt}" width="2500" height="1875" fetchPriority="high" decoding="async"/></figure>'
        '</div></section>'
    )


def faq_block(eyebrow, h2, faqs):
    items = ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    return ('<section class="content-section alt"><div class="shell"><div class="section-heading narrow-heading">'
            f'<div><span class="eyebrow">{eyebrow}</span><h2>{h2}</h2></div></div><div class="faq-list">{items}</div></div></section>')


def faq_ld(faqs):
    return {'@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub('<[^>]+>', '', a)}}
        for q, a in faqs]}


RAPID_BTN = f'<a href="tel:{RAPID_TEL}" class="button rapid-button">Call 24/7 · {RAPID_TXT}</a>'
AREAS = ('Bundoora, Mill Park, Thomastown, Epping, Lalor, South Morang, Mernda, Doreen, Greensborough, '
         'Reservoir, Preston, Heidelberg, Watsonia, Macleod, Kingsbury and surrounding suburbs')

# ------------------------------------------------------------------ page: emergency
EMERG_FAQ = [
    ('Is the emergency line really 24/7?',
     f'Yes. The RJL Group Rapid Response line, {RAPID_TXT}, is answered 24 hours a day, 365 days a year, and two team members are on standby day and night.'),
    ('What counts as a gate or fence emergency?',
     'A gate stuck open or closed, an automatic gate that will not lock, a gate that has come off its track or hinges, '
     'or a fence knocked down by a vehicle, storm or break-in that leaves the property open or unsafe.'),
    ('Can you make the site safe straight away?',
     'Yes. RJL brings temporary fence panels and the gear to secure the opening on the first visit, then quotes the permanent repair.'),
    ('Which number do I call for a normal quote?',
     'For non-urgent work and quotes call 0412 467 840 or use the quote form. Keep 0400 101 132 for emergencies.'),
]
emerg_main = (
    hero('24/7 Rapid Response · Melbourne’s north',
         'Gate stuck? Fence down? We answer 24/7.',
         'For urgent gate and fence problems, call the RJL Group Rapid Response line. It is answered day and night, every day of the year.',
         '24/7 emergency repairs', 'sliding-gate',
         'Black sliding driveway gate repaired and secured by RJL',
         RAPID_BTN + '<a href="/contact-us" class="text-link">Non-urgent quote <span>→</span></a>')
    + '<section class="content-section"><div class="shell content-grid"><div><span class="eyebrow">What we respond to</span>'
      '<h2>One call when it cannot wait until morning.</h2></div><div class="content-body">'
      '<ul class="feature-list">'
      '<li>Automatic gate stuck open or closed, or will not lock</li>'
      '<li>Gate off its track, wheels or hinges</li>'
      '<li>Gate motor, remote, keypad or intercom failure</li>'
      '<li>Fence knocked down by a car, storm or break-in</li>'
      '<li>Pool fence or gate damaged, leaving the pool unsafe</li>'
      '<li>Make-safe with temporary fence panels, then a quote for the permanent repair</li></ul>'
      f'<p><a href="tel:{RAPID_TEL}" class="button rapid-button">Call {RAPID_TXT}</a></p>'
      '<p class="small-print">If anyone is in immediate danger, or there is a fire or serious traffic hazard, call 000 first.</p>'
      '</div></div></section>'
    + '<section class="content-section alt"><div class="shell content-grid"><div><span class="eyebrow">After the emergency</span>'
      '<h2>Stop the next call-out.</h2></div><div class="content-body">'
      '<p>Most gate breakdowns come from wear that a service would have picked up: worn wheels, failing motors, loose hinges and dead batteries. '
      'Once your site is safe, ask about a regular gate service so it does not happen again.</p>'
      '<p><a href="/gate-servicing-maintenance" class="text-link">Gate servicing &amp; maintenance plans <span>→</span></a></p></div></div></section>'
    + '<section class="content-section"><div class="shell content-grid"><div><span class="eyebrow">Where we respond</span>'
      '<h2>Local to Melbourne’s north and north-east.</h2></div><div class="content-body">'
      f'<p>{AREAS}. Commercial sites, owners corporations and body corporates from Thomastown through to Dandenong are covered by '
      '<a href="https://www.rjlcommercialgroup.com/rapid-response">RJL Commercial Rapid Response</a>.</p></div></div></section>'
    + faq_block('Emergency FAQ', 'Questions people ask in an emergency.', EMERG_FAQ)
)
emerg_ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'EmergencyService', 'name': 'RJL 24/7 Rapid Response - emergency gate and fence repairs',
     'url': f'{BASE}/emergency-fence-gate-repairs', 'telephone': '+61 400 101 132',
     'openingHoursSpecification': {'@type': 'OpeningHoursSpecification',
                                   'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                                   'opens': '00:00', 'closes': '23:59'},
     'areaServed': {'@type': 'City', 'name': 'Melbourne'},
     'parentOrganization': {'@id': f'{BASE}/#business'}},
    faq_ld(EMERG_FAQ)]}

# ------------------------------------------------------------------ page: servicing
MAINT_FAQ = [
    ('How often should an automatic gate be serviced?',
     'It depends on how often the gate runs. As a guide, a family driveway gate is usually serviced yearly, shared gates in townhouse and apartment '
     'complexes more often, and busy commercial gates monthly. RJL will recommend an interval after the first inspection.'),
    ('What does a gate service include?',
     'Checking and adjusting the motor, gearbox, limits and force settings; wheels, track, rollers and hinges; '
     'safety beams and obstacle detection; remotes, keypads and intercoms; battery backup and manual release; and a written note of anything that needs attention.'),
    ('Is the on-site maintenance report free?',
     'Yes, for owners corporations, body corporates and commercial sites. RJL inspects every gate, boom gate, bollard and access point, '
     'then gives you a written report with photos, a status for each asset and a priority for each fix.'),
]
SAMPLES = ''.join(
    f'<figure class="sample-page"><a href="/images/sample-report-p{i}.webp" target="_blank" rel="noopener">'
    f'<img src="/images/sample-report-p{i}.webp" alt="{alt}" width="1600" height="1131" loading="lazy" decoding="async"/></a>'
    f'<figcaption>{cap}</figcaption></figure>'
    for i, alt, cap in (
        (1, 'Sample RJL maintenance report cover: 8 of 8 assets inspected, status summary and next service date', 'Cover: assets inspected, status summary, next service due'),
        (2, 'Sample RJL maintenance report: service outcome and asset status register with priorities', 'Status register: every asset, what it means on site, action and priority'),
        (3, 'Sample RJL maintenance report: single asset page with fault, service record and photo evidence', 'Asset page: fault found, service record and photo evidence'),
    ))
maint_main = (
    hero('Gate servicing &amp; maintenance · Melbourne’s north',
         'Keep your gate working, before it fails.',
         'Regular servicing for automatic gates, motors, intercoms and access systems, with a written report so you know exactly what condition everything is in.',
         'Gate servicing &amp; maintenance', 'gate-automation',
         'Automatic sliding gate motor being serviced by RJL',
         '<a href="/contact-us" class="button">Book a gate service</a>'
         f'<a href="tel:{RAPID_TEL}" class="text-link">Emergency? 24/7 {RAPID_TXT} <span>↗</span></a>')
    + '<section class="content-section"><div class="shell content-grid"><div><span class="eyebrow">Why service a gate</span>'
      '<h2>A serviced gate is cheaper than an emergency call-out.</h2></div><div class="content-body">'
      '<p>Gate motors, wheels, hinges and batteries wear out gradually. A service catches that wear early, keeps the safety devices working, '
      'and avoids being locked in or out when something finally gives way.</p>'
      '<ul class="feature-list">'
      '<li>Motor, gearbox, limits and force settings checked and adjusted</li>'
      '<li>Wheels, track, rollers, hinges and stops cleaned and checked</li>'
      '<li>Safety beams and obstacle detection tested</li>'
      '<li>Remotes, keypads, intercoms and access control tested</li>'
      '<li>Battery backup and manual release checked</li>'
      '<li>Written notes and photos of anything needing attention</li></ul></div></div></section>'
    + '<section class="content-section alt"><div class="shell"><div class="section-heading narrow-heading"><div>'
      '<span class="eyebrow">See what you get</span><h2>A written report with photos, not a verbal “all good”.</h2>'
      '<p>Example of an RJL monthly maintenance report. Client details removed.</p></div></div>'
      f'<div class="sample-report-grid">{SAMPLES}</div></div></section>'
    + '<section class="content-section"><div class="shell content-grid"><div><span class="eyebrow">Owners corporations &amp; commercial sites</span>'
      '<h2>Free on-site maintenance report.</h2></div><div class="content-body">'
      '<p>For townhouse and apartment complexes, owners corporations, body corporates and commercial sites, RJL inspects every gate, '
      'boom gate, bollard and access point free of charge. You get a written report with photos, a status for every asset and a priority for every fix, '
      'so you can plan and budget instead of paying emergency rates.</p>'
      '<p>RJL already runs preventative maintenance contracts for commercial sites and owners corporations.</p>'
      f'<div class="button-row"><a href="tel:{RAPID_TEL}" class="button">Book a free report · {RAPID_TXT}</a>'
      '<a href="https://www.rjlcommercialgroup.com/maintenance" class="text-link">RJL Commercial maintenance <span>→</span></a></div>'
      '</div></div></section>'
    + faq_block('Servicing FAQ', 'Questions about gate servicing.', MAINT_FAQ)
)
maint_ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Service', 'name': 'Automatic gate servicing and maintenance',
     'serviceType': 'Gate, motor, intercom and access control servicing and preventative maintenance',
     'provider': {'@id': f'{BASE}/#business'}, 'areaServed': {'@type': 'City', 'name': 'Melbourne'},
     'url': f'{BASE}/gate-servicing-maintenance'},
    faq_ld(MAINT_FAQ)]}

# ------------------------------------------------------------------ run
build_page('emergency-fence-gate-repairs',
           'Emergency Gate &amp; Fence Repairs 24/7 | Melbourne North | RJL',
           'Gate stuck open or fence knocked down? RJL Rapid Response answers 24/7 on 0400 101 132 across Bundoora and Melbourne’s north. Make-safe on the first visit.',
           'Emergency Gate &amp; Fence Repairs 24/7 | RJL', 'Gate stuck or fence down? Call RJL Rapid Response 24/7 on 0400 101 132.',
           'sliding-gate', 'Sliding driveway gate secured by RJL', emerg_main, emerg_ld)
build_page('gate-servicing-maintenance',
           'Automatic Gate Servicing &amp; Maintenance | Melbourne North | RJL',
           'Automatic gate, motor and intercom servicing with a written photo report. Free on-site maintenance reports for owners corporations and commercial sites.',
           'Gate Servicing &amp; Maintenance | RJL', 'Regular gate servicing with a written photo report, before it fails.',
           'gate-automation', 'Automatic gate motor serviced by RJL', maint_main, maint_ld)

for page in sorted(SITE.rglob('*.html')):
    name = str(page.relative_to(SITE))
    html = page.read_text(encoding='utf-8')
    new = patch_common(name, html)
    if new != html:
        page.write_text(new, encoding='utf-8')

# sitemap
sm = SITE / 'sitemap.xml'
x = sm.read_text(encoding='utf-8')
today = datetime.date.today().isoformat()
for slug, pr in (('gate-servicing-maintenance', '0.9'), ('emergency-fence-gate-repairs', '0.9')):
    if f'/{slug}<' not in x:
        x = x.replace('</urlset>', f'<url><loc>{BASE}/{slug}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{pr}</priority></url></urlset>')
        log('sitemap.xml', f'added /{slug}', 1)
sm.write_text(x, encoding='utf-8')

with LOG.open('a', encoding='utf-8') as f:
    f.write(f'\n# add_rapid_maintenance.py - {datetime.datetime.now().isoformat(timespec="seconds")}\n')
    f.write('\n'.join(audit) + '\n')
print(len(audit), 'changes logged')
