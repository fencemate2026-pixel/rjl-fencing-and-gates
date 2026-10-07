"""
add_suburb_pages.py - SEO change set, 8 Oct 2026 (Jarrod gave full permission to change and push).

1. Four suburb pages built from /fencing-bundoora:
   /fencing-mill-park, /fencing-epping, /fencing-south-morang, /fencing-greensborough
   Council facts checked 8 Oct 2026 (Wikipedia suburb infoboxes):
     Mill Park 3082, Epping 3076, South Morang 3752 -> City of Whittlesea
     Greensborough 3088 -> City of Banyule and Shire of Nillumbik
   No invented projects, prices or response times. Reviews section reused as-is
   (same real Google reviews already on the Bundoora page).
2. Links: service-areas suburb chips -> pages; footer "Company" column; Bundoora page "nearby" links.
3. Sitemap entries.
4. Titles over 60 characters and descriptions over 160 characters shortened.

Idempotent: re-running rebuilds the four pages and skips links already present.
Every change is appended to tools/audit-log.txt.
"""
import datetime
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
LOG = ROOT / 'tools' / 'audit-log.txt'
BASE = 'https://www.rjlfencingandgates.com.au'
audit = []


def log(page, change, n=1):
    audit.append(f'{page}\t{change}\t{n}')


COUNCIL_LINKS = {
    'Whittlesea': ('https://www.whittlesea.vic.gov.au/Services/Building-planning-and-development/Building-and-construction-applications/Fences',
                   'Whittlesea: property fence information ↗'),
    'Banyule': ('https://www.banyule.vic.gov.au/Planning-building/Do-I-need-a-permit',
                'Banyule: check whether a building or planning permit is needed ↗'),
    'Nillumbik': ('https://www.nillumbik.vic.gov.au/Develop/Building/Building-permits/1-The-building-permit-process/Do-I-need-a-building-permit',
                  'Nillumbik: do I need a building permit? ↗'),
}

SUBURBS = [
    dict(slug='fencing-mill-park', name='Mill Park', pc='3082', councils=['Whittlesea'], img='timber-fence',
         council_text='Mill Park is in the City of Whittlesea, so fence, front-fence, retaining-wall and pool-barrier questions go to Whittlesea council. Overlays, easements, corner sight lines and the height of a front fence can still change the approval path, so the exact property must be checked.',
         intro='Mill Park is close to our Bundoora base, so the team can see the site, measure the boundary and talk through materials before you commit to anything.',
         nearby=['fencing-bundoora', 'fencing-south-morang', 'fencing-epping', 'fencing-greensborough']),
    dict(slug='fencing-epping', name='Epping', pc='3076', councils=['Whittlesea'], img='sliding-gate',
         council_text='Epping is in the City of Whittlesea, so fence, front-fence, retaining-wall and pool-barrier questions go to Whittlesea council. Overlays, easements, corner sight lines and the height of a front fence can still change the approval path, so the exact property must be checked.',
         intro='RJL works across Epping from our base in nearby Bundoora: replacement boundary fences shared with neighbours, new front fences, driveway gates and automation, pool barriers and retaining walls.',
         nearby=['fencing-mill-park', 'fencing-south-morang', 'fencing-bundoora']),
    dict(slug='fencing-south-morang', name='South Morang', pc='3752', councils=['Whittlesea'], img='gate-automation',
         council_text='South Morang is in the City of Whittlesea, so fence, front-fence, retaining-wall and pool-barrier questions go to Whittlesea council. Overlays, easements, corner sight lines and the height of a front fence can still change the approval path, so the exact property must be checked.',
         intro='RJL takes residential fencing, gate and retaining work in South Morang from our base in nearby Bundoora, including sloping blocks where the fence, gate and retaining wall need to be planned together.',
         nearby=['fencing-mill-park', 'fencing-epping', 'fencing-greensborough', 'fencing-bundoora']),
    dict(slug='fencing-greensborough', name='Greensborough', pc='3088', councils=['Banyule', 'Nillumbik'], img='pool-black',
         council_text='Greensborough is split between Banyule City Council and Nillumbik Shire Council. Check which council your address falls in (it is on your rates notice) before assuming a permit rule. Overlays, vegetation, easements, sloping ground and front-fence height can all change the approval path.',
         intro='Greensborough is next to Bundoora, where RJL is based. The team can assess the boundary, slope, gate opening, pool area and retaining needs before recommending a material or system.',
         nearby=['fencing-bundoora', 'fencing-mill-park', 'fencing-south-morang']),
]
NAMES = {s['slug']: s['name'] for s in SUBURBS}
NAMES['fencing-bundoora'] = 'Bundoora'


