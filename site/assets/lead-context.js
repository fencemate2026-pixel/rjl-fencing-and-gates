/* First-touch context for RJL enquiries. Session-only; no customer fields or full URLs are stored. */
(function () {
  'use strict';
  var key = 'rjl-lead-context-v1';
  var forms = ['residential-quote', 'site-assessment', 'free-site-report', 'photo-visualiser'];
  function token(value) {
    var text = String(value || '').trim().slice(0, 80);
    if (!/^[a-z0-9 _.-]*$/i.test(text) || /\d{7}/.test(text)) return '';
    return text.toLowerCase();
  }
  function path(value) {
    try { return new URL(value, location.origin).pathname.slice(0, 200); } catch (error) { return '/'; }
  }
  function fresh() {
    var params = new URLSearchParams(location.search || '');
    var referrer = '';
    try { var ref = new URL(document.referrer); if (ref.hostname !== location.hostname) referrer = ref.hostname; } catch (error) { /* direct visit */ }
    return { source: token(params.get('utm_source')) || referrer || 'direct',
      medium: token(params.get('utm_medium')) || (referrer ? 'referral' : 'none'),
      campaign: token(params.get('utm_campaign')), landing: path(location.href || location.pathname),
      referrer: referrer, created: Date.now() };
  }
  var context = fresh();
  try {
    var previous = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (previous && Number.isFinite(previous.created) && Date.now() - previous.created >= 0 &&
        Date.now() - previous.created < 12 * 60 * 60 * 1000) {
      context = { source: token(previous.source) || 'direct', medium: token(previous.medium) || 'none',
        campaign: token(previous.campaign), landing: path(previous.landing),
        referrer: /^[a-z0-9.-]{1,200}$/i.test(previous.referrer || '') ? previous.referrer : '', created: previous.created };
    }
    sessionStorage.setItem(key, JSON.stringify(context));
  } catch (error) { /* Enquiries remain usable with storage disabled. */ }
  function id() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
      return Array.from(bytes).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    }
    return ''; // The host still assigns its own authoritative submission ID.
  }
  function prepare(form) {
    if (forms.indexOf(form.getAttribute('name')) === -1) return;
    var values = { lead_source: context.source, lead_medium: context.medium, lead_campaign: context.campaign,
      lead_landing: context.landing, lead_referrer: context.referrer };
    Object.keys(values).forEach(function (name) {
      var field = form.querySelector('input[name="' + name + '"]');
      if (field) field.value = values[name];
    });
    var lead = form.querySelector('input[name="lead_id"]');
    if (lead && !lead.value) lead.value = id();
  }
  function init() {
    document.querySelectorAll('form[name]').forEach(prepare);
    document.addEventListener('submit', function (event) { if (event.target && event.target.tagName === 'FORM') prepare(event.target); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
