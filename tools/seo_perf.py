"""
seo_perf.py - performance, accessibility and technical-SEO pass.

Called by build_site.py after the content edits. Every change is driven by a
specific Lighthouse failure measured on the live site on 7 Oct 2026, or by a
technical-SEO gap found in the audit:

  Performance
    * Responsive WebP images (480/800/1200/1600w) with srcset/sizes, lazy
      loading below the fold; the LCP hero image is preloaded with
      imagesrcset. (Lighthouse: uses-responsive-images, modern-image-formats,
      LCP 7.6 s.)
    * Logos converted to right-sized WebP. (modern-image-formats)
    * Unneeded image preloads removed so the hero loads first.
    * Cache-busting ?v=<hash> on CSS/JS so they can be cached for a year.
      (uses-long-cache-ttl)
  Accessibility
    * Mobile menu button accessible name matches its visible text.
      (label-content-name-mismatch)
  SEO
    * 404 page: noindex, no canonical.
    * Titles over 60 characters shortened by trimming the brand suffix.
    * LocalBusiness: opening hours as published on the Google Business
      Profile; logo points at the trimmed logo.
    * sitemap.xml regenerated with lastmod; 404 excluded.
    * Privacy policy: analytics/advertising section (wording approved by
      Jarrod Alebakis, 7 Oct 2026).
"""
import hashlib
import json
import re
from pathlib import Path

from PIL import Image

WIDTHS = [480, 800, 1200, 1600]
SITE = "https://www.rjlfencingandgates.com.au"
TODAY = "2026-10-07"

# Hours exactly as shown on RJL's Google Business Profile (fetched 7 Oct 2026).
HOURS = [
    {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
     "opens": "08:00", "closes": "17:00"},
    {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday"], "opens": "09:00", "closes": "17:00"},
]

PRIVACY_SECTION = (
    "<h2>Website analytics and advertising</h2>"
    "<p>We use Google Analytics and Google Ads to understand how visitors use this website and to measure enquiries "
    "from our advertising. These services use cookies and similar technology to collect information such as pages "
    "visited, device and browser type, approximate location, and actions taken on the site (for example, tapping our "
    "phone number). If you enter details into our enquiry form, Google may receive a scrambled (hashed) version of "
    "contact details such as your email address, so an enquiry can be matched to an ad. We do not sell this "
    "information. You can opt out of Google Analytics at "
    '<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">tools.google.com/dlpage/gaoptout</a> '
    "and manage ad personalisation at "
    '<a href="https://adssettings.google.com" target="_blank" rel="noreferrer">adssettings.google.com</a>.</p>'
)


def _variants(out: Path, rel: str, log):
    """Create WebP width variants for one raster image. Returns [(url, w)]."""
    src = out / rel.lstrip("/")
    im = Image.open(src)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "transparency" in im.info or im.mode in ("LA", "P") else "RGB")
    stem = src.with_suffix("")
    made = []
    widths = [w for w in WIDTHS if w < im.width] + [min(im.width, 2000)]
    for w in sorted(set(widths)):
        h = round(im.height * w / im.width)
        dest = Path(f"{stem}-{w}w.webp")
        im.resize((w, h), Image.LANCZOS).save(dest, "WEBP", quality=76, method=6)
        made.append((("/" + str(dest.relative_to(out))).replace("\\", "/"), w))
    log("images/", f"{rel}: {len(made)} WebP sizes", len(made))
    return made


def _logo_webp(out: Path, rel: str, height_px: int, log):
    """Right-size a logo to 2x its displayed height as WebP."""
    src = out / rel.lstrip("/")
    im = Image.open(src).convert("RGBA")
    h = min(im.height, height_px * 2)
    w = round(im.width * h / im.height)
    dest = src.with_suffix(".webp")
    im.resize((w, h), Image.LANCZOS).save(dest, "WEBP", quality=85, method=6)
    log("images/", f"{rel} -> {dest.name} {w}x{h}")
    return "/" + str(dest.relative_to(out)).replace("\\", "/")


def build_images(out: Path, log):
    """Returns maps used to rewrite <img> tags."""
    srcsets = {}
    for p in sorted((out / "images").glob("*")):
        if p.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg") and not re.search(r"-\d+w$", p.stem) \
                and not p.name.startswith("rjl-logo"):
            rel = "/images/" + p.name
            srcsets[rel] = _variants(out, rel, log)
    logos = {
        "/images/rjl-logo-trim.png": _logo_webp(out, "/images/rjl-logo-trim.png", 84, log),
        "/images/rjl-logo.png": _logo_webp(out, "/images/rjl-logo.png", 84, log),
        "/client-logos/cfa.png": _logo_webp(out, "/client-logos/cfa.png", 58, log),
        "/client-logos/victoria-police.png": _logo_webp(out, "/client-logos/victoria-police.png", 58, log),
    }
    return srcsets, logos


def _sizes_for(tag: str, context: str):
    if "res-hero-image" in tag:
        return "100vw"
    if "page-hero-image" in context:
        return "(max-width: 900px) 100vw, 50vw"
    return "(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 600px"