def faq_items(sb):
    n = sb['name']
    council = ('the City of Whittlesea' if sb['councils'] == ['Whittlesea']
               else 'Banyule City Council or Nillumbik Shire Council, depending on the address')
    return [
        (f'What residential fencing does RJL install in {n}?',
         'RJL installs timber paling and feature fencing, Colorbond boundary fencing, custom steel front fencing, pool and glass fencing, pedestrian gates, sliding driveway gates and double swing gates.'),
        (f'Which council rules apply to a fence in {n}?',
         f'Properties in {n} ({sb["pc"]}) are in {council}. The address, title, zone and overlays decide which checks apply, so confirm the permit pathway before construction.'),
        (f'Can RJL automate a driveway gate in {n}?',
         'Yes. RJL can build a new sliding or swing gate with automation, or assess whether a suitable existing gate can be motorised safely and reliably.'),
        ('What if my neighbour will not pay half for a new boundary fence?',
         'Victoria’s Fences Act sets out a notice process for shared boundary fences. RJL’s homeowner guide explains the steps; get legal advice for a dispute.'),
        (f'How do I request a fencing quote in {n}?',
         'Send the suburb, approximate length or gate opening, preferred material, access notes and clear photos. RJL will review them and confirm the next practical step.'),
    ]


def hero_img(tpl, key):
    """Reuse the service-card <img> for this photo as the hero image."""
    m = re.search(rf'<img src="/images/{key}-[0-9]+w\.webp"[^>]*>', tpl)
    tag = m.group(0)
    tag = re.sub(r'sizes="[^"]*"', 'sizes="(max-width: 900px) 100vw, 50vw"', tag)
    return tag.replace('loading="lazy"', 'fetchPriority="high"')


