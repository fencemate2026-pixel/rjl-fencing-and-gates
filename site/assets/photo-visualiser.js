/*!
 * RJL photo visualiser - rjlfencingandgates.com.au/photo-visualiser
 *
 * A visitor uploads a photo of their site, removes anything they don't want in it, then sees
 * residential RJL fencing and driveway gates standing in the photo at its real size, using
 * the same 3D models as the RJL 3D fence & gate designer. Gates open and close. The picture
 * can be downloaded or sent to RJL through the Netlify form "photo-visualiser".
 *
 * Files
 *   fence-designer.js (data-mode="overlay")  the 3D designer engine: models, layout, animation
 *   photo-visualiser-ai.js                   worker: AI object removal (MI-GAN via ONNX Runtime Web)
 *   photo-visualiser-inpaint.js              worker: fallback removal if the AI tool cannot run
 *   photo-visualiser.js                      this file: photo, placement, UI, export, enquiry
 *
 * True-size placement (why nothing looks squashed)
 *   The visitor marks where the fence starts and ends on the ground and where eye level
 *   (the horizon) is in the photo. With the camera height (standing = 1.6 m) and a typical
 *   phone lens, every ground point in the photo has a real position in metres:
 *       depth Z = f * camH / (y - horizonY),   sideways X = (x - centreX) * Z / f
 *   The fence run is laid out by the designer along that ground line at its real length,
 *   with real panel widths, post sizes and heights, and the 3D camera copies the photo's
 *   camera. The readout shows the measured run length so the visitor can sanity-check it.
 *
 * Safety / robustness
 *   - Placement points cannot cross the eye-level line (that has no real-world meaning).
 *   - Object removal runs in a worker with progress, a time-out, a fallback method and Undo.
 *   - Every decode / export / upload / removal step reports a plain-English error on the page.
 *   - No inline script. Removal binaries are downloaded through fixed same-origin rewrites.
 *     The photo is never uploaded unless the visitor submits the form.
 */
