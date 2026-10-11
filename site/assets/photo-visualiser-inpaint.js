/*!
 * RJL photo visualiser - object removal worker (runs off the main thread).
 *
 * Fills a painted area of the photo with texture from the surrounding picture, using
 * multi-scale PatchMatch inpainting (Barnes et al. 2009; Wexler et al. 2007):
 *   1. Build an image pyramid. At the coarsest level the hole is small, so a simple
 *      outside-in blur fills it as a first guess.
 *   2. At each level, for every pixel whose 7x7 patch touches the hole, find the most
 *      similar 7x7 patch fully outside the hole (PatchMatch: random guesses, propagation
 *      from neighbours, and a shrinking random search).
 *   3. Rebuild each hole pixel as a weighted vote of the matched patches that cover it.
 *   4. Repeat a few times, then move up a level using the matches found as the start.
 *
 * Message in:  { id, w, h, rgba: Uint8ClampedArray(w*h*4), hole: Uint8Array(w*h) 1 = remove }
 * Messages out: { id, progress: 0..1 } while working, then { id, rgba } or { id, error }.
 * Works well on concrete, grass, sky, brick and plain walls; large detailed objects can leave
 * visible repeats, which the visitor can fix by painting again over the problem area.
 */
'use strict';

var R = 3, P = 2 * R + 1;                   // patch radius / size
var LAMBDA = 20;                            // height-change penalty per (full-size px)^2

self.onmessage = function (e) {
  var m = e.data;
  try {
    var out = inpaint(m.w, m.h, m.rgba, m.hole, function (p) { self.postMessage({ id: m.id, progress: p }); });
    self.postMessage({ id: m.id, rgba: out }, [out.buffer]);
  } catch (err) {
    self.postMessage({ id: m.id, error: String(err && err.message || err) });
  }
};

function inpaint(w, h, rgba, holeIn, progress) {
  // ---- level 0 as float RGB
  var img = new Float32Array(w * h * 3), hole = new Uint8Array(w * h), i, n = w * h, any = 0;
  for (i = 0; i < n; i++) {
    img[i * 3] = rgba[i * 4]; img[i * 3 + 1] = rgba[i * 4 + 1]; img[i * 3 + 2] = rgba[i * 4 + 2];
    hole[i] = holeIn[i] ? 1 : 0; any |= hole[i];
  }
  var out = new Uint8ClampedArray(rgba);
  if (!any) return out;

  // ---- pyramid
  var pyr = [{ w: w, h: h, img: img, hole: hole }];
  while (true) {
    var L = pyr[pyr.length - 1], bb = bbox(L.w, L.h, L.hole);
    if (!bb || Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) <= 3 * P || Math.min(L.w, L.h) < 6 * P) break;
    pyr.push(down(L));
  }
  var levels = pyr.length, work = 0, total = 0, lv;
  for (lv = 0; lv < levels; lv++) pyr[lv].lam = LAMBDA * Math.pow(4, lv);   // same penalty in full-size pixels at every level
  for (lv = 0; lv < levels; lv++) total += iters(lv, levels);

  // ---- coarsest: onion-peel fill as the first guess
  var top = pyr[levels - 1];
  peel(top);
  var prevNNF = null;
  for (lv = levels - 1; lv >= 0; lv--) {
    var Lv = pyr[lv];
    if (lv < levels - 1) seedFromCoarse(Lv, pyr[lv + 1]);
    var st = setup(Lv);
    if (!st.srcCount) throw new Error('not enough clear picture around the painted area');
    initNNF(Lv, st, prevNNF, lv < levels - 1 ? pyr[lv + 1] : null);
    var it = iters(lv, levels);
    for (var k = 0; k < it; k++) {
      search(Lv, st, k % 2 === 0);
      search(Lv, st, k % 2 === 1);
      vote(Lv, st, k === it - 1);
      work++; progress(work / total);
    }
    prevNNF = st;
  }

  // ---- write the hole pixels back
  for (i = 0; i < n; i++) if (hole[i]) {
    out[i * 4] = img[i * 3]; out[i * 4 + 1] = img[i * 3 + 1]; out[i * 4 + 2] = img[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}

function iters(lv, levels) { return lv === levels - 1 ? 10 : lv === 0 ? 3 : 4; }

function bbox(w, h, hole) {
  var x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (hole[y * w + x]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0: x0, y0: y0, x1: x1, y1: y1 };
}

// Half-size level: colour = average of the known children; hole if any child is a hole.
function down(L) {
  var w2 = Math.ceil(L.w / 2), h2 = Math.ceil(L.h / 2), img = new Float32Array(w2 * h2 * 3), hole = new Uint8Array(w2 * h2);
  for (var y = 0; y < h2; y++) for (var x = 0; x < w2; x++) {
    var r = 0, g = 0, b = 0, c = 0, hh = 0;
    for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) {
      var X = Math.min(L.w - 1, x * 2 + dx), Y = Math.min(L.h - 1, y * 2 + dy), j = Y * L.w + X;
      if (L.hole[j]) { hh = 1; continue; }
      r += L.img[j * 3]; g += L.img[j * 3 + 1]; b += L.img[j * 3 + 2]; c++;
    }
    var o = y * w2 + x;
    hole[o] = hh;
    if (c) { img[o * 3] = r / c; img[o * 3 + 1] = g / c; img[o * 3 + 2] = b / c; }
  }
  return { w: w2, h: h2, img: img, hole: hole };
}

