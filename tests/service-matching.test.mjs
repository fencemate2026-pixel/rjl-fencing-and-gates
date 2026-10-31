import test from 'node:test';
import assert from 'node:assert/strict';
await import('../site/assets/service-match-core.js');
globalThis.window = globalThis;
await import('../site/assets/service-catalog.js');
const { match } = globalThis.RJLServiceMatcher;
const { services, siteId } = globalThis.RJLServiceCatalog;
const top = query => match(query, services).items[0]?.service.id;
const cases = siteId === 'residential' ? [
  ['Colourbond boundary fencing', 'timber-colorbond'],
  ['glass pool fence', 'pool-fencing'],
  ['sliding driveway gates', 'driveway-gates'],
  ['intercom and remote motor', 'gate-automation'],
  ['retaining wall sleepers', 'retaining-walls'],
  ['not a pool fence, need timber palings', 'timber-colorbond'],
  ['upload my photo', 'photo-visualiser'],
  ['retaning wall', 'retaining-walls'],
  ['gate servicing', 'gate-maintenance']
] : [
  ['ANPR number plate reader', 'access-control'],
  ['boom gate', 'boom-gates'],
  ['cantalever gate', 'cantilever-gates'],
  ['anti-tailgating Optex', 'access-integration'],
  ['Magic Keys portal', 'magickeys'],
  ['national multi-site maintenance', 'nationwide'],
  ['free on-site report', 'free-report'],
  ['not boom gates, need rising bollards', 'bollards'],
  ['body corporate servicing', 'body-corporate']
];
for (const [query, expected] of cases) {
  test(`${query} leads to ${expected}`, () => assert.equal(top(query), expected));
}
test('urgent faults lead with the emergency service', () => {
  for (const query of ['gate stuck closed', 'gate won’t open', 'gate not closing', 'urgent broken gate']) {
    const result = match(query, services);
    assert.equal(result.urgent, true, query);
    assert.equal(result.items[0].service.id, 'emergency-repairs', query);
  }
});
test('negated urgency does not trigger the emergency prompt', () => {
  assert.equal(match('not urgent, routine gate maintenance', services).urgent, false);
  assert.equal(match('not an emergency, gate service', services).urgent, false);
});
test('specific searches omit weak matches on a generic gate or fence term', () => {
  const query = siteId === 'commercial' ? 'boom gate' : 'Colorbond fence';
  const expected = siteId === 'commercial' ? 'boom-gates' : 'timber-colorbond';
  assert.deepEqual(match(query, services).items.map(x => x.service.id), [expected]);
});
test('unrelated, blank and malicious-looking input has no forced recommendation', () => {
  for (const value of ['', '   ', 'plumbing', 'urgent plumber repair', '<script>alert(1)</script>']) {
    const result = match(value, services);
    assert.equal(result.items.length, 0, value);
    assert.equal(result.urgent, false, value);
  }
});
test('matching is deterministic, bounded and does not repeat catalog entries', () => {
  const first = match('gate', services, 3);
  assert.deepEqual(first, match('gate', services, 3));
  assert.ok(first.items.length <= 3);
  assert.equal(new Set(first.items.map(x => x.service.id)).size, first.items.length);
  assert.ok(match('gate', services, 100).items.length <= 5);
  assert.deepEqual(match('gate' + ' '.repeat(200) + 'pool', services), match('gate', services));
});
