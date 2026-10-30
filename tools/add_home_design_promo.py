"""Install the isolated design-tools launch banner on the homepage only."""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def apply_home_design_promo(site):
    for suffix in ('css', 'js'):
        content = (ROOT / 'tools' / ('home-design-promo.' + suffix)).read_bytes()
        (site / 'assets' / ('home-design-promo.' + suffix)).write_bytes(content)
    page = site / 'index.html'
    source = page.read_text()
    source = re.sub(r'<!-- RJL home design launch -->[\s\S]*?<!-- /RJL home design launch -->\n?', '', source)
    source = re.sub(r'<link rel="stylesheet" href="/assets/home-design-promo\.css[^\"]*"\s*/?>', '', source)
    source = re.sub(r'<script src="/assets/home-design-promo\.js[^\"]*" defer></script>', '', source)
    promo = (ROOT / 'tools/home-design-promo.html').read_text()
    css_version = hashlib.sha256((site / 'assets/home-design-promo.css').read_bytes()).hexdigest()[:10]
    js_version = hashlib.sha256((site / 'assets/home-design-promo.js').read_bytes()).hexdigest()[:10]
    anchor = '<main id="main-content">'
    if source.count(anchor) != 1:
        raise ValueError('Homepage main-content landmark is missing or duplicated')
    source = source.replace(anchor, anchor + promo, 1)
    source = source.replace('</head>', f'<link rel="stylesheet" href="/assets/home-design-promo.css?v={css_version}"/></head>', 1)
    source = source.replace('</body>', f'<script src="/assets/home-design-promo.js?v={js_version}" defer></script></body>', 1)
    page.write_text(source)
    print('Homepage design-tools launch banner installed.')


if __name__ == '__main__':
    apply_home_design_promo(ROOT / 'site')
