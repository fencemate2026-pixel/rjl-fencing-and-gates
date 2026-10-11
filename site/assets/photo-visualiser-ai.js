/*!
 * RJL photo visualiser - AI object removal worker (runs off the main thread).
 *
 * Uses the MI-GAN inpainting model (Picsart AI Research, MIT licence; see
 * /assets/vendor/migan/LICENSE.txt) through ONNX Runtime Web (Microsoft, MIT; see
 * /assets/vendor/ort/LICENSE.txt). Everything runs in the visitor's browser: the photo is
 * never uploaded. The model (about 27 MB) downloads the first time it is used and is then
 * cached by the browser.
 *
 * Model contract (FROM SOURCE, model file inspected): inputs image uint8 [1,3,H,W] RGB and
 * mask uint8 [1,1,H,W] with 255 = keep, 0 = remove; output result uint8 [1,3,H,W]. The model
 * crops around the mask, works at 512 x 512 and blends the result back itself.
 *
 * Messages in:  { type: 'run', id, w, h, rgba: Uint8ClampedArray(w*h*4), hole: Uint8Array(w*h) 1 = remove }
 * Messages out: { id, stage: 'download'|'thinking', progress: 0..1 }, then { id, rgba } or { id, error }
 */
'use strict';

var BASE = '/assets/vendor/';
var session = null, loading = null;

self.onmessage = function (e) {
  var m = e.data;
  if (m.type !== 'run') return;
  load(m.id).then(function () { return run(m); }).then(function (rgba) {
    self.postMessage({ id: m.id, rgba: rgba }, [rgba.buffer]);
  }).catch(function (err) {
    self.postMessage({ id: m.id, error: String(err && err.message || err) });
  });
};

// Load ONNX Runtime and the model once; report download progress.
function load(id) {
  if (session) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise(function (resolve, reject) {
    try { importScripts(BASE + 'ort/ort.wasm.min.js'); } catch (e) { reject(new Error('the removal tool could not start in this browser')); return; }
    var ort = self.ort;
    ort.env.wasm.wasmPaths = BASE + 'ort/';
    ort.env.wasm.numThreads = 1;              // no cross-origin isolation on this site: single thread
    fetch(BASE + 'migan/migan_pipeline_v2.onnx').then(function (res) {
      if (!res.ok) throw new Error('the removal tool could not be downloaded (HTTP ' + res.status + ')');
      var total = +res.headers.get('content-length') || 28079181, got = 0, parts = [];
      if (!res.body || !res.body.getReader) return res.arrayBuffer();
      var reader = res.body.getReader();
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) {
            var buf = new Uint8Array(got), o = 0;
            parts.forEach(function (p) { buf.set(p, o); o += p.length; });
            return buf.buffer;
          }
          parts.push(r.value); got += r.value.length;
          self.postMessage({ id: id, stage: 'download', progress: Math.min(1, got / total) });
          return pump();
        });
      })();
    }).then(function (buf) {
      self.postMessage({ id: id, stage: 'thinking', progress: 0 });
      return ort.InferenceSession.create(buf, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }).then(function (s) { session = s; resolve(); })
      .catch(function (err) { loading = null; reject(err); });
  });
  return loading;
}

function run(m) {
  var ort = self.ort, w = m.w, h = m.h, n = w * h, i;
  var img = new Uint8Array(3 * n), mask = new Uint8Array(n);
  for (i = 0; i < n; i++) {                                   // RGBA (interleaved) -> RGB planes
    img[i] = m.rgba[i * 4]; img[n + i] = m.rgba[i * 4 + 1]; img[2 * n + i] = m.rgba[i * 4 + 2];
    mask[i] = m.hole[i] ? 0 : 255;
  }
  self.postMessage({ id: m.id, stage: 'thinking', progress: 0.3 });
  var feeds = { image: new ort.Tensor('uint8', img, [1, 3, h, w]), mask: new ort.Tensor('uint8', mask, [1, 1, h, w]) };
  return session.run(feeds).then(function (out) {
    var r = out[Object.keys(out)[0]];
    var d = r.data, dims = r.dims;
    if (dims[2] !== h || dims[3] !== w) throw new Error('unexpected result size');
    var rgba = new Uint8ClampedArray(n * 4);
    for (i = 0; i < n; i++) { rgba[i * 4] = d[i]; rgba[i * 4 + 1] = d[n + i]; rgba[i * 4 + 2] = d[2 * n + i]; rgba[i * 4 + 3] = 255; }
    return rgba;
  });
}

