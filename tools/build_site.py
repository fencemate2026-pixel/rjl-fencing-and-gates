#!/usr/bin/env python3
"""
build_site.py
-------------
Converts the wget mirror of the live rjlfencingandgates.com.au site (built in
ChatGPT's site builder, React/RSC output) into a plain static HTML site that can
be version-controlled in GitHub and hosted on Netlify, then applies RJL's
content changes:

  1. Service area restricted to Melbourne's north and north-east.
  2. Google reviews given more prominence across the site.

Design notes
  * The React runtime is removed. Every page is already fully server-rendered
    HTML, so content is unchanged; only client-side behaviour is replaced by a
    small vanilla script (/assets/site.js): mobile menu + email enquiry form.
  * The "Ask RJL" assistant is rebuilt in plain JavaScript (/assets/chat.js),
    with the service-area answers updated.
  * Review text is copied verbatim from the live /reviews page (the site's own
    summaries of public Google reviews). No ratings, totals or new reviews are
    invented.
  * Every change is logged to build/audit-log.txt so each edit can be checked.

Usage:  python3 build_site.py <mirror_dir> <out_dir>
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

MIRROR = Path(sys.argv[1])
OUT = Path(sys.argv[2])
AUDIT = []  # (file, description, count)

GOOGLE_URL = ("https://www.google.com/maps/place/RJL+Fencing+Pty+Ltd/@-37.6492188,144.9227316,9z/"
              "data=!4m8!3m7!1s0x6ad648c5b9dfccb5:0x2b249edaace32e5e!8m2!3d-37.6492188!4d144.922045!9m1!1b1!"
              "16s%2Fg%2F11c1tj0trr?entry=ttu&amp;g_ep=EgoyMDI2MDgxOS4wIKXMDSoASAFQAw%3D%3D")

# --------------------------------------------------------------------------
# Approved service area (four groups). Edit here to change the whole site.
# --------------------------------------------------------------------------
AREA_GROUPS = [
    ("North &amp; north-east (our home area)",
     ["Bundoora", "Kingsbury", "Mill Park", "Thomastown", "Lalor", "Epping", "Wollert",
      "South Morang", "Mernda", "Doreen", "Watsonia", "Macleod", "Greensborough", "Plenty"]),
    ("Banyule &amp; Nillumbik",
     ["Rosanna", "Viewbank", "Heidelberg", "Heidelberg West", "Ivanhoe", "Montmorency",
      "Eltham", "Diamond Creek"]),
    ("Darebin &amp; Merri-bek",
     ["Reservoir", "Preston", "Thornbury", "Northcote", "Fawkner", "Coburg", "Glenroy"]),
    ("Hume &amp; Manningham",
     ["Broadmeadows", "Greenvale", "Craigieburn", "Templestowe", "Doncaster"]),
]
COUNCILS = ["City of Whittlesea", "City of Banyule", "City of Darebin", "Nillumbik Shire",
            "Merri-bek City", "Hume City", "City of Manningham"]
REGION = "Melbourne’s north and north-east"

# --------------------------------------------------------------------------
# Review highlights, verbatim from the live /reviews page (checked 21 Aug 2026).
# --------------------------------------------------------------------------
REVIEWS = [
    ("The team arrived on time, worked efficiently, cleaned up each day and communicated clearly with both neighbours.", "Vanessa P", "1 month ago"),
    ("“Don’t bother ringing around, go straight to RJL.”", "Mark Mck", "10 months ago"),
    ("Chris treated a small repair seriously, explained the work clearly and set a realistic timeframe.", "Jessica A", "4 months ago"),
    ("A 56-metre fence replacement was handled with strong communication, flexibility and careful neighbour coordination.", "Karlee Sharman", "4 months ago"),
    ("The completed work measured accurately within millimetres when checked with a level and laser.", "Steve Middleton", "6 months ago"),
    ("RJL quoted and completed the work on time, cleaned up and treated the customer’s elderly parents respectfully.", "Pat G", "9 months ago"),
    ("Prompt, efficient work from a good team, with the timing and price leaving the customer very satisfied.", "Greg Elliott", "10 months ago"),
    ("Great Colorbond installation, easy communication, punctual service and a fair price.", "Sharon M", "10 months ago"),
    ("RJL quoted quickly, finished a large job within days and delivered a wooden fence with no issues.", "David Moore", "8 months ago"),
    ("A difficult sloping-site fence replacement was handled carefully, with the team making sure the details were completed correctly.", "Rose Chara", "1 year ago"),
    ("A complicated pool-fence project was praised for communication, quality, honesty and a result the customer loved.", "Guy Whelan", "4 years ago"),
    ("Reliable at quoting and installation, with a professional, courteous team and a tidy site at completion.", "Sally Kerin", "1 year ago"),
]
REVIEW_COUNT_ON_SITE = 20  # number of highlights on the /reviews page
# Google Business Profile figures, read from Google's own business listing.
GOOGLE_RATING = "4.4"
GOOGLE_COUNT = 62
GOOGLE_CHECKED = "7 October 2026"


def log(fname, what, n=1):
    AUDIT.append((fname, what, n))


def replace(s, old, new, fname, what, required=False):
    n = s.count(old)
    if n:
        s = s.replace(old, new)
        log(fname, what, n)
    elif required:
        raise SystemExit(f"ABORT: expected text not found in {fname}: {what!r}")
    return s


def review_card(text, name, when):
    return (f'<article class="review-card"><span class="stars" aria-label="5 out of 5 stars">★★★★★</span>'
            f'<p>{text}</p><footer><strong>{name}</strong><span>{when} · Google</span></footer></article>')


def reviews_section(cards, heading, section_id):
    """Dark Google-reviews band reusing the site's existing CSS classes."""
    grid = "".join(review_card(*r) for r in cards)
    return (
        f'<section class="reviews-section" aria-labelledby="{section_id}"><div class="shell">'
        f'<div class="section-heading review-heading"><div><span class="eyebrow eyebrow-light">Google customer reviews</span>'
        f'<h2 id="{section_id}">{heading}</h2></div>'
        f'<div class="rating-lockup" aria-label="Google rating {GOOGLE_RATING} out of 5 from {GOOGLE_COUNT} reviews"><strong>{GOOGLE_RATING}</strong><div>'
        f'<span class="stars" aria-hidden="true">★★★★<span class="star-part">★</span></span>'
        f'<span>{GOOGLE_COUNT} Google reviews · {GOOGLE_CHECKED}</span></div></div></div>'
        f'<div class="review-grid">{grid}</div>'
        f'<div class="reviews-actions"><a href="/reviews" class="button button-light">Read review highlights</a>'
        f'<a class="text-link text-link-light" href="{GOOGLE_URL}" target="_blank" rel="noreferrer">See all {GOOGLE_COUNT} reviews on Google <span>↗</span></a>'
        f'<small>Rating and review count as shown on Google on {GOOGLE_CHECKED}. Highlights are summaries of public Google reviews; open Google for full wording and current figures.</small></div>'
        f'</div></section>'
    )