def build(tpl, sb):
    n, slug = sb['name'], sb['slug']
    url = f'{BASE}/{slug}'
    title = f'Fencing {n} | Timber, Colorbond &amp; Gates | RJL' + (' Fencing' if len(n) <= 9 else '')
    desc = (f'Fencing in {n}: timber and Colorbond fences, pool fencing, sliding and double gates, gate automation '
            f'and retaining walls from RJL, based in nearby Bundoora.')
    if len(desc) > 158:
        desc = f'Fencing in {n}: timber and Colorbond fences, pool fencing, driveway gates, gate automation and retaining walls from RJL in nearby Bundoora.'
    og = f'Residential Fencing &amp; Gates {n} | RJL'
    ogd = f'Residential fencing, custom gates, pool barriers, automation and retaining walls in {n} from a Bundoora-based team.'
    s = tpl
    s = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + html.escape(desc, quote=False), s, count=1)
    for a in ('property="og:title"', 'name="twitter:title"'):
        s = re.sub(rf'(<meta {a} content=")[^"]*', lambda m: m.group(1) + og, s, count=1)
    for a in ('property="og:description"', 'name="twitter:description"'):
        s = re.sub(rf'(<meta {a} content=")[^"]*', lambda m: m.group(1) + ogd, s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, s, count=1)
    s = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, s, count=1)
    s = re.sub(r'(<meta name="keywords" content=")[^"]*',
               lambda m: m.group(1) + f'fencing {n},fencing contractor {n},Colorbond fencing {n},timber fencing {n},pool fencing {n},driveway gates {n},gate automation {n},retaining walls {n}', s, count=1)

    main_start, main_end = s.find('<main'), s.find('</main>') + len('</main>')
    m = s[main_start:main_end]
    # hero
    m = m.replace('<span class="eyebrow">Bundoora fencing, gates &amp; retaining</span>',
                  f'<span class="eyebrow">{n} fencing, gates &amp; retaining</span>', 1)
    m = m.replace('<h1>Residential fencing and gates in Bundoora</h1>', f'<h1>Residential fencing and gates in {n}</h1>', 1)
    m = m.replace('<b>Fencing Bundoora</b>', f'<b>Fencing {n}</b>', 1)
    m = re.sub(r'<figure class="page-hero-image"><img[^>]*></figure>',
               lambda _: f'<figure class="page-hero-image">{hero_img(tpl, sb["img"])}</figure>', m, count=1)
    # intro
    nearby = ', '.join(f'<a href="/{x}">{NAMES[x]}</a>' for x in sb['nearby'])
    intro = (f'<div><span class="eyebrow">Your {n} fencing contractor</span><h2>Plan the boundary, gate and ground as one project.</h2></div>'
             f'<div class="content-body"><p>{sb["intro"]}</p>'
             '<p>Every quote is built around the actual site: the existing fence, access, levels, the gate opening, any pool area and what the neighbours share. You get clear written project information, which helps when a boundary fence is shared.</p>'
             '<ul class="feature-list"><li>Family-led Melbourne fencing with a published multi-decade history</li>'
             '<li>Timber, Colorbond, steel and pool fencing, custom gates and automation from one team</li>'
             '<li>Existing fence removal, access and levels considered during scoping</li>'
             '<li>Clear written project information for neighbour-shared boundary work</li>'
             f'<li>24/7 Rapid Response for gate or fence emergencies: <a href="/emergency-fence-gate-repairs">0400 101 132</a></li></ul>'
             f'<p>Nearby suburb pages: {nearby}. See all <a href="/service-areas">service areas</a>.</p></div>')
    m = re.sub(r'<div><span class="eyebrow">Your Bundoora fencing contractor</span>.*?</ul></div>', lambda _: intro, m, count=1, flags=re.S)
    m = m.replace('View Bundoora service <span>→</span>', 'View service <span>→</span>')
    # council checks
    links = ''.join(f'<li><a class="source-link" href="{COUNCIL_LINKS[c][0]}" target="_blank" rel="noreferrer">{COUNCIL_LINKS[c][1]}</a></li>' for c in sb['councils'])
    links += ('<li><a href="/blogs/neighbour-wont-pay-half-fence-victoria" class="source-link">RJL guide: when a neighbour will not pay half →</a></li>'
              '<li><a href="/pool-fencing-regulations-victoria" class="source-link">RJL guide: Victorian pool barrier and council information →</a></li>')
    m = m.replace('<span class="eyebrow">Bundoora property checks</span>', f'<span class="eyebrow">{n} property checks</span>', 1)
    m = re.sub(r'<p>Bundoora is divided across Banyule, Darebin and Whittlesea\..*?</p><ul class="spec-list">.*?</ul>',
               lambda _: f'<p>{sb["council_text"]}</p><ul class="spec-list">{links}</ul>', m, count=1, flags=re.S)
    # FAQ
    items = faq_items(sb)
    det = ''.join(f'<details><summary>{html.escape(q, quote=False)}</summary><p>{html.escape(a, quote=False)}</p></details>' for q, a in items)
    m = m.replace('<span class="eyebrow">Bundoora fencing FAQ</span>', f'<span class="eyebrow">{n} fencing FAQ</span>', 1)
    m = re.sub(r'<div class="faq-list">.*?</div></div></section>', lambda _: f'<div class="faq-list">{det}</div></div></section>', m, count=1, flags=re.S)
    m = m.replace('<h2>Request a Bundoora residential fencing quote.</h2>', f'<h2>Request a {n} residential fencing quote.</h2>', 1)
    # structured data
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Service', 'name': f'Residential fencing and gates in {n}',
         'serviceType': 'Residential fencing, gates, pool barriers, automation and retaining walls',
         'provider': {'@id': f'{BASE}/#business'},
         'areaServed': {'@type': 'City', 'name': f'{n}, Victoria'}, 'url': url},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in items]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': f'Fencing {n}', 'item': url}]}]}
    m = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@graph":\[\{"@type":"Service".*?</script>',
               lambda _: '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')) + '</script>', m, count=1, flags=re.S)
    s = s[:main_start] + m + s[main_end:]
    left = [w for w in ('Bundoora fencing', 'in Bundoora</h1>', 'Bundoora service') if w in s[main_start:main_start + len(m)]]
    if left:
        raise SystemExit(f'{slug}: template text left behind: {left}')
    (SITE / f'{slug}.html').write_text(s, encoding='utf-8')
    log(f'{slug}.html', f'created suburb page (title {len(html.unescape(title))}, desc {len(desc)})')


