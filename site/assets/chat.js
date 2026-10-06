/*
 * chat.js - "Ask RJL" information assistant (vanilla rebuild of the original).
 *
 * How it works: keyword matching against a fixed set of source-linked
 * answers. Nothing is sent anywhere; no AI, no tracking, no storage. If a
 * question does not match well enough, it refuses to guess and points the
 * visitor to phone/email.
 *
 * Content rules (kept from the original): no invented prices, ratings,
 * review totals, warranties or licences. Answers only restate what the
 * site or the linked public sources say.
 *
 * Service area updated 7 October 2026: Melbourne's north and north-east only.
 */
(function () {
  "use strict";

  var R = {
    name: "RJL Fencing and Gates",
    legalName: "RJL FENCING PTY. LTD.",
    phoneDisplay: "0412 467 840",
    phoneHref: "tel:+61412467840",
    email: "info@rjlfencing.com.au",
    emailHref: "mailto:info@rjlfencing.com.au?subject=Online%20enquiry",
    abn: "82 159 036 781",
    acn: "159 036 781",
    abnLookupUrl: "https://abr.business.gov.au/ABN/View/82159036781",
    base: "Bundoora VIC 3083",
    googleReviewsUrl: "https://www.google.com/maps/place/RJL+Fencing+Pty+Ltd/@-37.6492188,144.9227316,9z/data=!4m8!3m7!1s0x6ad648c5b9dfccb5:0x2b249edaace32e5e!8m2!3d-37.6492188!4d144.922045!9m1!1b1!16s%2Fg%2F11c1tj0trr?entry=ttu&g_ep=EgoyMDI2MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    instagram: "https://www.instagram.com/rjlfencing/",
    facebook: "https://www.facebook.com/Alltypesoffencingandgates/"
  };

  // Approved service area - keep in step with /service-areas.
  var AREAS = ["Bundoora", "Kingsbury", "Mill Park", "Thomastown", "Lalor", "Epping", "Wollert",
    "South Morang", "Mernda", "Doreen", "Watsonia", "Macleod", "Greensborough", "Plenty",
    "Rosanna", "Viewbank", "Heidelberg", "Heidelberg West", "Ivanhoe", "Montmorency", "Eltham",
    "Diamond Creek", "Reservoir", "Preston", "Thornbury", "Northcote", "Fawkner", "Coburg",
    "Glenroy", "Broadmeadows", "Greenvale", "Craigieburn", "Templestowe", "Doncaster"];

  // Places people ask about that are outside the area (answer: no).
  var OUTSIDE = ["officer", "pakenham", "berwick", "narre warren", "cranbourne", "dandenong",
    "frankston", "mornington", "peninsula", "casey", "cardinia", "clyde", "beaconsfield",
    "werribee", "point cook", "tarneit", "melton", "sunshine", "footscray", "williamstown",
    "geelong", "ballarat", "bendigo", "bacchus marsh", "gisborne", "sunbury", "wallan",
    "ringwood", "croydon", "lilydale", "healesville", "glen waverley", "box hill", "knox",
    "rowville", "carrum downs", "keysborough", "springvale", "clayton", "st kilda",
    "brighton", "south yarra", "hawthorn", "kew", "richmond", "carlton", "fitzroy"];

  var SERVICES = "Timber & Colorbond fencing, Sliding & double gates, Pool fencing, Retaining walls, Automatic gates, Steel & feature fencing";
  var CUSTOMERS = "Homeowners, Local councils, Schools & education, Sporting clubs & facilities, Owners corporations & body corporates, Property & facility managers, Builders & developers, Community & care facilities";
  var SOCIAL = [
    { label: "Google Business Profile", href: R.googleReviewsUrl },
    { label: "Official Facebook", href: R.facebook },
    { label: "Official Instagram", href: R.instagram }
  ];

  var KB = [
    { title: "RJL company details", keywords: ["company", "business", "legal", "abn", "acn", "registered", "pty", "name", "who are rjl"],
      answer: R.name + " is the public-facing brand. The Australian Business Register lists the legal entity as " + R.legalName + ", ABN " + R.abn + ", ACN " + R.acn + ". The ABN is active and the main business location is VIC 3083.",
      sources: [{ label: "Australian Business Register", href: R.abnLookupUrl }] },
    { title: "RJL history", keywords: ["history", "started", "established", "founded", "since", "years", "1990", "1997", "2012", "chris", "jarrod"],
      answer: "RJL's published website history traces the family's fencing work to 1990. RJL's official Facebook and Instagram profiles describe the fencing business as established in 1997. The current company ABN has been active since 1 July 2012. These dates describe different milestones, so this assistant shows all three rather than collapsing them into one claim.",
      sources: [{ label: "RJL company story", href: "/about-rjlfencing-and-gates" }, { label: "Official Facebook", href: R.facebook }, { label: "Official Instagram", href: R.instagram }, { label: "Australian Business Register", href: R.abnLookupUrl }] },
    { title: "Contact RJL", keywords: ["contact", "phone", "call", "email", "address", "location", "based", "visit", "open", "hours"],
      answer: "Call " + R.phoneDisplay + " or email " + R.email + ". RJL is based in " + R.base + ". No verified public opening hours or customer walk-in street address are published here, so please call before visiting.",
      sources: [{ label: "Contact RJL", href: "/contact-us" }, { label: "Australian Business Register", href: R.abnLookupUrl }] },
    { title: "Fencing and gate services", keywords: ["service", "services", "build", "install", "fence", "fencing", "gate", "gates", "what do you do"],
      answer: "RJL's published residential services are " + SERVICES + ". Every quote depends on the actual site, access, levels, dimensions, material and approvals.",
      sources: [{ label: "RJL services", href: "/#services" }] },
    { title: "Timber and Colorbond fencing", keywords: ["timber", "paling", "colorbond", "colourbond", "boundary", "privacy fence"],
      answer: "RJL publishes timber and Colorbond boundary fencing as residential services. The suitable system depends on the property, access, ground levels, existing structures and the finish required.",
      sources: [{ label: "Timber and Colorbond fencing", href: "/timber-colorbond-fencing-melbourne" }] },
    { title: "Driveway gates and automation", keywords: ["automatic", "automation", "motor", "remote", "sliding", "swing", "double", "driveway", "intercom", "keypad"],
      answer: "RJL publishes custom sliding, double-swing and pedestrian gates plus automation options such as remotes, safety devices, keypads, intercoms and smart access. Suitability must be assessed from the opening, runback, slope, wind exposure, power and safe operation.",
      sources: [{ label: "Sliding and double gates", href: "/sliding-double-gates-bundoora" }, { label: "Gate automation", href: "/gate-automation-bundoora" }] },
    { title: "Pool fencing", keywords: ["pool", "glass", "barrier", "compliance", "certificate", "bonding", "electrician", "regulation"],
      answer: "RJL publishes glass, aluminium, batten and custom-steel pool barrier services. Victorian requirements depend on the pool's construction date and property circumstances. An appropriately qualified practitioner or authority must confirm compliance; electrical bonding must be assessed by a licensed electrician.",
      sources: [{ label: "Victorian pool fencing guide", href: "/pool-fencing-regulations-victoria" }] },
    { title: "Retaining walls", keywords: ["retaining", "sleeper", "concrete", "drainage", "excavation", "wall"],
      answer: "RJL publishes concrete-sleeper retaining walls and combined fence-and-wall packages. Drainage, excavation, access, engineering and permits can affect whether a proposed solution is suitable.",
      sources: [{ label: "Retaining walls", href: "/retaining-walls" }] },
    { title: "Service areas", keywords: ["area", "areas", "suburb", "suburbs", "where", "melbourne", "travel", "service location", "cover", "do you come"].concat(AREAS.map(function (a) { return a.toLowerCase(); })),
      answer: "RJL takes residential work in Melbourne's north and north-east only: " + AREAS.join(", ") + ". If your suburb isn't listed, we're unlikely to be able to quote.",
      sources: [{ label: "Service areas", href: "/service-areas" }] },
    { title: "Outside our service area", keywords: OUTSIDE, weight: 3,
      answer: "Sorry, that suburb is outside our service area. RJL takes residential work in Melbourne's north and north-east only, so we're unlikely to be able to quote there.",
      sources: [{ label: "Suburbs we cover", href: "/service-areas" }] },
    { title: "Who RJL works with", keywords: ["customer", "customers", "homeowner", "council", "school", "club", "builder", "developer", "commercial", "body corporate", "owners corporation"],
      answer: "RJL publishes work for " + CUSTOMERS + ". The residential website does not claim that every project type is accepted; contact RJL with the scope and location.",
      sources: [{ label: "Who RJL works with", href: "/who-we-work-with" }] },
    { title: "Quotes, cost and timing", keywords: ["quote", "price", "cost", "how much", "metre rate", "time", "timeline", "when", "lead time", "deposit"],
      answer: "RJL does not publish a universal price or lead time because fencing and gate work is site-specific. Send the suburb, photos, approximate dimensions, preferred material, access and level details. Any deposit, payment schedule, inclusions and timing should be confirmed in the written quote and current terms.",
      sources: [{ label: "Request a quote", href: "/contact-us" }, { label: "Terms and conditions", href: "/terms-and-conditions" }] },
    { title: "Google reviews", keywords: ["review", "reviews", "rating", "ratings", "google", "stars", "feedback", "testimonial"],
      answer: "On 7 October 2026 Google showed RJL Fencing with a 4.4 rating from 62 reviews. The reviews page has highlights summarised from those public reviews. Ratings and totals change, so open the live profile for the current figures and complete wording.",
      sources: [{ label: "Live Google reviews", href: R.googleReviewsUrl }, { label: "Review highlights", href: "/reviews" }] },
    { title: "Official social profiles", keywords: ["facebook", "instagram", "social", "socials", "profile", "profiles", "photos", "posts", "followers"],
      answer: "RJL's official public profiles are linked below. They publish project photos and business updates. Live posts, follower counts and other changing platform data are not copied into this assistant; use the profiles for the current information.",
      sources: SOCIAL },
    { title: "Warranty, insurance and licensing", keywords: ["warranty", "guarantee", "insured", "insurance", "licence", "license", "licensed", "certified"],
      answer: "This assistant does not promise a warranty, insurance limit, licence or certification that is not supported by the accepted written quote or current evidence supplied by RJL. Ask the team for the documents that apply to your project before accepting a quote.",
      sources: [{ label: "Contact RJL", href: "/contact-us" }, { label: "Terms and conditions", href: "/terms-and-conditions" }] },
    { title: "Boundaries, permits and neighbour costs", keywords: ["permit", "neighbour", "neighbor", "notice", "pay half", "law", "legal", "easement"],
      answer: "Property boundaries, permits, neighbour contributions and pool-barrier rules depend on the address and circumstances. RJL's guides provide general information only. Confirm legal questions with the relevant Victorian authority or a qualified adviser before work starts.",
      sources: [{ label: "Neighbour fence guide", href: "/blogs/neighbour-wont-pay-half-fence-victoria" }, { label: "Victorian pool fencing guide", href: "/pool-fencing-regulations-victoria" }] },
    { title: "Community support", keywords: ["community", "charity", "big group hug", "donation", "support", "sponsor"],
      answer: "Big Group Hug publicly acknowledged support from the RJL Fencing team, and the charity's 2018–19 annual report also acknowledges RJL Fencing. RJL's website separately publishes its account of helping with the charity's grand opening.",
      sources: [{ label: "Big Group Hug annual report", href: "https://biggrouphug.org/wp-content/uploads/2020/06/Big-Group-Hug-Annual-Report-18_19-FINAL.pdf" }, { label: "RJL community story", href: "/blogs/big-group-hug-grand-opening" }] }
  ];

  var ABOUT = { title: "About RJL Fencing and Gates",
    answer: R.name + " is a fencing, gates and automation business based in " + R.base + ", working in Melbourne's north and north-east. Published services include " + SERVICES + ". The legal entity on the Australian Business Register is " + R.legalName + ", ABN " + R.abn + ". Ask a specific question for source-linked details.",
    sources: [{ label: "Australian Business Register", href: R.abnLookupUrl }].concat(SOCIAL, [{ label: "RJL services", href: "/#services" }]) };

  var UNKNOWN = { title: "That detail is not verified here",
    answer: "I will not guess. Call " + R.phoneDisplay + " or email " + R.email + " so the RJL team can confirm the current answer in writing.",
    sources: [{ label: "Contact RJL", href: "/contact-us" }] };

  /** Pick the best-matching answer; refuse when the match is weak. */
  function match(q) {
    var t = (" " + q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ");
    if (!t.trim() || /\b(everything|overview|about rjl|tell me about|who is rjl|what is rjl)\b/.test(t)) return ABOUT;
    var best = null, top = 0;
    KB.forEach(function (e) {
      var score = e.keywords.reduce(function (sum, k) {
        // Whole-word match so "kew" doesn't match inside "keyword".
        return t.indexOf(" " + k + " ") !== -1 ? sum + (k.indexOf(" ") !== -1 ? 4 : 2) * (e.weight || 1) : sum;
      }, 0);
      if (score > top) { top = score; best = e; }
    });
    return top >= 2 && best ? best : UNKNOWN;
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    var aside = el("aside", { "class": "chat-widget", "aria-label": "Verified RJL information assistant" });
    var panel = el("div", { "class": "chat-panel" });
    panel.hidden = true;

    var head = el("div", { "class": "chat-panel-head" });
    head.appendChild(el("img", { src: "/images/rjl-logo.png", alt: "", width: "110", height: "42" }));
    var hd = el("div");
    hd.appendChild(el("strong", null, "Ask RJL"));
    hd.appendChild(el("span", null, "Source-linked business answers"));
    head.appendChild(hd);
    var close = el("button", { type: "button", "aria-label": "Close information assistant" }, "×");
    head.appendChild(close);
    panel.appendChild(head);

    var note = el("div", { "class": "verified-note" });
    note.appendChild(el("strong", null, "Verified source set"));
    note.appendChild(el("span", null, "Business details checked 30 August 2026 · Service area updated 7 October 2026 · No invented answers"));
    panel.appendChild(note);

    var form = el("form", { "class": "chat-form" });
    form.appendChild(el("label", { "for": "rjl-question" }, "Ask about RJL, services, locations, reviews or company details"));
    var row = el("div");
    var input = el("input", { id: "rjl-question", placeholder: "What would you like to know?", autocomplete: "off", maxlength: "200" });
    row.appendChild(input);
    row.appendChild(el("button", { type: "submit" }, "Ask"));
    form.appendChild(row);
    panel.appendChild(form);

    var opts = el("div", { "class": "chat-options", "aria-label": "Suggested questions" });
    ["Services", "Service areas", "Google reviews", "Company details"].forEach(function (label) {
      var b = el("button", { type: "button" }, label);
      b.addEventListener("click", function () { input.value = label; show(match(label)); });
      opts.appendChild(b);
    });
    panel.appendChild(opts);

    var ans = el("div", { "class": "chat-answer", "aria-live": "polite" });
    panel.appendChild(ans);

    var direct = el("div", { "class": "chat-direct" });
    direct.appendChild(el("a", { href: R.phoneHref }, "Call " + R.phoneDisplay));
    direct.appendChild(el("a", { href: R.emailHref }, "Email RJL"));
    panel.appendChild(direct);

    var launcher = el("button", { "class": "chat-launcher", type: "button", "aria-expanded": "false" });
    launcher.appendChild(el("img", { src: "/images/rjl-logo.png", alt: "", width: "76", height: "28" }));
    var lbl = el("span", null, "Ask RJL");
    launcher.appendChild(lbl);

    aside.appendChild(panel);
    aside.appendChild(launcher);
    document.body.appendChild(aside);

    function show(a) {
      ans.innerHTML = "";
      ans.appendChild(el("h3", null, a.title));
      ans.appendChild(el("p", null, a.answer));
      var src = el("div", { "class": "chat-sources" });
      src.appendChild(el("strong", null, "Sources"));
      a.sources.forEach(function (s) {
        var ext = /^https?:/.test(s.href);
        var link = el("a", ext ? { href: s.href, target: "_blank", rel: "noreferrer" } : { href: s.href }, s.label + " ");
        link.appendChild(el("span", { "aria-hidden": "true" }, "↗"));
        src.appendChild(link);
      });
      ans.appendChild(src);
    }

    function setOpen(open) {
      panel.hidden = !open;
      aside.classList.toggle("is-open", open);
      launcher.setAttribute("aria-expanded", String(open));
      lbl.textContent = open ? "Close" : "Ask RJL";
      if (open) input.focus();
    }

    launcher.addEventListener("click", function () { setOpen(panel.hidden); });
    close.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q) show(match(q));
    });
    show(ABOUT);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
