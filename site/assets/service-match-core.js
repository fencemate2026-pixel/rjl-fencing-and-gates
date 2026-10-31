/* RJL service matching: local, deterministic ranking; no network or storage. */
(function (root) {
  'use strict';
  var aliases = { gates: 'gate', fences: 'fence', fencing: 'fence', repairs: 'repair',
    servicing: 'service', services: 'service', motors: 'motor', bollards: 'bollard',
    barriers: 'barrier', palings: 'paling', colourbond: 'colorbond', aluminum: 'aluminium',
    cantalever: 'cantilever', automated: 'automatic', automation: 'automatic',
    intercoms: 'intercom', remotes: 'remote', walls: 'wall', sleepers: 'sleeper',
    schools: 'school', warehouses: 'warehouse', factories: 'factory' };
  function normalize(value) {
    var text = String(value || '').slice(0, 200).toLowerCase();
    if (text.normalize) text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return text.replace(/[\u2018\u2019']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
      .split(/\s+/).map(function (word) { return aliases[word] || word; }).join(' ');
  }
  function has(text, phrase) { return (' ' + text + ' ').indexOf(' ' + phrase + ' ') !== -1; }
  function positiveText(query) {
    return query.replace(/\b(?:do not need|dont need|not|no|without)\s+(?:a |any )?(?:pool|glass|timber|colorbond|boom|bollard|sliding|swing|cantilever)(?:\s+(?:fence|gate|barrier))?\b/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function isUrgent(query) {
    if (/\b(?:not urgent|no emergency|not an emergency)\b/.test(query)) return false;
    return /\b(?:gate|fence|boom|bollard|barrier|motor|access)\b/.test(query) &&
      /\b(?:emergency|urgent|stuck|broken|wont open|wont close|not opening|not closing|not working|breakdown|crashed|storm damage)\b/.test(query);
  }
  function oneEdit(a, b) {
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length >= b.length) i++;
      if (b.length >= a.length) j++;
    }
    return edits + (i < a.length || j < b.length ? 1 : 0) === 1;
  }
  function match(value, catalog, limit) {
    var query = positiveText(normalize(value));
    var urgent = isUrgent(query);
    var requested = Number.isFinite(limit) ? Math.floor(limit) : 3;
    var count = Math.max(1, Math.min(5, requested));
    if (!query) return { items: [], urgent: false };
    var tokens = query.split(' '), prepared = catalog.map(function (entry) {
      return { entry: entry, terms: entry.keywords.map(normalize) };
    });
    var scored = prepared.map(function (item, index) {
      var score = 0, matched = [];
      if (item.entry.urgent && !urgent) return { service: item.entry, score: 0, index: index, matched: matched };
      Array.from(new Set(item.terms)).forEach(function (term) {
        var frequency = prepared.filter(function (other) { return other.terms.indexOf(term) !== -1; }).length;
        var weight = 1 + Math.log((prepared.length + 1) / (frequency + 1));
        // Broad words must not outweigh a named product such as a cantilever gate.
        if (['gate', 'fence', 'service', 'repair', 'automatic', 'design'].indexOf(term) !== -1) weight *= 0.25;
        if (has(query, term)) {
          score += (term.indexOf(' ') === -1 ? 5 : 12) * weight;
          matched.push(term);
        } else if (term.indexOf(' ') === -1 && tokens.some(function (token) { return oneEdit(token, term); })) {
          score += 2 * weight;
        }
      });
      if (urgent && item.entry.urgent) score += 1000;
      return { service: item.entry, score: score, index: index, matched: matched };
    }).filter(function (item) { return item.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    // Once a specific product is identified, omit weak matches on generic words.
    if (scored.length) {
      var minimum = scored[0].score * 0.2;
      scored = scored.filter(function (item) { return item.score >= minimum; });
    }
    return { items: scored.slice(0, count), urgent: urgent };
  }
  root.RJLServiceMatcher = Object.freeze({ match: match, normalize: normalize });
})(typeof globalThis !== 'undefined' ? globalThis : window);