// Fill the hole from the outside in with the average of already-filled neighbours.
function peel(L) {
  var w = L.w, h = L.h, done = new Uint8Array(w * h), i, left = 0;
  for (i = 0; i < w * h; i++) { done[i] = L.hole[i] ? 0 : 1; if (!done[i]) left++; }
  var guard = w + h;
  while (left > 0 && guard-- > 0) {
    var next = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var j = y * w + x; if (done[j]) continue;
      var r = 0, g = 0, b = 0, c = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        var k = Y * w + X; if (!done[k]) continue;
        r += L.img[k * 3]; g += L.img[k * 3 + 1]; b += L.img[k * 3 + 2]; c++;
      }
      if (c) next.push(j, r / c, g / c, b / c);
    }
    if (!next.length) break;
    for (i = 0; i < next.length; i += 4) {
      var p = next[i]; L.img[p * 3] = next[i + 1]; L.img[p * 3 + 1] = next[i + 2]; L.img[p * 3 + 2] = next[i + 3]; done[p] = 1; left--;
    }
  }
}

// Copy the coarser level's result into this level's hole (nearest pixel) as a starting point.
function seedFromCoarse(L, C) {
  for (var y = 0; y < L.h; y++) for (var x = 0; x < L.w; x++) {
    var j = y * L.w + x; if (!L.hole[j]) continue;
    var k = Math.min(C.h - 1, y >> 1) * C.w + Math.min(C.w - 1, x >> 1);
    L.img[j * 3] = C.img[k * 3]; L.img[j * 3 + 1] = C.img[k * 3 + 1]; L.img[j * 3 + 2] = C.img[k * 3 + 2];
  }
}

