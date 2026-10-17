#!/usr/bin/env python3
"""
version_examples.py - cache-busts the example pictures on the tool pages.

/assets/ files are cached by browsers (7 days to 1 year). The example pictures keep the same file
names when they are replaced, so visitors kept seeing the old ones. This adds ?v=<content hash> to
every /assets/examples/<file> reference in the site pages and the designer script, so a changed
picture always gets a new address. Run after build_visualiser.py / add_fence_designer.py /
port_visualiser.py (any of those can rewrite the references). Idempotent.
Safety interlock: aborts if a referenced picture does not exist. Logs to tools/audit-log.txt.
Usage:  python3 tools/version_examples.py
"""
import datetime, glob, hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
EX = os.path.join(SITE, 'assets', 'examples')
LOG = os.path.join(ROOT, 'tools', 'audit-log.txt')
REF = re.compile(r'/assets/examples/([A-Za-z0-9._-]+\.(?:webp|jpg|jpeg|png))(?:\?v=[0-9a-f]+)?')


def main():
    targets = glob.glob(os.path.join(SITE, '**', '*.html'), recursive=True) + \
        [p for p in [os.path.join(SITE, 'assets', 'fence-designer.js')] if os.path.exists(p)]
    cache, changed, missing = {}, 0, set()

    def ver(m):
        f = m.group(1); p = os.path.join(EX, f)
        if not os.path.exists(p):
            missing.add(f); return m.group(0)
        if f not in cache:
            cache[f] = hashlib.sha256(open(p, 'rb').read()).hexdigest()[:10]
        return f'/assets/examples/{f}?v={cache[f]}'

    out = {}
    for p in targets:
        t = open(p, encoding='utf-8').read(); u = REF.sub(ver, t)
        if u != t: out[p] = u
    if missing:
        print('ABORTED: referenced pictures not found:', ', '.join(sorted(missing))); sys.exit(1)
    for p, u in out.items():
        open(p, 'w', encoding='utf-8').write(u); changed += 1
    msg = f'example pictures versioned: {len(cache)} files, {changed} files updated'
    print(msg)
    with open(LOG, 'a', encoding='utf-8') as fh:
        fh.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} version_examples: {msg}\n")


if __name__ == '__main__':
    main()
