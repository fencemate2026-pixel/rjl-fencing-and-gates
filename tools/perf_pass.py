#!/usr/bin/env python3
"""perf_pass.py - merge each page's stylesheets into one file (Nov 2026, mobile LCP).

Every page links 5-7 small stylesheets; on a slow mobile connection each one is a separate
render-blocking request. This joins a page's local stylesheets, in their original order (so the
cascade is identical), into /assets/bundle-<id>.css. Pages with the same set share one file, so it
stays cached between pages. The source files stay the place to edit.

The bundle link keeps its sources in data-bundle="...", so the pass is reversible and idempotent:
each run expands the bundle back to the original links, refreshes ?v= hashes and rebuilds the bundles.
Run after editing any stylesheet:   python3 tools/perf_pass.py
"""
import hashlib, re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / 'site'
ASSETS = SITE / 'assets'
LINK = re.compile(r'<link rel="stylesheet" href="(/assets/[^"?]+\.css)(?:\?v=[^"]*)?"\s*/?>')
BUNDLE = re.compile(r'<link rel="stylesheet" href="/assets/bundle-[0-9a-f]+\.css\?v=[^"]*" data-bundle="([^"]+)"\s*/?>')


def md5(b):
    return hashlib.md5(b).hexdigest()


def expand(s):
    return BUNDLE.sub(lambda m: ''.join(f'<link rel="stylesheet" href="{u}"/>' for u in m.group(1).split()), s)


def main():
    for old in ASSETS.glob('bundle-*.css'):
        old.unlink()
    made = {}
    for p in sorted(SITE.rglob('*.html')):
        if p.name.startswith('__'):
            continue
        s = expand(p.read_text(encoding='utf-8'))
        head_end = s.find('</head>')
        links = [m for m in LINK.finditer(s) if m.start() < head_end]
        if len(links) < 2:
            p.write_text(s, encoding='utf-8')
            continue
        # Only merge when nothing else that affects the cascade sits between the links.
        between = s[links[0].start():links[-1].end()]
        if '<style' in between:
            print('perf_pass: skipped (inline style between links)', p.relative_to(SITE))
            continue
        srcs = [m.group(1) for m in links]
        datas = [(ASSETS / u.split('/assets/', 1)[1]).read_bytes() for u in srcs]
        versioned = ' '.join(f'{u}?v={md5(d)[:8]}' for u, d in zip(srcs, datas))
        name = f'bundle-{md5(" ".join(srcs).encode())[:8]}.css'
        if name not in made:
            body = b''.join(b'/* ' + u.encode() + b' */\n' + d.rstrip() + b'\n' for u, d in zip(srcs, datas))
            (ASSETS / name).write_bytes(body)
            made[name] = md5(body)[:8]
        tag = f'<link rel="stylesheet" href="/assets/{name}?v={made[name]}" data-bundle="{versioned}"/>'
        # The bundle takes the first link's place; the other links are removed.
        out, last = [], 0
        for i, m in enumerate(links):
            out.append(s[last:m.start()])
            if i == 0:
                out.append(tag)
            last = m.end()
        out.append(s[last:])
        p.write_text(''.join(out), encoding='utf-8')
    print(f'perf_pass: {len(made)} stylesheet bundles')


if __name__ == '__main__':
    main()