// Which patch centres are valid sources (fully clear) and which are targets (touch the hole).
function setup(L) {
  var w = L.w, h = L.h, I = new Int32Array((w + 1) * (h + 1)), x, y;
  for (y = 0; y < h; y++) { var row = 0; for (x = 0; x < w; x++) { row += L.hole[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
  var holeIn = function (cx, cy) {
    var a = cx - R, b = cy - R, c = cx + R + 1, d = cy + R + 1;
    return I[d * (w + 1) + c] - I[b * (w + 1) + c] - I[d * (w + 1) + a] + I[b * (w + 1) + a];
  };
  var src = new Uint8Array(w * h), srcList = [], targets = [];
  for (y = R; y < h - R; y++) for (x = R; x < w - R; x++) {
    var hc = holeIn(x, y), j = y * w + x;
    if (!hc) { src[j] = 1; srcList.push(j); } else targets.push(j);
  }
  return { src: src, srcList: new Int32Array(srcList), srcCount: srcList.length, targets: new Int32Array(targets),
    nnf: new Int32Array(w * h).fill(-1), dist: new Float32Array(w * h).fill(Infinity) };
}

// Patch difference (sum of squared colour differences) plus a penalty for borrowing from a
// different height in the photo. Backgrounds are usually horizontal bands (ground, wall, sky),
// so without it a blurry first guess tends to match smooth sky instead of the ground beside it.
function dist(L, p, q, best) {
  var w = L.w, img = L.img, px = p % w, py = (p / w) | 0, qx = q % w, qy = (q / w) | 0;
  var dyy = py - qy, d = L.lam * dyy * dyy;
  if (d >= best) return d;
  for (var dy = -R; dy <= R; dy++) {
    var pi = ((py + dy) * w + px - R) * 3, qi = ((qy + dy) * w + qx - R) * 3;
    for (var k = 0; k < P * 3; k++) { var t = img[pi + k] - img[qi + k]; d += t * t; }
    if (d >= best) return d;
  }
  return d;
}

function initNNF(L, st, prev, C) {
  var w = L.w, t = st.targets;
  for (var i = 0; i < t.length; i++) {
    var p = t[i], q = -1;
    if (prev && C) {                                         // scale up the coarse match
      var px = p % w, py = (p / w) | 0, cp = Math.min(C.h - 1, py >> 1) * C.w + Math.min(C.w - 1, px >> 1), cq = prev.nnf[cp];
      if (cq >= 0) {
        var qx = Math.min(w - R - 1, Math.max(R, (cq % C.w) * 2 + (px & 1))), qy = Math.min(L.h - R - 1, Math.max(R, ((cq / C.w) | 0) * 2 + (py & 1)));
        var cand = qy * w + qx; if (st.src[cand]) q = cand;
      }
    }
    if (q < 0) q = st.srcList[(Math.random() * st.srcCount) | 0];
    st.nnf[p] = q; st.dist[p] = dist(L, p, q, Infinity);
  }
}

function tryQ(L, st, p, q) {
  if (q < 0 || !st.src[q] || q === st.nnf[p]) return;
  var d = dist(L, p, q, st.dist[p]);
  if (d < st.dist[p]) { st.dist[p] = d; st.nnf[p] = q; }
}

// One PatchMatch pass: propagation from scanned neighbours + shrinking random search.
function search(L, st, forward) {
  var w = L.w, h = L.h, t = st.targets, n = t.length, isT = st.dist;
  var maxR = Math.max(w, h);
  for (var ii = 0; ii < n; ii++) {
    var p = t[forward ? ii : n - 1 - ii], px = p % w, s = forward ? -1 : 1;
    var a = p + s, b = p + s * w;                            // left/up (forward) or right/down (backward)
    if (px + s >= 0 && px + s < w && st.nnf[a] >= 0) { var qa = st.nnf[a] - s; if ((qa % w) === ((st.nnf[a] % w) - s)) tryQ(L, st, p, qa); }
    if (b >= 0 && b < w * h && st.nnf[b] >= 0) tryQ(L, st, p, st.nnf[b] - s * w);
    var bq = st.nnf[p], bx = bq % w, by = (bq / w) | 0;
    for (var r = maxR; r >= 1; r >>= 1) {
      var qx = bx + ((Math.random() * 2 - 1) * r) | 0, qy = by + ((Math.random() * 2 - 1) * r) | 0;
      if (qx < R || qy < R || qx >= w - R || qy >= h - R) continue;
      tryQ(L, st, p, qy * w + qx);
      bq = st.nnf[p]; bx = bq % w; by = (bq / w) | 0;
    }
  }
  return isT;
}

// Rebuild hole pixels as a weighted vote of every matched patch that covers them.
// Weights fall off with patch distance relative to this level's typical (median) distance,
// so good matches dominate and the fill stays sharp.
function vote(L, st, last) {
  var w = L.w, h = L.h, t = st.targets, acc = new Float32Array(w * h * 3), ws = new Float32Array(w * h), img = L.img;
  var ds = new Float32Array(t.length), i;
  for (i = 0; i < t.length; i++) ds[i] = st.dist[t[i]];
  ds.sort();
  var s2 = Math.max(1, ds[(ds.length * 0.5) | 0]);
  for (i = 0; i < t.length; i++) {
    var p = t[i], q = st.nnf[p], wt = Math.exp(-st.dist[p] / s2) + 1e-9, px = p % w, py = (p / w) | 0, qx = q % w, qy = (q / w) | 0;
    for (var dy = -R; dy <= R; dy++) for (var dx = -R; dx <= R; dx++) {
      var j = (py + dy) * w + px + dx;
      if (!L.hole[j]) continue;
      var k = ((qy + dy) * w + qx + dx) * 3;
      acc[j * 3] += img[k] * wt; acc[j * 3 + 1] += img[k + 1] * wt; acc[j * 3 + 2] += img[k + 2] * wt; ws[j] += wt;
    }
  }
  for (var j2 = 0; j2 < w * h; j2++) if (L.hole[j2] && ws[j2] > 0) {
    img[j2 * 3] = acc[j2 * 3] / ws[j2]; img[j2 * 3 + 1] = acc[j2 * 3 + 1] / ws[j2]; img[j2 * 3 + 2] = acc[j2 * 3 + 2] / ws[j2];
  }
  if (last) {
    // final pass at full size: each hole pixel takes the centre of its own best match, which
    // keeps real texture (averaging alone softens it); pixels that are not patch centres keep the vote
    var copy = new Float32Array(img);
    for (i = 0; i < t.length; i++) {
      var pc = t[i]; if (!L.hole[pc]) continue;
      var qc = st.nnf[pc];
      img[pc * 3] = copy[qc * 3]; img[pc * 3 + 1] = copy[qc * 3 + 1]; img[pc * 3 + 2] = copy[qc * 3 + 2];
    }
    return;
  }
  // matches were scored against the old fill; rescore against the new one
  for (var m = 0; m < t.length; m++) st.dist[t[m]] = dist(L, t[m], st.nnf[t[m]], Infinity);
}