TITLE_FIX = {
    'blogs/neighbour-wont-pay-half-fence-victoria.html': 'Neighbour won’t pay half for a fence in Victoria? | RJL',
    'blogs/pool-fencing-requirements-victoria.html': 'Pool fencing requirements in Victoria: a checklist | RJL',
    'blogs/sliding-vs-swing-driveway-gates.html': 'Sliding or swing driveway gate? How to choose | RJL',
    'blogs/timber-vs-colorbond-fencing-melbourne.html': 'Timber or Colorbond fencing in Melbourne? | RJL',
    'gate-servicing-maintenance.html': 'Automatic Gate Servicing &amp; Maintenance Melbourne | RJL',
}
DESC_FIX = {
    'index.html': 'Bundoora-based RJL builds timber and Colorbond fences, pool fencing, sliding and double gates, gate automation and retaining walls in Melbourne’s north.',
    '404.html': 'Bundoora-based RJL builds timber and Colorbond fences, pool fencing, sliding and double gates, gate automation and retaining walls in Melbourne’s north.',
    'fencing-bundoora.html': 'Fencing in Bundoora from a Bundoora-based team: timber and Colorbond fences, pool fencing, sliding and double gates, automation and retaining walls.',
    'sliding-double-gates-bundoora.html': 'Custom sliding driveway gates, double swing gates and pedestrian gates made and installed by RJL in Bundoora and Melbourne’s north and north-east.',
    'who-we-work-with.html': 'Fencing, gates and access works for homeowners, councils, schools, sporting clubs, owners corporations and builders across Melbourne’s north and north-east.',
}


def main():
    tpl = (SITE / 'fencing-bundoora.html').read_text(encoding='utf-8')
    for sb in SUBURBS:
        build(tpl, sb)

    # title / description fixes
    for page, t in TITLE_FIX.items():
        p = SITE / page
        s = p.read_text(encoding='utf-8')
        s2 = re.sub(r'<title>.*?</title>', f'<title>{t}</title>', s, count=1)
        if s2 != s:
            p.write_text(s2, encoding='utf-8')
            log(page, f'title shortened to {len(html.unescape(t))}')
    for page, d in DESC_FIX.items():
        p = SITE / page
        s = p.read_text(encoding='utf-8')
        s2 = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + d, s, count=1)
        if s2 != s:
            p.write_text(s2, encoding='utf-8')
            log(page, f'description shortened to {len(d)}')

    # service-areas: suburb chips become links
    p = SITE / 'service-areas.html'
    s = p.read_text(encoding='utf-8')
    for slug, n in NAMES.items():
        s, k = re.subn(rf'<span>{n}</span>', f'<a href="/{slug}">{n}</a>', s, count=1)
        if k:
            log('service-areas.html', f'chip linked: {n}')
    p.write_text(s, encoding='utf-8')

    # Bundoora page: nearby suburb links
    p = SITE / 'fencing-bundoora.html'
    s = p.read_text(encoding='utf-8')
    if 'data-rjl="nearby"' not in s:
        near = ', '.join(f'<a href="/{sb["slug"]}">{sb["name"]}</a>' for sb in SUBURBS)
        s, k = re.subn(r'(<li>Direct phone and online enquiries to the Bundoora-based team</li></ul>)',
                       rf'\1<p data-rjl="nearby">Nearby suburb pages: {near}. See all <a href="/service-areas">service areas</a>.</p>', s, count=1)
        p.write_text(s, encoding='utf-8')
        log('fencing-bundoora.html', 'nearby suburb links', k)

    # footer links on every page
    foot = ''.join(f'<li data-rjl="foot-{sb["slug"]}"><a href="/{sb["slug"]}">Fencing in {sb["name"]}</a></li>' for sb in SUBURBS)
    n = 0
    for p in SITE.rglob('*.html'):
        s = p.read_text(encoding='utf-8')
        if 'data-rjl="foot-fencing-mill-park"' in s:
            continue
        s2 = s.replace('<li><a href="/fencing-bundoora">Fencing in Bundoora</a></li>',
                       '<li><a href="/fencing-bundoora">Fencing in Bundoora</a></li>' + foot, 1)
        if s2 != s:
            p.write_text(s2, encoding='utf-8')
            n += 1
    log('*', 'footer suburb links', n)

    # sitemap
    sm = SITE / 'sitemap.xml'
    x = sm.read_text(encoding='utf-8')
    today = datetime.date.today().isoformat()
    for sb in SUBURBS:
        if f'/{sb["slug"]}<' not in x:
            x = x.replace('</urlset>', f'<url><loc>{BASE}/{sb["slug"]}</loc><lastmod>{today}</lastmod><priority>0.8</priority></url>\n</urlset>')
            log('sitemap.xml', f'added {sb["slug"]}')
    sm.write_text(x, encoding='utf-8')

    with LOG.open('a', encoding='utf-8') as f:
        f.write(f'\n# add_suburb_pages.py - {datetime.datetime.now().isoformat(timespec="seconds")}\n' + '\n'.join(audit) + '\n')
    print(f'{len(audit)} changes logged')


if __name__ == '__main__':
    main()
