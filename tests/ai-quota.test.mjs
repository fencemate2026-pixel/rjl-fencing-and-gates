import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveAIQuota, refundAIVisitor } from '../netlify/lib/ai-quota.mjs';

function store(legacy = {}) {
  const records = new Map(); let version = 0;
  return {
    async get(key) { return structuredClone(legacy[key] ?? null); },
    async getWithMetadata(key) { return structuredClone(records.get(key) ?? null); },
    async setJSON(key, data, options) {
      const current = records.get(key);
      if (options.onlyIfNew && current || options.onlyIfMatch && options.onlyIfMatch !== current?.etag) return { modified: false };
      const etag = '"' + (++version) + '"'; records.set(key, { data: structuredClone(data), etag });
      return { modified: true, etag };
    },
  };
}
const day = '2026-11-03';
const visitor = (n) => n.toString(16).padStart(24, '0');
const options = (n, dailyCap = 8, visitorCap = 4) => ({ day, visitor: visitor(n), dailyCap, visitorCap });

test('parallel visitors cannot reserve more than the site budget', async () => {
  const s = store();
  const results = await Promise.allSettled(Array.from({ length: 24 }, (_, n) => reserveAIQuota(s, options(n))));
  assert.equal(results.filter(r => r.status === 'fulfilled' && r.value.ok).length, 8);
  assert.equal((await s.getWithMetadata('quota-v2-' + day)).data.n, 8);
});

test('parallel requests from one visitor cannot bypass their allowance', async () => {
  const s = store();
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => reserveAIQuota(s, options(1, 60))));
  assert.equal(results.filter(r => r.status === 'fulfilled' && r.value.ok).length, 4);
});

test('a failed request refunds once without losing another reservation or global usage', async () => {
  const s = store(), a = await reserveAIQuota(s, options(1)), b = await reserveAIQuota(s, options(1));
  await Promise.all([refundAIVisitor(s, a), refundAIVisitor(s, a)]);
  const state = (await s.getWithMetadata(a.key)).data;
  assert.equal(state.n, 2); assert.equal(state.visitors[visitor(1)], 1);
  assert.equal(state.reservations[b.token], visitor(1));
});

test('deploying the new limiter preserves existing daily and visitor counts', async () => {
  const s = store({ ['day-' + day]: { n: 7 }, ['v-' + day + '-' + visitor(1)]: { n: 3 } });
  const r = await reserveAIQuota(s, options(1));
  assert.equal(r.total, 8); assert.equal(r.used, 4); assert.equal(r.left, 0);
  assert.deepEqual(await reserveAIQuota(s, options(2)), { ok: false, reason: 'site' });
});

test('conflicting writes and storage failure do not issue a reservation', async () => {
  const s = store(); s.setJSON = async () => ({ modified: false });
  await assert.rejects(reserveAIQuota(s, options(1)), /busy/);
  s.getWithMetadata = async () => { throw new Error('offline'); };
  await assert.rejects(reserveAIQuota(s, options(1)), /offline/);
});
