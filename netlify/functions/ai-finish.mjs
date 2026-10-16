/*
 * /api/ai-finish - optional AI photo-real finish for the photo visualiser (Netlify Function).
 * Approved by Jarrod Alebakis (RJL) on 16 Oct 2026.
 *
 * The visitor first reads a notice on the page and presses "I agree". The browser then sends the
 * concept (their photo with RJL's true-scale 3D product drawn in) as a JPEG. This function asks a
 * Gemini image model, through the Netlify AI Gateway (keys injected by Netlify at runtime; usage
 * billed to the team's Netlify credits; the gateway only routes to zero-data-retention providers),
 * to make the product look photographed without changing the design, size or position, or anything
 * else in the photo. The true-scale 3D concept stays the reference; the page labels the AI image.
 *
 * Safety interlocks (privacy, cost, abuse):
 *   - same-site requests only (Origin must be one of RJL's two sites or their Netlify previews)
 *   - body must carry consent: true (set only by the page's "I agree" button)
 *   - POST JSON only; image must be a JPEG/PNG data URL <= 2.5 MB
 *   - per-visitor limit AI_PER_IP_DAY (default 4/day) keyed on a salted daily hash of the IP (raw IPs not stored)
 *   - site-wide daily cap AI_DAILY_CAP (default 60/day) so a burst cannot run up credits
 *   - 50 s time-out (sync functions stop at 60 s); failed calls do not use up the visitor's allowance
 *   - images are not stored; only the two counters are kept (Netlify Blobs store "ai-finish")
 *   - one JSON log line per call (model, ok, ms, counts) for auditing
 * Config (Netlify environment variables, all optional): AI_IMAGE_MODEL (default gemini-2.5-flash-image),
 * AI_DAILY_CAP, AI_PER_IP_DAY, AI_FINISH_OFF=1 switches the feature off without a deploy.
 */
import { GoogleGenAI } from '@google/genai';
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const MODEL = process.env.AI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const DAILY_CAP = +process.env.AI_DAILY_CAP || 60;
const PER_IP = +process.env.AI_PER_IP_DAY || 4;
const MAX_BYTES = 2.5 * 1024 * 1024;
// both RJL sites (same function deployed on each) and their Netlify previews
const ORIGIN_OK = /^https:\/\/((www\.)?rjlcommercialgroup\.com|(www\.)?rjlfencingandgates\.com\.au|([a-z0-9-]+--)?(rjlcommercial|rjlfencingandgates)\.netlify\.app)$/i;

const PROMPT = `This is a real photo of a property. A new fence/gate has been added to it as a 3D render.
Edit the image so the added fence, gate, posts and any added extras look like they were really photographed
with the same camera at the same moment: match the photo's lighting direction and colour, add natural
contact shadows where they meet the ground, add subtle reflections appropriate to powder-coated steel,
and match the photo's sharpness, noise and colour grading.
Strict rules: do NOT change the design, style, colour, height, length, position, perspective or the number
of panels, posts or gates. Do NOT add or remove any other objects. Do NOT change the buildings, vehicles,
people, plants, sky or ground elsewhere. Keep the same framing and aspect ratio. Return only the edited photo.`;

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const today = () => new Date().toISOString().slice(0, 10);

export default async (req, context) => {
  const t0 = Date.now();
  if (process.env.AI_FINISH_OFF === '1') return json({ error: 'The AI finish is switched off at the moment.' }, 503);
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (!ORIGIN_OK.test(req.headers.get('origin') || '')) return json({ error: 'Not allowed.' }, 403);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (!body || body.consent !== true) return json({ error: 'Please agree to the notice first.' }, 400);
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(body.image || '');
  if (!m) return json({ error: 'Please send a JPEG or PNG image.' }, 400);
  if (m[2].length * 0.75 > MAX_BYTES) return json({ error: 'That image is too large.' }, 413);
  const note = String(body.design || '').slice(0, 300).replace(/[\r\n]+/g, ' ');

  // ---- limits (strong consistency so the cap holds across instances)
  const store = getStore({ name: 'ai-finish', consistency: 'strong' });
  const day = today();
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const who = createHash('sha256').update('rjl-ai-finish|' + day + '|' + ip).digest('hex').slice(0, 24);
  const kDay = 'day-' + day, kWho = 'v-' + day + '-' + who;
  const [total, mine] = await Promise.all([store.get(kDay, { type: 'json' }), store.get(kWho, { type: 'json' })]);
  const nTotal = (total && total.n) || 0, nMine = (mine && mine.n) || 0;
  if (nTotal >= DAILY_CAP) return json({ error: 'The AI finish has reached today\'s limit. Please try again tomorrow, or send your concept to RJL as it is.' }, 429);
  if (nMine >= PER_IP) return json({ error: `You have used today's ${PER_IP} AI finishes. Please try again tomorrow.` }, 429);
  await Promise.all([store.setJSON(kDay, { n: nTotal + 1 }), store.setJSON(kWho, { n: nMine + 1 })]);

  try {
    const ai = new GoogleGenAI({});                  // GEMINI_API_KEY + GOOGLE_GEMINI_BASE_URL injected by Netlify
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 50000);
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: m[1], data: m[2] } },
        { text: PROMPT + (note ? `\nThe added product is: ${note}` : '') },
      ] }],
      config: { responseModalities: ['IMAGE', 'TEXT'], abortSignal: ctrl.signal },
    });
    clearTimeout(timer);
    const parts = (res && res.candidates && res.candidates[0] && res.candidates[0].content && res.candidates[0].content.parts) || [];
    const img = parts.find((p) => p.inlineData && p.inlineData.data);
    console.log(JSON.stringify({ fn: 'ai-finish', model: MODEL, ok: !!img, ms: Date.now() - t0, day: nTotal + 1, visitor: nMine + 1 }));
    if (!img) { await store.setJSON(kWho, { n: nMine }).catch(() => {}); return json({ error: 'The AI could not finish this picture. Please try again, or send your concept as it is.' }, 502); }
    return json({ image: `data:${img.inlineData.mimeType || 'image/png'};base64,${img.inlineData.data}`, left: PER_IP - nMine - 1 });
  } catch (e) {
    await store.setJSON(kWho, { n: nMine }).catch(() => {});        // a failed call does not use up the allowance
    const timeout = e && (e.name === 'AbortError' || /abort/i.test(String(e)));
    console.log(JSON.stringify({ fn: 'ai-finish', model: MODEL, ok: false, ms: Date.now() - t0, error: String(e).slice(0, 300) }));
    return json({ error: timeout ? 'The AI took too long. Please try again.' : 'The AI finish is not available right now. Please try again later.' }, 502);
  }
};

export const config = { path: '/api/ai-finish' };
