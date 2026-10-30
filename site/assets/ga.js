/*
 * ga.js - Google Analytics 4 for rjlfencingandgates.com.au
 * Property: RJL Fencing Pty Ltd, Measurement ID G-N0LPMXRT3D.
 *
 * Kept as an external file (not inline) so the site's Content-Security-Policy
 * can stay strict (script-src 'self' + googletagmanager).
 *
 * Lead events sent (no personal details are ever included - no names,
 * phone numbers, emails or form text; only the page and the link type):
 *   phone_click        - visitor taps/clicks a tel: link
 *   email_click        - visitor clicks a mailto: link
 *   form_start         - first input/change in the online quote form
 *   generate_lead      - Netlify accepted an online quote submission
 *   design_quote_added - a saved design was transferred to the quote form
 *   chat_open          - visitor opens the Ask RJL assistant
 *   google_reviews_click - visitor opens the Google review profile
 * Mark these as Key events in GA4 (Admin > Events) once they first appear.
 */
(function () {
  "use strict";
  var ID = "G-N0LPMXRT3D";

  // Do not record visits from local testing or Netlify preview links.
  var host = location.hostname;
  if (host !== "www.rjlfencingandgates.com.au" && host !== "rjlfencingandgates.com.au") return;

  // Load the Google tag after the page has finished loading (or on the first
  // interaction, whichever comes first) so it does not slow the first paint.
  // Events raised before then are queued in dataLayer and sent once it loads.
  var loaded = false;
  function loadTag() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
  }
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (t) {
    window.addEventListener(t, loadTag, { once: true, passive: true });
  });
  window.addEventListener("load", function () { setTimeout(loadTag, 2500); });

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  // Quote and address query strings can contain personal information.
  // Report only the origin and route, including for the initial page view.
  var pageLocation = location.origin + location.pathname;
  var referrer = "";
  try { var ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } catch (error) { /* no referrer */ }
  gtag("config", ID, { page_location: pageLocation, page_referrer: referrer });

  function send(name, extra) {
    var p = { page_path: location.pathname, page_location: pageLocation };
    // Keep event metadata bounded; never copy form values or URL queries.
    var allowed = { link_location: ["header", "footer", "chat", "page"], form_name: ["residential-quote"], tool: ["fence-designer", "photo-visualiser"] };
    if (extra) Object.keys(extra).forEach(function (key) {
      if (allowed[key] && allowed[key].indexOf(extra[key]) !== -1) p[key] = extra[key];
    });
    gtag("event", name, p);
  }

  // Clicks on phone, email and Google review links (header, footer, buttons, chat).
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a) {
      var href = a.getAttribute("href") || "";
      var where = a.closest("header") ? "header" : a.closest("footer") ? "footer" :
                  a.closest(".chat-widget") ? "chat" : "page";
      if (href.indexOf("tel:") === 0) send("phone_click", { link_location: where });
      else if (href.indexOf("mailto:") === 0) send("email_click", { link_location: where });
      else if (href.indexOf("google.com/maps/place/RJL") !== -1) send("google_reviews_click", { link_location: where });
    }
    var launcher = e.target.closest && e.target.closest(".chat-launcher");
    // aria-expanded flips after this handler runs; "false" here means it is opening.
    if (launcher && launcher.getAttribute("aria-expanded") === "false") send("chat_open");
  }, true);

  document.addEventListener("rjl:quote-start", function () {
    send("form_start", { form_name: "residential-quote" });
  });
  // Only emitted after the host acknowledges the multipart POST.
  document.addEventListener("rjl:quote-submitted", function () {
    send("generate_lead", { form_name: "residential-quote" });
  });
  document.addEventListener("rjl:design-quote-added", function () {
    send("design_quote_added", { tool: "fence-designer" });
  });
})();