SITE_JS_TAG = '<script src="/assets/site.js" defer></script><script src="/assets/chat.js" defer></script>'


def strip_runtime(s, fname):
    """Remove the React/RSC runtime; keep structured data (ld+json)."""
    n0 = len(re.findall(r"<script\b", s))
    s = re.sub(r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>', "", s, flags=re.S)
    s = re.sub(r'<link rel="modulepreload"[^>]*/>', "", s)
    s = re.sub(r' data-rsc-css-href="[^"]*" data-precedence="[^"]*"', "", s)
    s = re.sub(r'<aside class="chat-widget".*?</aside>', "", s, flags=re.S)
    s = s.replace("<!-- -->", "")
    s = s.replace("</body>", SITE_JS_TAG + "</body>")
    log(fname, f"removed React runtime ({n0 - len(re.findall(r'<script', s)) + 1} scripts), static chat placeholder; added site.js + chat.js")
    return s


def local_asset_links(s, fname):
    """Icons/manifest load from the same domain (relative) so they work on any host."""
    s, n = re.subn(r'(<link rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*?href=")https://www\.rjlfencingandgates\.com\.au/',
                   r'\1/', s)
    log(fname, "icon/manifest links made relative", n)
    return s


def logo_footer_edits(s, fname):
    """Point header/footer logos at the trimmed file; load overrides.css last."""
    s = replace(s, '<img src="/images/rjl-logo.png" alt="RJL Fencing and Gates" width="266" height="98"/>',
                '<img src="/images/rjl-logo-trim.png" alt="RJL Fencing and Gates" width="1200" height="334"/>',
                fname, "header/footer logo -> trimmed file", required=True)
    s = replace(s, '<link rel="preload" href="/images/rjl-logo.png" as="image"/>',
                '<link rel="preload" href="/images/rjl-logo-trim.png" as="image"/>', fname, "logo preload")
    s = replace(s, '<link rel="stylesheet" href="/assets/index-By4YIubB.css"/>',
                '<link rel="stylesheet" href="/assets/index-By4YIubB.css"/><link rel="stylesheet" href="/assets/overrides.css"/>',
                fname, "added overrides.css", required=True)
    return s


def area_edits(s, fname):
    # Site-wide wording: where RJL works.
    s = replace(s, "across Melbourne", f"across {REGION}", fname, "'across Melbourne' -> north/north-east")
    s = replace(s, "for Melbourne homes.", f"for homes in {REGION}.", fname, "footer region wording")
    s = replace(s, ">Melbourne locations<", ">Service areas<", fname, "link label 'Melbourne locations' -> 'Service areas'")
    s = replace(s, "Melbourne locations →", "Our service areas →", fname, "home link label")
    s = replace(s, "Greater Melbourne residential projects", f"Residential projects in {REGION}", fname, "contact coverage line")
    s = replace(s, "RJL is based in Bundoora and considers projects across " + REGION + ". Availability depends on the work required, site access and scheduling; the Service areas page lists common suburbs.",
                "RJL is based in Bundoora and takes residential projects in " + REGION + ". The service areas page lists the suburbs we cover.",
                fname, "FAQ coverage answer")
    s = replace(s, "the Melbourne locations page lists common suburbs", "the service areas page lists the suburbs we cover", fname, "FAQ coverage answer (fallback)")
    # Structured data: business-level service area -> the seven councils.
    served = json.dumps([{"@type": "AdministrativeArea", "name": c} for c in COUNCILS], ensure_ascii=False, separators=(",", ":"))
    s = replace(s, '"areaServed":[{"@type":"City","name":"Bundoora"},{"@type":"City","name":"Melbourne"},{"@type":"AdministrativeArea","name":"Victoria, Australia"}]',
                '"areaServed":' + served, fname, "LocalBusiness areaServed -> 7 councils")
    s = replace(s, '"areaServed":"Melbourne, Victoria"', '"areaServed":"Northern and north-eastern Melbourne, Victoria"', fname, "Service areaServed")
    s = replace(s, '"areaServed":"Melbourne"', '"areaServed":"Northern and north-eastern Melbourne, Victoria"', fname, "Service areaServed (short)")
    return s


def service_areas_page(s, fname):
    groups = "".join(
        f'<section class="area-group"><h2>{title}</h2><div>' + "".join(f"<span>{x}</span>" for x in subs) + "</div></section>"
        for title, subs in AREA_GROUPS)
    new_grid = f'<div class="area-page-grid">{groups}</div>'
    s, n = re.subn(r'<div class="area-page-grid">.*?</section></div>(?=</div></section>)', new_grid, s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("ABORT: service-areas grid not found")
    log(fname, "replaced suburb list with 4 approved groups (34 suburbs)")
    s = replace(s, "<b>Melbourne locations</b>", "<b>Service areas</b>", fname, "breadcrumb")
    s = replace(s, '<span class="eyebrow">Service areas</span><h2>Suburbs where RJL considers projects.</h2>',
                '<span class="eyebrow">Service areas</span><h2>Suburbs we cover.</h2>', fname, "section heading", required=False)
    s = replace(s, "<h2>Suburbs where RJL considers projects.</h2>", "<h2>Suburbs we cover.</h2>", fname, "section heading")
    s = replace(s, "Availability depends on the work required, site access and scheduling. Contact RJL with the address and project details for confirmation.",
                "We take residential work in " + REGION + " only. If your suburb isn’t listed, we’re unlikely to be able to quote.",
                fname, "coverage note", required=True)
    s = replace(s, "RJL considers timber and Colorbond fencing, pool and glass barriers, sliding and double gates, gate automation and retaining-wall projects in the locations listed below.",
                "RJL takes timber and Colorbond fencing, pool and glass barriers, sliding and double gates, gate automation and retaining-wall projects in the suburbs listed below.",
                fname, "hero lead", required=True)
    s = replace(s, "<h2>Discuss your Melbourne fencing project.</h2>", "<h2>Discuss your fencing project.</h2>", fname, "CTA heading")
    s = replace(s, "<title>Fencing Service Areas Melbourne | RJL Fencing</title>",
                "<title>Fencing Service Areas | Melbourne’s North &amp; North-East | RJL Fencing</title>", fname, "title", required=True)
    s = replace(s, '"RJL Fencing Service Areas Melbourne"', '"RJL Fencing Service Areas – Melbourne’s North &amp; North-East"', fname, "og:title")
    s = replace(s, 'content="Melbourne suburbs where RJL considers timber and Colorbond fencing, pool fencing, driveway gates, gate automation and retaining-wall projects."',
                'content="Suburbs in Melbourne’s north and north-east where RJL builds timber and Colorbond fencing, pool fencing, driveway gates, gate automation and retaining walls."',
                fname, "meta description", required=True)
    s = replace(s, 'content="Melbourne locations considered for fencing, gates, automation, pool barriers and retaining-wall projects."',
                'content="Suburbs in Melbourne’s north and north-east covered for fencing, gates, automation, pool barriers and retaining walls."', fname, "og:description")
    # Structured data ItemList -> approved suburbs only.
    items = [s_ for _, subs in AREA_GROUPS for s_ in subs]
    item_list = json.dumps({"@context": "https://schema.org", "@type": "ItemList",
                            "name": "RJL Fencing service areas – Melbourne’s north and north-east",
                            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": f"{n}, Victoria"} for i, n in enumerate(items)]},
                           ensure_ascii=False, separators=(",", ":"))
    s, n = re.subn(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"ItemList".*?</script>',
                   f'<script type="application/ld+json">{item_list}</script>', s, count=1, flags=re.S)
    log(fname, "ItemList structured data -> 34 approved suburbs", n)
    return s


def review_edits(s, fname, page_index):
    # Navigation labels.
    s = replace(s, '<a href="/reviews">Reviews</a>', '<a href="/reviews">Google reviews</a>', fname, "desktop nav label")
    s = replace(s, '<a href="/reviews"><span>Reviews</span>', '<a href="/reviews"><span>Google reviews</span>', fname, "mobile nav label")
    # Red top banner removed at Jarrod's request (7 Oct 2026).
    s, n = re.subn(r'<a href="/reviews" class="group-promise">.*?</a>', "", s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"ABORT: top banner not found in {fname}")
    log(fname, "removed red top banner")
    if fname == "index.html":
        new = reviews_section(REVIEWS[:6], f"{GOOGLE_COUNT} Google reviews from local homeowners.", "reviews-title")
        s, n = re.subn(r'<section class="reviews-section" aria-labelledby="reviews-title">.*?</section>', new, s, count=1, flags=re.S)
        if n != 1:
            raise SystemExit("ABORT: home reviews section not found")
        log(fname, "home reviews: 3 -> 6 cards, Google lockup, stronger CTAs")
    elif fname in INSERT_REVIEWS_ON and 'class="reviews-section"' not in s:
        start = (page_index * 3) % len(REVIEWS)
        cards = (REVIEWS + REVIEWS)[start:start + 3]
        block = reviews_section(cards, "What local homeowners say on Google.", "page-reviews-title")
        if '<section class="quote-band">' not in s:
            raise SystemExit(f"ABORT: no quote band on {fname}")
        s = s.replace('<section class="quote-band">', block + '<section class="quote-band">', 1)
        log(fname, "inserted Google reviews band (3 cards) before closing CTA")
    if fname == "reviews.html":
        s = replace(s, "Open Google for the current rating, total and complete review wording.",
                    f"Rated {GOOGLE_RATING} from {GOOGLE_COUNT} Google reviews ({GOOGLE_CHECKED}). Open Google for the current rating, total and complete review wording.",
                    fname, "reviews page lockup text")
    return s


INSERT_REVIEWS_ON = {
    "timber-colorbond-fencing-melbourne.html", "sliding-double-gates-bundoora.html", "pool-fencing.html",
    "retaining-walls.html", "gate-automation-bundoora.html", "steel-fencing-gates.html", "who-we-work-with.html",
    "service-areas.html", "gallery.html", "about-rjlfencing-and-gates.html", "frequently-asked-questions.html",
    "pool-fencing-regulations-victoria.html",
}

SITE_JS = r"""/*
 * site.js - replaces the two interactive pieces of the former React runtime.
 *  1. Mobile navigation toggle (Escape closes; body class mirrors original).
 *  2. Email enquiry form: builds a pre-filled email (mailto + Gmail/Outlook
 *     fallbacks), identical wording to the original form. No data leaves the
 *     visitor's device; nothing is stored.
 */
(function () {
  "use strict";
  var EMAIL = "info@rjlfencing.com.au";

  // ---- 1. Mobile menu --------------------------------------------------
  var menu = document.querySelector(".mobile-menu");
  if (menu) {
    var btn = menu.querySelector(".mobile-menu-toggle");
    var panel = menu.querySelector(".mobile-menu-panel");
    var setOpen = function (open) {
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      btn.querySelector("span").textContent = open ? "Close" : "Menu";
      panel.hidden = !open;
      document.body.classList.toggle("mobile-nav-open", open);
    };
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  // ---- 2. Email enquiry form ------------------------------------------
  var form = document.querySelector(".email-enquiry form");
  if (form) {
    var status = document.createElement("div");
    form.appendChild(status);
    form.addEventListener("input", function () { status.className = ""; status.innerHTML = ""; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var g = function (k) { return String(d.get(k) || "").trim(); };
      if (!g("name") || !g("message")) {
        status.className = "form-status is-error";
        status.setAttribute("role", "alert");
        status.textContent = "Please enter your name and project details.";
        return;
      }
      var body = ["Hello RJL Fencing and Gates,", "", "I would like to enquire about the following project.", "",
        "Full name: " + g("name"), "Phone: " + g("phone"), "Email: " + g("email"),
        "Suburb / site address: " + g("address"), "Service: " + g("service"), "", "Project details:", g("message")].join("\r\n");
      var subj = "Online%20Enquiry", b = encodeURIComponent(body);
      var mailto = "mailto:" + EMAIL + "?subject=" + subj + "&body=" + b;
      var gmail = "https://mail.google.com/mail/?view=cm&fs=1&to=" + EMAIL + "&su=" + subj + "&body=" + b;
      var outlook = "https://outlook.live.com/mail/0/deeplink/compose?to=" + EMAIL + "&subject=" + subj + "&body=" + b;
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.innerHTML = "<strong>Your enquiry is ready to send.</strong><p>If your email app did not open, choose an option below. Press Send in your email app to submit your enquiry.</p>" +
        '<p><a href="' + mailto + '">Open email app</a> · <a href="' + gmail + '" target="_blank" rel="noopener noreferrer">Gmail</a> · ' +
        '<a href="' + outlook + '" target="_blank" rel="noopener noreferrer">Outlook / Hotmail</a></p>';
      window.location.href = mailto;
    });
  }
})();
"""


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(MIRROR, OUT, ignore=shutil.ignore_patterns("*.rsc", "og.webp"))
    # Drop the React bundles; keep CSS.
    for js in (OUT / "assets").glob("*.js"):
        js.unlink()
    (OUT / "assets" / "site.js").write_text(SITE_JS, encoding="utf-8")
    # Ask RJL assistant (vanilla rebuild; injects its own markup).
    shutil.copy(Path(__file__).with_name("chat.js"), OUT / "assets" / "chat.js")
    # Bigger logo + light footer: trimmed logo file and an override stylesheet.
    shutil.copy(Path(__file__).with_name("logo-trim.png"), OUT / "images" / "rjl-logo-trim.png")
    shutil.copy(Path(__file__).with_name("overrides.css"), OUT / "assets" / "overrides.css")
    log("assets/", "deleted React JS bundles; wrote site.js and chat.js")

    pages = sorted(p for p in OUT.rglob("*.html"))
    for i, p in enumerate(pages):
        fname = str(p.relative_to(OUT))
        s = p.read_text(encoding="utf-8")
        s = strip_runtime(s, fname)
        s = logo_footer_edits(s, fname)
        s = local_asset_links(s, fname)
        s = area_edits(s, fname)
        if fname == "service-areas.html":
            s = service_areas_page(s, fname)
        s = review_edits(s, fname, i)
        p.write_text(s, encoding="utf-8")

    # Safety interlock: no removed suburb may remain anywhere in visible pages.
    banned = ["Officer", "Pakenham", "Berwick", "Cranbourne", "Narre Warren", "Dandenong", "Frankston",
              "Mornington", "Werribee", "Melton", "Bacchus Marsh", "Gisborne", "Healesville", "Lilydale",
              "Geelong", "Macedon", "Yarra Glen", "Sunshine", "Keilor", "Croydon", "Ringwood", "Glen Waverley"]
    problems = []
    # pool-fencing-regulations-victoria lists every council's pool-rules page as
    # a reference guide; those are information links, not service-area claims.
    for p in pages:
        if p.name == "pool-fencing-regulations-victoria.html":
            continue
        txt = p.read_text(encoding="utf-8")
        for b in banned:
            if re.search(r"\b" + re.escape(b) + r"\b", txt):
                problems.append(f"{p.relative_to(OUT)}: {b}")
    if problems:
        raise SystemExit("ABORT: removed suburbs still present:\n" + "\n".join(problems))

    with open(OUT.parent / "audit-log.txt", "w", encoding="utf-8") as fh:
        for f, w, n in AUDIT:
            fh.write(f"{f}\t{w}\t{n}\n")
    print(f"OK: {len(pages)} pages built, {len(AUDIT)} logged edits, banned-suburb check passed")


if __name__ == "__main__":
    main()
