"""Group existing mobile links without changing their destinations or desktop nav."""
import hashlib
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAV = re.compile(r'<nav aria-label="Mobile navigation">[\s\S]*?</nav>')
LINK = re.compile(r'<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?</a>')


def group_menu(match):
    original = match.group()
    if 'mobile-menu-section' in original:
        return original
    links = [(m[1], m[0]) for m in LINK.finditer(original)]
    used = set()
    def take(paths):
        found = []
        for i, (href, html) in enumerate(links):
            if i not in used and href in paths:
                used.add(i)
                found.append(html)
        return ''.join(found)
    def section(label, paths):
        children = take(paths)
        if not children:
            return ''
        return ('<details class="mobile-menu-section" name="rjl-mobile-sections">'
                f'<summary>{label}</summary><div class="mobile-menu-links">'
                + children + '</div></details>')
    output = '<nav aria-label="Mobile navigation">'
    output += take({'/emergency-fence-gate-repairs'})
    output += section('Services &amp; maintenance', {'/#services', '/gate-servicing-maintenance'})
    output += section('Design tools', {'/fence-designer', '/photo-visualiser'})
    output += take({'/gallery'})
    output += section('Advice &amp; information', {'/blogs', '/pool-fencing-regulations-victoria'})
    output += section('About RJL', {'/about-rjlfencing-and-gates', '/about-rjlfencing-and-gates#community'})
    output += ''.join(html for i, (_, html) in enumerate(links) if i not in used)
    output += '</nav>'
    assert Counter(LINK.findall(original)) == Counter(LINK.findall(output)), 'Mobile destinations changed'
    return output


def apply_mobile_navigation(site):
    css = (ROOT / 'tools/mobile-navigation.css').read_text()
    (site / 'assets/mobile-navigation.css').write_text(css)
    version = hashlib.sha256(css.encode()).hexdigest()[:10]
    count = 0
    for path in site.rglob('*.html'):
        old = path.read_text()
        if not NAV.search(old):
            continue
        new = NAV.sub(group_menu, old)
        new = re.sub(r'<link rel="stylesheet" href="/assets/mobile-navigation\.css[^\"]*"\s*/?>', '', new)
        new = new.replace('</head>', f'<link rel="stylesheet" href="/assets/mobile-navigation.css?v={version}"/></head>', 1)
        if new != old:
            path.write_text(new)
            count += 1
    print(f'Grouped mobile navigation on {count} pages.')


if __name__ == '__main__':
    apply_mobile_navigation(ROOT / 'site')
