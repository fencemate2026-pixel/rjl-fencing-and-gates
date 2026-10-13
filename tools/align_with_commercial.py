#!/usr/bin/env python3
"""Align rjlfencingandgates.com.au with rjlcommercialgroup.com (13 Oct 2026).

What it does (idempotent - safe to run twice):
  1. Adds a "24/7 Rapid Response" tab as the first item of the desktop menu on every page,
     and moves the Rapid Response link to the top of the mobile menu.
  2. Appends one CSS block to site/assets/overrides.css:
       - page header (hero) titles use the same size rule as RJL Commercial
         (clamp 30-56 px) and the heroes are shorter, site-wide;
       - hero intro text in plain sentence case like RJL Commercial;
       - every "Request a quote" button is orange (header, mobile menu, quote bands);
       - styling for the Rapid Response tab (red, pulsing dot; no animation when the
         visitor has reduced motion turned on).
  3. Bumps the overrides.css ?v= cache key on every page so browsers fetch the new file.
Every run is appended to tools/audit-log.txt.
"""
import datetime, hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
CSS = SITE / "assets" / "overrides.css"
LOG = ROOT / "tools" / "audit-log.txt"
MARK = "/* align-with-commercial 2026-10-13 */"

DESKTOP_NAV = '<nav class="desktop-nav" aria-label="Primary navigation">'
RAPID_TAB = '<a href="/emergency-fence-gate-repairs" class="nav-rapid" data-rjl="nav-rapid-tab">24/7 Rapid Response</a>'
MOBILE_NAV = '<nav aria-label="Mobile navigation">'
OLD_MOBILE_RAPID = ('<a href="/emergency-fence-gate-repairs" data-rjl="nav-rapid"><span>24/7 emergency repairs</span>'
                    '<b aria-hidden="true">→</b></a>')
NEW_MOBILE_RAPID = ('<a href="/emergency-fence-gate-repairs" class="mobile-rapid" data-rjl="nav-rapid">'
                    '<span>24/7 Rapid Response · gate stuck or fence down</span><b aria-hidden="true">→</b></a>')

CSS_BLOCK = MARK + """
/* 1. Page headers: same title size rule as RJL Commercial, shorter heroes site-wide */
html body :is(.res-hero-content,.page-hero,.regulation-hero) h1{
  font-size:clamp(30px,4.4vw,56px)!important;line-height:1.12!important;letter-spacing:-.025em!important;
  max-width:1000px;margin-bottom:18px!important}
html body .res-hero-content h1 em{letter-spacing:-.02em!important}
html body :is(.res-hero-content,.page-hero,.regulation-hero) :is(h1 ~ p):not(.eyebrow){
  font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;font-size:1rem!important;font-weight:400!important;
  line-height:1.65!important;text-transform:none!important;letter-spacing:normal!important;max-width:760px}
html body .res-hero{min-height:0!important}
html body .res-hero-content{min-height:520px!important;padding:56px 0 140px!important;justify-content:center!important}
html body :is(.page-hero,.regulation-hero){padding-top:56px!important;padding-bottom:56px!important}
@media (max-width:900px){
  html body .res-hero-content{min-height:0!important;padding:44px 0 36px!important}
  html body :is(.page-hero,.regulation-hero){padding-top:40px!important;padding-bottom:40px!important}
}

/* 2. Request a quote = orange, same as RJL Commercial's main buttons */
html body .site-header .button,
html body .mobile-menu-actions a[href="/contact-us"],
html body a.button.button-light[href^="/contact-us"]{
  background:var(--orange-bright,#f36f21)!important;border-color:var(--orange-bright,#f36f21)!important;color:var(--navy,#071f38)!important}
html body .site-header .button:hover,html body .site-header .button:focus-visible,
html body .mobile-menu-actions a[href="/contact-us"]:hover,
html body a.button.button-light[href^="/contact-us"]:hover{
  background:var(--orange,#d95420)!important;border-color:var(--orange,#d95420)!important;color:#fff!important}

/* 3. 24/7 Rapid Response tab */
html body .desktop-nav a.nav-rapid{color:#b3121f!important;font-weight:800;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
html body .desktop-nav a.nav-rapid::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:#e0202a;animation:rjlRapidPulse 1.8s ease-out infinite}
html body .desktop-nav a.nav-rapid:hover,html body .desktop-nav a.nav-rapid:focus-visible{color:#7d0a14!important}
html body .mobile-menu-panel a.mobile-rapid{background:#9e0f1b;color:#fff!important;border-radius:8px;padding-left:14px;padding-right:14px}
html body .mobile-menu-panel a.mobile-rapid b{color:#fff}
@keyframes rjlRapidPulse{0%{box-shadow:0 0 0 0 rgba(224,32,42,.55)}70%{box-shadow:0 0 0 7px rgba(224,32,42,0)}100%{box-shadow:0 0 0 0 rgba(224,32,42,0)}}
@media (prefers-reduced-motion:reduce){html body .desktop-nav a.nav-rapid::before{animation:none}}
"""


def log(msg):
    with LOG.open("a") as f:
        f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} align_with_commercial: {msg}\n")


def main():
    pages = sorted(SITE.rglob("*.html"))
    css = CSS.read_text()
    if MARK not in css:
        CSS.write_text(css.rstrip() + "\n\n" + CSS_BLOCK)
    ver = hashlib.sha1(CSS.read_bytes()).hexdigest()[:8]
    changed, problems = 0, []
    for p in pages:
        s = o = p.read_text()
        if DESKTOP_NAV in s and RAPID_TAB not in s:
            s = s.replace(DESKTOP_NAV, DESKTOP_NAV + RAPID_TAB, 1)
        if OLD_MOBILE_RAPID in s:                       # move to the top of the mobile menu, renamed
            s = s.replace(OLD_MOBILE_RAPID, "", 1)
            s = s.replace(MOBILE_NAV, MOBILE_NAV + NEW_MOBILE_RAPID, 1)
        s = re.sub(r"overrides\.css\?v=[0-9a-f]+", f"overrides.css?v={ver}", s)
        if DESKTOP_NAV in s and RAPID_TAB not in s:
            problems.append(f"{p.name}: tab not added")
        if MOBILE_NAV in s and NEW_MOBILE_RAPID not in s:
            problems.append(f"{p.name}: mobile rapid link not moved")
        if s != o:
            p.write_text(s); changed += 1
    log(f"{changed}/{len(pages)} pages updated, overrides.css v={ver}, problems={problems or 'none'}")
    print(changed, "pages updated; css v", ver, "; problems:", problems or "none")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