(function () {
  'use strict';

  var root = document.getElementById('rjl-viz');
  if (!root) return;
  var D = window.RJLDesignerOverlay;

  // ------------------------------------------------------------------ settings
  var MAX_PHOTO = 2400;         // longest edge kept from the visitor's photo (px)
  var SEND_MAX = 1600;          // longest edge of images sent with the form (px)
  var HANDLE_PX = 12;           // handle radius on screen (CSS px)
  var HIT_PX = 26;              // grab distance (CSS px)
  var ERASE_WORK = 1024;        // longest edge of the area sent to object removal (px)
  var ERASE_TIMEOUT = 120000;   // give up on a removal after this long (ms; includes first download)
  var UNDO_MAX = 10;
  var LENS = { standard: 0.75, wide: 0.375, zoom: 1.5 };   // focal length / long edge of the photo

  // COLORBOND(R) digital colour values - FROM SOURCE: BlueScope "New 2022 COLORBOND steel Digital
  // Colour Values" and colorbond.com colour pages (fetched 10 Oct 2026). Screen colours are a guide only.
  var COLOURS = [
    ['dover-white', 'Dover White™', '#f9fbf1', 1], ['surfmist', 'Surfmist®', '#e4e2d5', 1],
    ['classic-cream', 'Classic Cream™', '#e9dcb8', 1], ['domain', 'Domain®', '#e8dbae', 1],
    ['southerly', 'Southerly®', '#d2d1cb', 1], ['paperbark', 'Paperbark®', '#cabfa4', 1],
    ['evening-haze', 'Evening Haze®', '#c5c2aa', 1], ['shale-grey', 'Shale Grey™', '#bdbfba', 1],
    ['dune', 'Dune®', '#b1ada3', 1], ['riversand', 'Riversand®', '#9d8d76', 1],
    ['bluegum', 'Bluegum®', '#969799', 1], ['windspray', 'Windspray®', '#888b8a', 1],
    ['gully', 'Gully®', '#857e73', 1], ['wallaby', 'Wallaby®', '#7f7c78', 1],
    ['pale-eucalypt', 'Pale Eucalypt®', '#7c846a', 1], ['wilderness', 'Wilderness®', '#64715e', 1],
    ['jasper', 'Jasper®', '#6c6153', 1], ['basalt', 'Basalt®', '#6d6c6e', 1],
    ['woodland-grey', 'Woodland Grey®', '#4b4c46', 1], ['ironstone', 'Ironstone®', '#3e434c', 1],
    ['deep-ocean', 'Deep Ocean®', '#364152', 1], ['cottage-green', 'Cottage Green®', '#304c3c', 1],
    ['manor-red', 'Manor Red®', '#5e1d0e', 1], ['monument', 'Monument®', '#323233', 1],
    ['wollemi', 'Wollemi®', '#0a1c0d', 1], ['night-sky', 'Night Sky®', '#000000', 1],
    ['galv', 'Galvanised (bare steel)', '#a8adb1', 0], ['timber', 'Natural timber', '#b9875a', 0]
  ].map(function (c) { return { k: c[0], name: c[1], hex: c[2], cb: !!c[3] }; });

  // ------------------------------------------------------------------ elements
  function $(id) { return document.getElementById(id); }
  var fileIn = $('vizFile'), drop = $('vizDrop'), stage = $('vizStage'), photoCv = $('vizPhoto'), ui = $('vizUI');
  var view3d = $('viewport'), msg = $('vizMsg'), readout = $('vizReadout'), hint = $('vizHint');
  var btnOpen = $('vizOpen'), btnErase = $('vizEraseToggle'), btnFlip = $('vizFlip'), btnReset = $('vizReset');
  var btnDownload = $('vizDownload'), btnSend = $('vizSend'), btnNew = $('vizNew');
  var eraseBar = $('vizEraseBar'), rngBrush = $('vizBrush'), btnRemove = $('vizRemove'), btnClearPaint = $('vizClearPaint');
  var btnUndo = $('vizUndo'), btnEraseDone = $('vizEraseDone'), eraseStatus = $('vizEraseStatus');
  var selCamH = $('vizCamH'), selLens = $('vizLens'), chkShadow = $('vizShadow');
  var form = $('vizForm'), formWrap = $('vizFormWrap'), formStatus = $('vizFormStatus'), done = $('vizDone');
  var pctx = photoCv.getContext('2d'), uctx = ui.getContext('2d');

  function say(text, isError) { msg.textContent = text || ''; msg.hidden = !text; msg.classList.toggle('is-error', !!isError); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) { /* optional */ } }
  function fmt(n) { return Math.round(n).toLocaleString('en-AU'); }

  if (!D || !D.ready) {
    say('The 3D visualiser needs WebGL, which is turned off or not supported in this browser. Try Chrome, Edge or Safari on a recent device, or call 0412 467 840.', true);
    fileIn.disabled = true;
    return;
  }
  var CAT = D.catalog;

  // ------------------------------------------------------------------ state
  var photoRequest = 0;
  var photo = null, W = 0, H = 0;           // edited photo and its size
  var A = null, B = null, horizon = 0;      // fence start / end on the ground, eye-level row (photo px)
  var drag = null, mask = null, maskCtx = null, maskDirty = false, undo = [], busy = false;
  var erase = false, openState = false, layoutInfo = null, rebuildQueued = false;
  var aiWorker = null, fbWorker = null, aiBroken = false, jobId = 0, eraseCancel = null;
  var logo = new Image(); logo.src = '/images/rjl-logo-trim.webp';

  function nearestColour(hex) {
    if (hex === '#1d1d1d') return 'night-sky';
    var c = parseInt(hex.slice(1), 16), r = c >> 16 & 255, g = c >> 8 & 255, b = c & 255, best = null, bd = 1e9;
    COLOURS.forEach(function (o) {
      var n = parseInt(o.hex.slice(1), 16), d = Math.pow((n >> 16 & 255) - r, 2) + Math.pow((n >> 8 & 255) - g, 2) + Math.pow((n & 255) - b, 2);
      if (d < bd) { bd = d; best = o.k; }
    });
    return best;
  }
  function colourHex(k) { if (k.charAt(0) === '#') return k; for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i].k === k) return COLOURS[i].hex; return '#3a3d40'; }

  // design in the designer's own field names (see newRun() in the designer)
  function gateDefaults(type) {
    var G = CAT.gates[type] || {};
    return { type: type, width: G.def || 3000, position: 'start', piers: false, auto: type !== 'none' && type !== 'pedestrian',
      access: 'none', lock: 'locklatch', spikes: 'none', tlights: 0, beacon: false, bollardH: 800 };
  }
  function defaultsFor(product, prev) {
    var d = CAT.products[product].defaults, p = prev || {};
    var allowed = CAT.gatesFor(product);
    var gtype = p.gate && allowed.indexOf(p.gate.type) >= 0 ? p.gate.type : (CAT.products[product].pool ? 'pedestrian' : 'none');
    return {
      product: product, height: d.height, maxBay: d.maxBay, colour: nearestColour(d.colour), style: d.style, gap: d.gap,
      lattice: 'square', palingLen: 1650, palingW: 150, capping: false, plinths: 1, sleepers: 0, front: 'none', frontEnd: 'end',
      retain: { on: false, height: 600 }, rails: { top: true, mid: false, bot: false },
      barbed: false, razor: false, razorMount: 'arms', electric: false, elecMount: 'top', elecStrands: 6,
      gate: p.gate && gtype === p.gate.type ? Object.assign({}, p.gate) : gateDefaults(gtype),
      turnstile: 'none'
    };
  }
  var cfg = defaultsFor('colorbond');
  cfg.gate = gateDefaults('sliding'); cfg.gate.width = 4000;

  // ------------------------------------------------------------------ geometry: photo <-> ground
  function focal() { return (LENS[selLens.value] || 0.75) * Math.max(W, H); }
  function camH() { return +selCamH.value || 1.6; }
  function ground(p) {                                  // photo px -> [x, z] metres (camera at origin, looking -z)
    var dy = p.y - horizon; if (dy < 1) return null;
    var f = focal(), Z = f * camH() / dy;
    return [(p.x - W / 2) * Z / f, -Z];
  }
  function runLength() { var a = ground(A), b = ground(B); return a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0; }
  function defaultPlacement() { horizon = Math.round(H * 0.42); A = { x: W * 0.1, y: H * 0.68 }; B = { x: W * 0.9, y: H * 0.68 }; }

  // ------------------------------------------------------------------ design -> 3D
  function applyDesign() {
    if (!photo) return;
    var run = JSON.parse(JSON.stringify(cfg));
    run.colour = colourHex(cfg.colour);
    run.length = Math.max(0.5, Math.round(runLength() * 100) / 100);
    var t = cfg.turnstile === 'none' ? { count: 0 } : { count: 1, type: cfg.turnstile, access: 'none' };
    delete run.turnstile;
    layoutInfo = D.setDesign(run, t);
    layoutInfo.length = run.length;
    applyView();
    updateReadout();
  }
  function queueDesign() {
    if (rebuildQueued) return;
    rebuildQueued = true;
    requestAnimationFrame(function () { rebuildQueued = false; applyDesign(); drawUI(); });
  }
  function applyView() {                                 // camera + placement for the on-screen size
    var r = photoCv.getBoundingClientRect(); if (!r.width || !photo) return;
    var k = r.width / W;
    D.setView({ w: r.width, h: r.height, dpr: Math.min(window.devicePixelRatio || 1, 2), f: focal() * k, cx: W / 2 * k, yh: horizon * k,
      camH: camH(), p0: ground(A), p1: ground(B) });
  }
  function updateReadout() {
    if (!layoutInfo) { readout.innerHTML = ''; return; }
    var g = cfg.gate, parts = ['<b>' + layoutInfo.length.toFixed(1) + ' m</b> fence line'];
    if (layoutInfo.bays.length) parts.push(layoutInfo.bays.length + ' panel' + (layoutInfo.bays.length > 1 ? 's' : '') + ' up to ' + fmt(Math.max.apply(null, layoutInfo.bays)) + ' mm');
    if (g.type !== 'none') parts.push(CAT.gates[g.type].label.toLowerCase() + ' ' + fmt(g.width) + ' mm');
    if (!CAT.products[cfg.product].derivedHeight) parts.push(fmt(cfg.height) + ' mm high');
    var html = parts.join(' · ');
    if (layoutInfo.errs.length) html += '<span class="viz-err">' + esc(layoutInfo.errs[0]) + ' Drag the Start and End dots further apart, or change the gate.</span>';
    readout.innerHTML = html;
  }

  // ------------------------------------------------------------------ drawing
  function layout() {
    if (!photo) return;
    var phone = window.matchMedia('(max-width: 900px)').matches;
    var avail = stage.clientWidth;
    var maxH = phone ? window.innerHeight * 0.4 : Math.max(320, window.innerHeight - 300);
    var dw = avail, dh = avail * H / W;
    if (dh > maxH) { dh = maxH; dw = dh * W / H; }
    dw = Math.round(dw); dh = Math.round(dh);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    [photoCv, ui].forEach(function (c) { c.style.width = dw + 'px'; c.style.height = dh + 'px'; c.width = Math.round(dw * dpr); c.height = Math.round(dh * dpr); });
    view3d.style.width = dw + 'px'; view3d.style.height = dh + 'px';
    drawPhoto(); applyView(); drawUI();
  }
  function drawPhoto() {
    if (!photo) return;
    pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.imageSmoothingQuality = 'high';
    pctx.drawImage(photo, 0, 0, photoCv.width, photoCv.height);
    if (erase && mask) { pctx.globalAlpha = 0.5; pctx.drawImage(mask, 0, 0, photoCv.width, photoCv.height); pctx.globalAlpha = 1; }
  }
  // placement handles: Start / End on the ground and the eye-level line
  function drawUI() {
    uctx.setTransform(1, 0, 0, 1, 0, 0);
    uctx.clearRect(0, 0, ui.width, ui.height);
    if (!photo || erase) return;
    var s = ui.width / W, dpr = ui.width / (ui.getBoundingClientRect().width || 1);
    var a = { x: A.x * s, y: A.y * s }, b = { x: B.x * s, y: B.y * s }, hy = horizon * s;
    function rr(x, y, w, h, r) { uctx.beginPath(); uctx.moveTo(x + r, y); uctx.arcTo(x + w, y, x + w, y + h, r); uctx.arcTo(x + w, y + h, x, y + h, r); uctx.arcTo(x, y + h, x, y, r); uctx.arcTo(x, y, x + w, y, r); uctx.closePath(); }
    function tag(t, x, y, bg) {
      uctx.font = '600 ' + 12 * dpr + 'px Arial'; uctx.textAlign = 'left'; uctx.textBaseline = 'middle';
      var w = uctx.measureText(t).width + 12 * dpr; uctx.fillStyle = bg; rr(x - 6 * dpr, y - 10 * dpr, w, 20 * dpr, 4 * dpr); uctx.fill();
      uctx.fillStyle = '#fff'; uctx.fillText(t, x, y);
    }
    uctx.save();
    uctx.lineWidth = 2 * dpr; uctx.setLineDash([10 * dpr, 7 * dpr]);
    uctx.strokeStyle = 'rgba(243,111,33,0.95)'; uctx.beginPath(); uctx.moveTo(0, hy); uctx.lineTo(ui.width, hy); uctx.stroke();
    uctx.strokeStyle = 'rgba(255,255,255,0.95)'; uctx.beginPath(); uctx.moveTo(a.x, a.y); uctx.lineTo(b.x, b.y); uctx.stroke();
    uctx.setLineDash([]);
    tag('Eye level (drag up or down)', 12 * dpr, hy - 16 * dpr, '#d95420');
    uctx.fillStyle = '#d95420'; rr(ui.width - 46 * dpr, hy - 13 * dpr, 40 * dpr, 26 * dpr, 13 * dpr); uctx.fill();
    uctx.fillStyle = '#fff'; uctx.font = 'bold ' + 15 * dpr + 'px Arial'; uctx.textAlign = 'center'; uctx.textBaseline = 'middle';
    uctx.fillText('↕', ui.width - 26 * dpr, hy + 1 * dpr);
    [[a, 'Start'], [b, 'End']].forEach(function (h, i) {
      uctx.beginPath(); uctx.arc(h[0].x, h[0].y, HANDLE_PX * dpr, 0, Math.PI * 2);
      uctx.fillStyle = drag && drag.what === i ? '#f36f21' : '#fff'; uctx.fill();
      uctx.lineWidth = 3 * dpr; uctx.strokeStyle = '#d95420'; uctx.stroke();
      tag(h[1], h[0].x - 16 * dpr, h[0].y + 30 * dpr, '#071f38');
    });
    uctx.restore();
  }

  // ------------------------------------------------------------------ pointer: placement and brush
  function toPhoto(e) { var r = ui.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, k: W / r.width }; }
  function distSeg(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
  function brushLine(a, b) {
    maskCtx.strokeStyle = 'rgb(255,40,40)'; maskCtx.lineCap = 'round'; maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = (+rngBrush.value) * a.k;
    maskCtx.beginPath(); maskCtx.moveTo(a.x, a.y); maskCtx.lineTo(b.x + 0.01, b.y); maskCtx.stroke();
    maskDirty = true; updateEraseButtons();
  }
  ui.addEventListener('pointerdown', function (e) {
    if (!photo || busy) return;
    var p = toPhoto(e), hit = HIT_PX * p.k;
    if (erase) { drag = { what: 'paint', last: p }; brushLine(p, p); drawPhoto(); }
    else if (Math.hypot(p.x - A.x, p.y - A.y) < hit) drag = { what: 0 };
    else if (Math.hypot(p.x - B.x, p.y - B.y) < hit) drag = { what: 1 };
    else if (Math.abs(p.y - horizon) < hit * 0.7) drag = { what: 'horizon' };
    else if (distSeg(p, A, B) < hit * 0.7) drag = { what: 'line', last: p };
    else return;
    ui.setPointerCapture(e.pointerId); e.preventDefault(); drawUI();
  });
  ui.addEventListener('pointermove', function (e) {
    if (!photo) return;
    var p = toPhoto(e), gap = 10 * p.k;
    if (!drag) {
      if (erase) { ui.style.cursor = 'crosshair'; return; }
      var hit = HIT_PX * p.k;
      ui.style.cursor = Math.hypot(p.x - A.x, p.y - A.y) < hit || Math.hypot(p.x - B.x, p.y - B.y) < hit ? 'grab'
        : Math.abs(p.y - horizon) < hit * 0.7 ? 'ns-resize' : distSeg(p, A, B) < hit * 0.7 ? 'move' : 'default';
      return;
    }
    if (drag.what === 'paint') { brushLine(drag.last, p); drag.last = p; drawPhoto(); return; }
    var cl = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    if (drag.what === 0 || drag.what === 1) {
      var q = { x: cl(p.x, 0, W), y: cl(p.y, horizon + gap, H) };        // ground points stay below eye level
      if (drag.what === 0) A = q; else B = q;
    } else if (drag.what === 'horizon') {
      horizon = cl(p.y, 0, Math.min(A.y, B.y) - gap);
    } else if (drag.what === 'line') {
      var dx = p.x - drag.last.x, dy = p.y - drag.last.y;
      if (Math.min(A.y, B.y) + dy > horizon + gap && Math.max(A.y, B.y) + dy <= H) { A = { x: A.x + dx, y: A.y + dy }; B = { x: B.x + dx, y: B.y + dy }; }
      drag.last = p;
    }
    queueDesign();
  });
  function endDrag() { if (drag) { drag = null; drawUI(); } }
  ui.addEventListener('pointerup', endDrag);
  ui.addEventListener('pointercancel', endDrag);
  ui.addEventListener('lostpointercapture', endDrag);

  // ------------------------------------------------------------------ photo loading
  function loadFile(file) {
    if (!file) return;
    if (!(/^image\/(jpeg|png|webp)$/i.test(file.type) || (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name || '')))) {
      say('Please choose a JPG, PNG or WebP photo. Convert HEIC photos to JPG first.', true); return;
    }
    if (file.size > 25 * 1024 * 1024) { say('Please choose a photo smaller than 25 MB.', true); return; }
    var currentPhoto = ++photoRequest;
    cancelRemoval();
    say('Loading your photo…');
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      if (currentPhoto !== photoRequest) return;
      cancelRemoval();
      var k = Math.min(1, MAX_PHOTO / Math.max(img.naturalWidth, img.naturalHeight));
      W = Math.round(img.naturalWidth * k); H = Math.round(img.naturalHeight * k);
      if (!W || !H) { say('That photo could not be read. Please try a different one.', true); return; }
      photo = document.createElement('canvas'); photo.width = W; photo.height = H;
      var g = photo.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, W, H);
      mask = document.createElement('canvas'); mask.width = W; mask.height = H; maskCtx = mask.getContext('2d');
      undo = []; maskDirty = false; eraseStatus.textContent = '';
      root.classList.add('has-photo'); drop.hidden = true;
      say('');
      defaultPlacement();
      openState = false; D.setOpen(0, true); btnOpen.textContent = 'Open gate'; btnOpen.setAttribute('aria-pressed', 'false');
      D.setLive(true);
      setErase(false);
      layout(); applyDesign(); drawUI();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });       // bring the whole tool into view
      track('visualiser_upload');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      if (currentPhoto !== photoRequest) return;
      say('That photo format could not be opened in this browser (iPhone HEIC photos are a common cause). Please save it as a JPG or take a screenshot of it, then try again.', true);
    };
    img.src = url;
  }
  fileIn.addEventListener('change', function () { loadFile(fileIn.files && fileIn.files[0]); fileIn.value = ''; });
  btnNew.addEventListener('click', function () { fileIn.click(); });
  ['dragenter', 'dragover'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); root.classList.add('is-dragover'); }); });
  ['dragleave', 'drop'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); root.classList.remove('is-dragover'); }); });
  stage.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadFile(f); });

  // ------------------------------------------------------------------ toolbar
  btnOpen.addEventListener('click', function () {
    if (!photo) return;
    openState = !openState; D.setOpen(openState ? 1 : 0);
    btnOpen.textContent = openState ? 'Close gate' : 'Open gate';
    btnOpen.setAttribute('aria-pressed', String(openState));
    track('visualiser_open_close', { gate: cfg.gate.type });
  });
  btnFlip.addEventListener('click', function () { if (!photo) return; var t = A; A = B; B = t; queueDesign(); });
  btnReset.addEventListener('click', function () { if (!photo) return; defaultPlacement(); queueDesign(); });
  [selCamH, selLens].forEach(function (s) { s.addEventListener('change', queueDesign); });
  chkShadow.addEventListener('change', function () { D.setShadows(chkShadow.checked); });
  if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(stage);
  window.addEventListener('resize', layout);

  // ------------------------------------------------------------------ tabs
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  function showTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click();
    });
  });

  // ------------------------------------------------------------------ options (same choices as the designer)
  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function sel(k, label, options, numeric) { return '<label class="viz-f"><span>' + label + '</span><select data-k="' + k + '"' + (numeric ? ' data-num' : '') + '>' + options + '</select></label>'; }
  function chk(k, label, on) { return '<label class="viz-check"><input type="checkbox" data-k="' + k + '"' + (on ? ' checked' : '') + '/> ' + label + '</label>'; }
  function num(k, label, v, min, max, step) { return '<label class="viz-f"><span>' + label + '</span><input type="number" data-k="' + k + '" data-num min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"/></label>'; }

  function renderOptions() {
    var P = CAT.products[cfg.product], g = cfg.gate, G = CAT.gates[g.type] || {}, h = [];
    // ---- Fence
    var groups = {};
    Object.keys(CAT.products).forEach(function (k) { var gr = CAT.products[k].group; (groups[gr] = groups[gr] || []).push(opt(k, CAT.products[k].label, cfg.product)); });
    h.push('<label class="viz-f"><span>Fence system</span><select data-k="product">' +
      Object.keys(groups).sort().map(function (gr) { return '<optgroup label="' + gr + '">' + groups[gr].join('') + '</optgroup>'; }).join('') + '</select></label>');
    if (P.styles) h.push(sel('style', 'Style', P.styles.map(function (s) { return opt(s[0], s[1], cfg.style); }).join('')));
    if (cfg.product === 'colorbond' && cfg.style === 'lattice') h.push(sel('lattice', 'Lattice style', Object.keys(CAT.lattice).map(function (k) { return opt(k, CAT.lattice[k], cfg.lattice); }).join('')));
    if (P.derivedHeight) {
      h.push(sel('palingLen', 'Paling height', opt(1650, '1650 mm (5\'4")', cfg.palingLen) + opt(1950, '1950 mm (6\'4")', cfg.palingLen), true));
      h.push(sel('palingW', 'Paling width', opt(125, '125 mm', cfg.palingW) + opt(150, '150 mm', cfg.palingW), true));
      h.push(sel('plinths', 'Plinth', opt(1, 'Single plinth board', cfg.plinths) + opt(2, 'Double plinth (+150 mm)', cfg.plinths), true));
      h.push(sel('sleepers', 'Treated pine sleepers (200 × 50)', opt(0, 'None', cfg.sleepers) + opt(1, '1 sleeper (+200 mm)', cfg.sleepers) + opt(2, '2 sleepers (+400 mm)', cfg.sleepers), true));
      h.push(chk('capping', 'Capping (+250 mm)', cfg.capping));
    } else h.push(num('height', 'Height (mm)', cfg.height, 900, 3600, 50));
    h.push(num('maxBay', 'Max panel width (mm)', cfg.maxBay, 300, P.maxBayLimit, 10));
    if (P.gapLabel) h.push(num('gap', P.gapLabel, cfg.gap, 0, 100, 1));
    if (P.chainOpts) h.push('<div class="viz-chk3">' + chk('rails.top', 'Top rail', cfg.rails.top) + chk('rails.mid', 'Middle rail', cfg.rails.mid) + chk('rails.bot', 'Bottom rail', cfg.rails.bot) + '</div>');
    if (!P.noPosts) {
      h.push(chk('retain.on', 'Retaining wall under the fence', cfg.retain.on));
      if (cfg.retain.on) h.push(num('retain.height', 'Retained height (mm)', cfg.retain.height, 200, 2000, 200));
    }
    $('tab-fence').innerHTML = h.join('');

    // ---- Gate
    h = [sel('gate.type', 'Gate type', CAT.gatesFor(cfg.product).map(function (k) { return opt(k, CAT.gates[k].label, g.type); }).join(''))];
    if (g.type !== 'none') {
      h.push(num('gate.width', 'Opening width (mm)', g.width, G.min, G.max, 10));
      h.push(sel('gate.position', 'Gate position', opt('start', 'At the Start dot', g.position) + opt('middle', 'In the middle', g.position) + opt('end', 'At the End dot', g.position)));
      if (!P.pool && CAT.isVehicle(g.type) && !CAT.forced(g.type)) h.push(chk('gate.auto', 'Automated (motorised)', g.auto));
      if (g.type !== 'boom' && g.type !== 'bollards') h.push(chk('gate.piers', 'Brick piers either side', g.piers));
      if (g.type === 'bollards') h.push(sel('gate.bollardH', 'Bollard rise', [600, 800, 1000].map(function (v) { return opt(v, v + ' mm', g.bollardH); }).join(''), true));
    }
    $('tab-gate').innerHTML = h.join('');

    // ---- Extras: residential access and pool-gate hardware
    h = [];
    if (g.type !== 'none' && !P.pool) {
      h.push(sel('gate.access', 'Access control', Object.keys(CAT.access).map(function (k) {
        return opt(k, CAT.access[k].label, g.access);
      }).join('')));
      if (CAT.isVehicle(g.type) && g.auto) h.push('<p class="viz-note">The concept includes automated gate safety beams. RJL confirms motor and safety requirements on site.</p>');
    } else if (P.pool && g.type !== 'none') {
      h.push('<p class="viz-note">Pool gates are shown as pedestrian gates with self-closing, self-latching hardware. The final barrier and gate must be assessed for your property.</p>');
    } else h.push('<p class="viz-note">Choose a gate in the Gate tab to explore residential access options.</p>');
    $('tab-extras').innerHTML = h.join('');

    // ---- Colour
    var isCB = COLOURS.some(function (c) { return c.k === cfg.colour && c.cb; });
    h = ['<div class="viz-swatches" role="radiogroup" aria-label="Colour">'];
    COLOURS.forEach(function (c) {
      var on = cfg.colour === c.k;
      h.push('<button type="button" class="viz-sw' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-colour="' + c.k + '" title="' + esc((c.cb ? 'COLORBOND® ' : '') + c.name) + '" aria-label="' + esc(c.name) + '" style="background:' + c.hex + '"></button>');
    });
    h.push('<label class="viz-sw viz-sw-custom' + (cfg.colour.charAt(0) === '#' ? ' on' : '') + '" title="Custom colour"><input type="color" data-k="colour" value="' + (cfg.colour.charAt(0) === '#' ? cfg.colour : '#3a3d40') + '" aria-label="Custom colour"/></label></div>');
    var cur = COLOURS.filter(function (c) { return c.k === cfg.colour; })[0];
    h.push('<p class="viz-colour-name">' + esc(cur ? (isCB ? 'COLORBOND® ' : '') + cur.name : 'Custom colour') + '</p>');
    if (cfg.product === 'chain') h.push('<p class="viz-note">Chainmesh is shown galvanised.</p>');
    h.push('<p class="viz-note">Colours on screen are a guide only. Check a physical sample before you choose.</p>');
    $('tab-colour').innerHTML = h.join('');

    btnOpen.disabled = !(g.type !== 'none' || cfg.turnstile !== 'none');
  }

  function setPath(o, path, v) { var k = path.split('.'), t = o; for (var i = 0; i < k.length - 1; i++) t = t[k[i]]; t[k[k.length - 1]] = v; }
  function onOption(e) {
    var el = e.target, k = el.getAttribute('data-k'); if (!k) return;
    var v = el.type === 'checkbox' ? el.checked : el.hasAttribute('data-num') ? +el.value : el.value;
    if (el.type === 'number') { if (isNaN(v)) return; v = Math.max(+el.min, Math.min(+el.max, v)); el.value = v; }
    if (k === 'product') {
      cfg = defaultsFor(v, cfg);
      openState = false; D.setOpen(0, true); btnOpen.textContent = 'Open gate'; btnOpen.setAttribute('aria-pressed', 'false');
    }
    else if (k === 'gate.type') {
      var keep = cfg.gate; cfg.gate = gateDefaults(v); cfg.gate.position = keep.position; cfg.gate.access = keep.access;
      openState = false; D.setOpen(0, true); btnOpen.textContent = 'Open gate'; btnOpen.setAttribute('aria-pressed', 'false');
    } else setPath(cfg, k, v);
    renderOptions(); applyDesign(); drawUI();
  }
  root.addEventListener('change', function (e) { if (e.target.closest('.viz-tabpanel-dyn')) onOption(e); });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-colour]'); if (!b) return;
    cfg.colour = b.getAttribute('data-colour'); renderOptions(); applyDesign();
    var again = root.querySelector('[data-colour="' + cfg.colour + '"]'); if (again) again.focus();
  });

  // ------------------------------------------------------------------ remove objects
  function setErase(on) {
    erase = on;
    root.classList.toggle('is-erasing', on);
    eraseBar.hidden = !on;
    btnErase.setAttribute('aria-pressed', String(on));
    view3d.style.visibility = on ? 'hidden' : '';
    hint.textContent = on ? 'Paint over the things you want removed, then press Remove.'
      : 'Drag Start and End to where the fence meets the ground. Drag the orange eye-level line to the horizon (where flat ground meets the sky).';
    drawPhoto(); drawUI(); updateEraseButtons();
  }
  function updateEraseButtons() {
    btnRemove.disabled = busy || !maskDirty; btnClearPaint.disabled = busy || !maskDirty;
    btnUndo.disabled = busy || !undo.length; btnEraseDone.disabled = busy;
  }
  function cancelRemoval() {
    if (eraseCancel) { eraseCancel(); eraseCancel = null; }
    busy = false;
    updateEraseButtons();
  }
  btnErase.addEventListener('click', function () { if (photo) setErase(!erase); });
  btnEraseDone.addEventListener('click', function () { setErase(false); });
  btnClearPaint.addEventListener('click', function () { maskCtx.clearRect(0, 0, W, H); maskDirty = false; updateEraseButtons(); drawPhoto(); });
  btnUndo.addEventListener('click', function () { var u = undo.pop(); if (!u) return; photo.getContext('2d').putImageData(u.data, u.x, u.y); updateEraseButtons(); drawPhoto(); });

  btnRemove.addEventListener('click', function () {
    if (!photo || busy || !maskDirty) return;
    var md = maskCtx.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (md[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return;
    var bw = x1 - x0 + 1, bh = y1 - y0 + 1, pad = Math.max(64, Math.round(Math.max(bw, bh) * 0.5));
    var rx = Math.max(0, x0 - pad), ry = Math.max(0, y0 - pad), rw = Math.min(W, x1 + pad + 1) - rx, rh = Math.min(H, y1 + pad + 1) - ry;
    var k = Math.min(1, ERASE_WORK / Math.max(rw, rh)), ww = Math.max(16, Math.round(rw * k)), wh = Math.max(16, Math.round(rh * k));
    var wc = document.createElement('canvas'); wc.width = ww; wc.height = wh;
    var wg = wc.getContext('2d'); wg.imageSmoothingQuality = 'high'; wg.drawImage(photo, rx, ry, rw, rh, 0, 0, ww, wh);
    var mc = document.createElement('canvas'); mc.width = ww; mc.height = wh;
    var mg = mc.getContext('2d'); mg.drawImage(mask, rx, ry, rw, rh, 0, 0, ww, wh);
    var ma = mg.getImageData(0, 0, ww, wh).data, hole = new Uint8Array(ww * wh), grow = 4;
    for (y = 0; y < wh; y++) for (x = 0; x < ww; x++) if (ma[(y * ww + x) * 4 + 3] > 10)      // grow the paint a little to catch edges
      for (var dy = -grow; dy <= grow; dy++) for (var dx = -grow; dx <= grow; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < ww && Y < wh) hole[Y * ww + X] = 1; }
    busy = true; updateEraseButtons();
    runRemoval(wg.getImageData(0, 0, ww, wh).data, hole, ww, wh, function (err, rgba) {
      busy = false; updateEraseButtons();
      if (err) { eraseStatus.textContent = err; return; }
      var rc = document.createElement('canvas'); rc.width = ww; rc.height = wh;
      rc.getContext('2d').putImageData(new ImageData(rgba, ww, wh), 0, 0);
      var hc = document.createElement('canvas'); hc.width = ww; hc.height = wh;
      var hd = hc.getContext('2d').createImageData(ww, wh);
      for (var i = 0; i < hole.length; i++) hd.data[i * 4 + 3] = hole[i] ? 255 : 0;
      hc.getContext('2d').putImageData(hd, 0, 0);
      var fc = document.createElement('canvas'); fc.width = rw; fc.height = rh;
      var fg = fc.getContext('2d'); fg.imageSmoothingQuality = 'high'; fg.drawImage(rc, 0, 0, rw, rh);
      fg.globalCompositeOperation = 'destination-in'; fg.drawImage(hc, 0, 0, rw, rh);    // soft-edged paste of the removed area only
      var pg = photo.getContext('2d');
      undo.push({ x: rx, y: ry, data: pg.getImageData(rx, ry, rw, rh) }); if (undo.length > UNDO_MAX) undo.shift();
      pg.drawImage(fc, rx, ry);
      maskCtx.clearRect(0, 0, W, H); maskDirty = false; updateEraseButtons(); drawPhoto();
      eraseStatus.textContent = 'Done. Paint again over anything left behind, or press Undo.';
      track('visualiser_remove_object');
    });
  });

  // AI removal first; if it cannot run in this browser, the texture-copy fallback is used.
  function runRemoval(rgba, hole, w, h, cb) {
    var id = ++jobId, useAI = !aiBroken, wk;
    try {
      if (useAI) { aiWorker = aiWorker || new Worker(root.getAttribute('data-ai')); wk = aiWorker; }
      else { fbWorker = fbWorker || new Worker(root.getAttribute('data-fallback')); wk = fbWorker; }
    } catch (e) {
      if (useAI) { aiBroken = true; runRemoval(rgba, hole, w, h, cb); return; }
      cb('Removing objects is not supported in this browser.'); return;
    }
    eraseStatus.textContent = useAI ? 'Starting the removal tool…' : 'Removing…';
    var finished = false;
    var timer = setTimeout(function () {
      if (useAI) { fallBack(); return; }
      finish('That took too long. Check your connection, or paint a smaller area.');
      wk.terminate(); if (useAI) aiWorker = null; else fbWorker = null;
    }, ERASE_TIMEOUT);
    eraseCancel = function () {
      finished = true; clearTimeout(timer); wk.terminate();
      if (useAI) aiWorker = null; else fbWorker = null;
    };
    function finish(err, data) { if (finished) return; finished = true; clearTimeout(timer); eraseCancel = null; cb(err, data); }
    function fallBack() {
      if (finished) return;
      finished = true; clearTimeout(timer); wk.terminate();
      aiBroken = true; aiWorker = null; eraseCancel = null;
      runRemoval(rgba, hole, w, h, cb);
    }
    wk.onerror = function () { if (useAI) fallBack(); else finish('Removal failed in this browser.'); };
    wk.onmessage = function (ev) {
      var m = ev.data; if (m.id !== id) return;
      if (m.stage === 'download') { eraseStatus.textContent = 'Downloading the removal tool (first time only, about 27 MB)… ' + Math.round(m.progress * 100) + '%'; return; }
      if (m.stage === 'thinking') { eraseStatus.textContent = 'Removing…'; return; }
      if (m.progress != null) { eraseStatus.textContent = 'Removing… ' + Math.round(m.progress * 100) + '%'; return; }
      if (m.error) { if (useAI) fallBack(); else finish('Could not remove that: ' + m.error + '.'); return; }
      finish(null, new Uint8ClampedArray(m.rgba));
    };
    var r2 = new Uint8ClampedArray(rgba), h2 = hole.slice();          // copies: the originals are kept for a retry
    if (useAI) wk.postMessage({ type: 'run', id: id, w: w, h: h, rgba: r2, hole: h2 }, [r2.buffer, h2.buffer]);
    else wk.postMessage({ id: id, w: w, h: h, rgba: r2, hole: h2 }, [r2.buffer, h2.buffer]);
  }

  // ------------------------------------------------------------------ export
  function composite(maxEdge, withFooter) {
    var k = maxEdge ? Math.min(1, maxEdge / Math.max(W, H)) : 1;
    var w = Math.round(W * k), h = Math.round(H * k);
    var band = withFooter ? Math.max(44, Math.round(h * 0.075)) : 0;
    var c = document.createElement('canvas'); c.width = w; c.height = h + band;
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(photo, 0, 0, w, h);
    // render the 3D model at this exact size with the same camera, then restore the screen view
    D.setView({ w: w, h: h, dpr: 1, f: focal() * k, cx: W / 2 * k, yh: horizon * k, camH: camH(), p0: ground(A), p1: ground(B) });
    g.drawImage(D.renderNow(), 0, 0, w, h);
    applyView();
    if (band) {
      g.fillStyle = '#071f38'; g.fillRect(0, h, w, band);
      var pad = Math.round(band * 0.2), lh = band - pad * 2, lx = pad;
      if (logo.complete && logo.naturalWidth) {
        var lw = Math.round(lh * logo.naturalWidth / logo.naturalHeight);
        g.fillStyle = '#fff'; g.fillRect(pad - 4, h + pad - 3, lw + 8, lh + 6); g.drawImage(logo, pad, h + pad, lw, lh);
        lx = pad + lw + pad * 2;
      }
      var text = 'Indicative concept only. Sizes estimated from the photo. RJL measures on site before quoting.  rjlfencingandgates.com.au · 0412 467 840';
      var fs = Math.round(band * 0.28);
      g.font = '600 ' + fs + 'px Arial, Helvetica, sans-serif';
      while (fs > 9 && g.measureText(text).width > w - lx - pad) { fs -= 1; g.font = '600 ' + fs + 'px Arial, Helvetica, sans-serif'; }
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, lx, h + band / 2);
    }
    return c;
  }
  function sitePhoto() {
    var k = Math.min(1, SEND_MAX / Math.max(W, H)), c = document.createElement('canvas');
    c.width = Math.round(W * k); c.height = Math.round(H * k); c.getContext('2d').drawImage(photo, 0, 0, c.width, c.height);
    return c;
  }
  function toBlob(c, q) {
    return new Promise(function (resolve, reject) {
      if (c.toBlob) c.toBlob(function (b) { if (b) resolve(b); else reject(new Error('export failed')); }, 'image/jpeg', q);
      else { try { var bin = atob(c.toDataURL('image/jpeg', q).split(',')[1]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); resolve(new Blob([a], { type: 'image/jpeg' })); } catch (e) { reject(e); } }
    });
  }
  btnDownload.addEventListener('click', function () {
    if (!photo) return;
    toBlob(composite(0, true), 0.9).then(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rjl-concept.jpg';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      track('visualiser_download', { system: cfg.product, gate: cfg.gate.type });
    }).catch(function () { say('The picture could not be saved on this device. Try “Send to RJL” instead.', true); });
  });
  function summary() {
    var c = COLOURS.filter(function (o) { return o.k === cfg.colour; })[0];
    return D.summary().replace(/colour #[0-9a-f]{6}/i, 'colour ' + (c ? (c.cb ? 'COLORBOND® ' : '') + c.name : cfg.colour)) +
      '\nPlaced on the visitor\'s photo; run length estimated from the photo (camera height ' + camH() + ' m).';
  }
  btnSend.addEventListener('click', function () {
    if (!photo) return;
    if (erase) setErase(false);
    root.classList.add('form-open');
    formWrap.hidden = false;
    $('vizChoice').textContent = summary();
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = form.querySelector('input[name="name"]'); if (first) setTimeout(function () { first.focus(); }, 400);
  });

  // ------------------------------------------------------------------ send to RJL (Netlify Forms, multipart)
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formStatus.classList.remove('is-error');
    if (!photo) { formStatus.textContent = 'Please upload a photo first.'; formStatus.classList.add('is-error'); return; }
    if (!form.elements.phone.value.trim() && !form.elements.email.value.trim()) { formStatus.textContent = 'Please add a phone number or an email so RJL can reply.'; formStatus.classList.add('is-error'); return; }
    if (!form.reportValidity()) return;
    var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
    formStatus.textContent = 'Sending…';
    form.elements.product.value = summary();
    Promise.all([toBlob(composite(SEND_MAX, true), 0.85), toBlob(sitePhoto(), 0.85)]).then(function (b) {
      var fd = new FormData(form); fd.delete('concept-image'); fd.delete('site-photo');
      fd.append('concept-image', b[0], 'rjl-concept.jpg'); fd.append('site-photo', b[1], 'site-photo.jpg');
      return fetch('/', { method: 'POST', body: fd });                 // browser sets the multipart boundary
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.hidden = true; done.hidden = false; done.focus();
      track('generate_lead', { form: 'photo-visualiser', system: cfg.product, gate: cfg.gate.type });
    }).catch(function () { btn.disabled = false; formStatus.textContent = 'Sorry, that did not send. Please try again, or call 0412 467 840.'; formStatus.classList.add('is-error'); });
  });

  renderOptions();
  showTab('tab-fence');
  setErase(false);

  // Test hooks for automated checks only (no effect on the page).
  root._vizTest = {
    cfg: function () { return cfg; },
    set: function (o) { Object.keys(o).forEach(function (k) { cfg[k] = o[k]; }); renderOptions(); applyDesign(); drawUI(); },
    place: function (a, b, hz) { A = a; B = b; if (hz != null) horizon = hz; applyDesign(); drawUI(); },
    layout: function () { return layoutInfo; }, length: runLength, open: function (t) { D.setOpen(t, true); },
    defaultsFor: defaultsFor, gateDefaults: gateDefaults
  };
})();

