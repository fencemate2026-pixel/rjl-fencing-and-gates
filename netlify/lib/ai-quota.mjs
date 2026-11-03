import { randomUUID } from 'node:crypto';

// One conditional write reserves both limits. Separate read/increment/write
// counters lose updates when several Function instances run concurrently.
const RETRIES = 12;
function count(value) {
  if (value == null) return 0;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid quota record');
  return value;
}

export async function reserveAIQuota(store, { day, visitor, dailyCap, visitorCap }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[a-f0-9]{24}$/.test(visitor) ||
      !Number.isSafeInteger(dailyCap) || dailyCap < 1 ||
      !Number.isSafeInteger(visitorCap) || visitorCap < 1) throw new Error('Invalid quota configuration');
  // Carry today's existing counts forward when upgrading; do not reset usage.
  const [oldDay, oldVisitor] = await Promise.all([
    store.get('day-' + day, { type: 'json', consistency: 'strong' }),
    store.get('v-' + day + '-' + visitor, { type: 'json', consistency: 'strong' }),
  ]);
  const legacyTotal = count(oldDay?.n), legacyVisitor = count(oldVisitor?.n);
  const key = 'quota-v2-' + day, token = randomUUID();
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const entry = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const state = entry ? entry.data : { n: legacyTotal, visitors: {}, reservations: {} };
    if (!state || typeof state.visitors !== 'object' || !state.visitors ||
        typeof state.reservations !== 'object' || !state.reservations) throw new Error('Invalid quota record');
    const total = count(state.n), mine = count(state.visitors[visitor] ?? legacyVisitor);
    if (total >= dailyCap) return { ok: false, reason: 'site' };
    if (mine >= visitorCap) return { ok: false, reason: 'visitor' };
    if (entry && typeof entry.etag !== 'string') throw new Error('Missing quota version');
    const next = { n: total + 1, visitors: { ...state.visitors, [visitor]: mine + 1 },
      reservations: { ...state.reservations, [token]: visitor } };
    const result = await store.setJSON(key, next, entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true });
    if (result.modified) return { ok: true, key, token, visitor, total: total + 1, used: mine + 1, left: visitorCap - mine - 1 };
  }
  throw new Error('Quota is busy');
}

export async function refundAIVisitor(store, reservation) {
  // Failed provider attempts retain the global budget slot, because an attempt
  // can still incur provider usage. Refund only this visitor's retry allowance.
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const entry = await store.getWithMetadata(reservation.key, { type: 'json', consistency: 'strong' });
    if (!entry || entry.data?.reservations?.[reservation.token] !== reservation.visitor) return false;
    if (typeof entry.etag !== 'string') throw new Error('Missing quota version');
    const state = entry.data;
    const visitors = { ...state.visitors, [reservation.visitor]: Math.max(0, count(state.visitors[reservation.visitor]) - 1) };
    const reservations = { ...state.reservations }; delete reservations[reservation.token];
    const result = await store.setJSON(reservation.key, { n: count(state.n), visitors, reservations }, { onlyIfMatch: entry.etag });
    if (result.modified) return true;
  }
  throw new Error('Quota is busy');
}