def rewrite_images(s: str, fname: str, srcsets, logos, log):
    hero_preload = None

    def repl(m):
        nonlocal hero_preload
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        if src in logos:
            return tag.replace(f'src="{src}"', f'src="{logos[src]}"')
        if src not in srcsets:
            return tag
        variants = srcsets[src]
        fallback = max((v for v in variants if v[1] <= 1200), key=lambda v: v[1], default=variants[0])[0]
        context = s[max(0, m.start() - 120):m.start()]
        sizes = _sizes_for(tag, context)
        srcset = ", ".join(f"{u} {w}w" for u, w in variants)
        new = tag.replace(f'src="{src}"', f'src="{fallback}" srcset="{srcset}" sizes="{sizes}"')
        is_hero = re.search(r'fetchPriority="high"', tag, re.I) is not None
        if is_hero and hero_preload is None:
            hero_preload = (srcset, sizes)
        elif not is_hero and "loading=" not in new:
            new = new.replace("<img ", '<img loading="lazy" ', 1)
        if "decoding=" not in new:
            new = new.replace("<img ", '<img decoding="async" ', 1)
        return new

    s = re.sub(r"<img\b[^>]*>", repl, s)
    # Drop every image preload, then preload only this page's hero image.
    n_pre = len(re.findall(r'<link rel="preload" href="[^"]+" as="image"[^>]*/>', s))
    s = re.sub(r'<link rel="preload" href="[^"]+" as="image"[^>]*/>', "", s)
    if hero_preload:
        srcset, sizes = hero_preload
        s = s.replace("<title>", f'<link rel="preload" as="image" imagesrcset="{srcset}" imagesizes="{sizes}" fetchpriority="high"/><title>', 1)
    log(fname, f"responsive images; removed {n_pre} image preloads; hero preload={'yes' if hero_preload else 'no'}")
    return s


def asset_versions(out: Path):
    v = {}
    for p in (out / "assets").glob("*.*"):
        if p.suffix in (".css", ".js"):
            v["/assets/" + p.name] = hashlib.md5(p.read_bytes()).hexdigest()[:8]
    return v


def cache_bust(s: str, versions):
    for path, h in versions.items():
        s = s.replace(f'"{path}"', f'"{path}?v={h}"')
    return s


def seo_edits(s: str, fname: str, log):
    # Mobile menu: accessible name must contain the visible text ("Menu").
    s = s.replace(' aria-label="Open navigation"', "")
    # Long titles: shorten brand suffix (Google truncates around 60 chars).
    m = re.search(r"<title>(.*?)</title>", s)
    if m and len(m.group(1).replace("&amp;", "&")) > 60 and m.group(1).endswith(" | RJL Fencing"):
        short = m.group(1)[: -len(" | RJL Fencing")] + " | RJL"
        s = s.replace(m.group(0), f"<title>{short}</title>", 1)
        log(fname, "title shortened")
    # LocalBusiness: opening hours (from Google Business Profile) + trimmed logo.
    hours = json.dumps(HOURS, separators=(",", ":"))
    if '"priceRange":"$$"' in s and "openingHoursSpecification" not in s:
        s = s.replace('"priceRange":"$$"', '"priceRange":"$$","openingHoursSpecification":' + hours)
        log(fname, "LocalBusiness opening hours added")
    s = s.replace('"logo":"https://www.rjlfencingandgates.com.au/images/rjl-logo.png"',
                  '"logo":"https://www.rjlfencingandgates.com.au/images/rjl-logo-trim.png"')
    if fname == "404.html":
        s = re.sub(r'<link rel="canonical"[^>]*/>', "", s)
        s = s.replace("<title>", '<meta name="robots" content="noindex"/><title>', 1)
        log(fname, "404 set to noindex")
    if fname == "privacy-policy.html":
        if "<h2>Contact</h2>" not in s:
            raise SystemExit("ABORT: privacy policy Contact heading not found")
        s = s.replace("<h2>Contact</h2>", PRIVACY_SECTION + "<h2>Contact</h2>", 1)
        s = s.replace("<strong>Last updated:</strong> 11 September 2026", "<strong>Last updated:</strong> 7 October 2026")
        log(fname, "privacy: analytics/advertising section added (approved wording)")
    return s


def write_sitemap(out: Path, pages, log):
    urls = []
    for p in pages:
        rel = str(p.relative_to(out)).replace("\\", "/")
        if rel == "404.html":
            continue
        path = "" if rel == "index.html" else "/" + rel[:-5]
        pri = "1.0" if path == "" else ("0.6" if path.startswith("/blogs/") or path in ("/privacy-policy", "/terms-and-conditions") else "0.8")
        urls.append(f"<url><loc>{SITE}{path}</loc><lastmod>{TODAY}</lastmod><priority>{pri}</priority></url>")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"
    (out / "sitemap.xml").write_text(xml, encoding="utf-8")
    log("sitemap.xml", f"regenerated with {len(urls)} URLs + lastmod")
