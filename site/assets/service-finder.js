/* The visitor's search is used only in memory. Analytics gets catalog IDs, never search text. */
(function () {
  'use strict';
  var config = window.RJLServiceCatalog, matcher = window.RJLServiceMatcher;
  var form = document.getElementById('service-finder-form');
  if (!form || !config || !matcher) return;
  var input = document.getElementById('service-finder-query');
  var results = document.getElementById('service-finder-results');
  var status = document.getElementById('service-finder-status');
  var urgent = document.getElementById('service-finder-urgent');
  // Only enable the form after both the matcher and the catalog are available.
  form.hidden = false;
  document.querySelectorAll('[data-service-example]').forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', function () { input.value = button.dataset.serviceExample; search(); });
  });
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function track(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) { /* navigation remains available */ }
  }
  function card(service, position) {
    var article = el('article', 'service-finder-card');
    article.appendChild(el('span', 'service-finder-number', String(position + 1).padStart(2, '0')));
    var heading = el('h3'), link = el('a', '', service.title);
    link.href = service.href;
    heading.appendChild(link); article.appendChild(heading);
    article.appendChild(el('p', '', service.description));
    var action = el('a', 'service-finder-quote', service.urgent ? 'Call the response team' : 'Discuss this project');
    action.href = service.urgent ? config.urgentPhone : config.contact + '?service=' + encodeURIComponent(service.quoteService);
    article.appendChild(action);
    [link, action].forEach(function (anchor) {
      anchor.addEventListener('click', function () {
        track('service_match_click', { service_id: service.id, finder_site: config.siteId });
      });
    });
    return article;
  }
  function search() {
    var value = input.value.trim();
    results.replaceChildren();
    urgent.hidden = true;
    if (!value) {
      status.textContent = 'Enter a few words about your project, or browse all services below.';
      input.focus(); return;
    }
    var found = matcher.match(value, config.services, 3);
    if (found.urgent) urgent.hidden = false;
    found.items.forEach(function (item, index) { results.appendChild(card(item.service, index)); });
    status.textContent = found.items.length ? found.items.length + ' suggested ' + (found.items.length === 1 ? 'service' : 'services') + '. Explore the options below.' :
      'We couldn’t find a clear match. Browse all services below or contact the RJL team for help.';
    track('service_match_results', { result_count: found.items.length, finder_site: config.siteId });
    // Announce results and place keyboard users at their heading, without an animated scroll.
    var heading = document.getElementById('service-finder-results-title');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); search(); });
})();
