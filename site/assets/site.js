/*
 * site.js - replaces the two interactive pieces of the former React runtime.
 *  1. Mobile navigation toggle (Escape closes; body class mirrors original).
 *  2. Online enquiry form: multipart POST to Netlify Forms, with preserved
 *     input on failure and confirmation only after a successful response.
 *  3. Prefills the enquiry with a design handed over from /fence-designer.
 */
(function () {
  "use strict";

  // ---- 1. Mobile menu --------------------------------------------------
  var menu = document.querySelector(".mobile-menu");
  if (menu) {
    var btn = menu.querySelector(".mobile-menu-toggle");
    var panel = menu.querySelector(".mobile-menu-panel");
    var setOpen = function (open) {
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector("span").textContent = open ? "Close" : "Menu";
      panel.hidden = !open;
      document.body.classList.toggle("mobile-nav-open", open);
    };
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        e.preventDefault(); setOpen(false); btn.focus();
      }
    });
  }

  // ---- 2. Online quote form -------------------------------------------
  var form = document.querySelector(".email-enquiry form");
  if (form) {
    var status = document.querySelector("#quote-status");
    var submit = form.querySelector('button[type="submit"]');
    var pending = false, sent = false, started = false;
    var startedEvent = function () {
      if (!started) {
        started = true;
        document.dispatchEvent(new CustomEvent("rjl:quote-start", { detail: { form: "residential-quote" } }));
      }
    };
    form.addEventListener("input", startedEvent);
    form.addEventListener("change", startedEvent);
    var message = function (text, error) {
      status.hidden = false;
      status.className = "form-status" + (error ? " is-error" : "");
      status.setAttribute("role", error ? "alert" : "status");
      status.textContent = text;
    };
    form.addEventListener("submit", async function (e) {
      // Keep the native POST available in browsers without fetch/FormData.
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      if (pending || sent || !form.reportValidity()) return;
      startedEvent();
      var data = new FormData(form);
      if (!String(data.get("name") || "").trim() || !String(data.get("message") || "").trim()) {
        message("Please enter your name and project details.", true); status.focus(); return;
      }
      var files = [data.get("site-photo"), data.get("site-plan")];
      var total = files.reduce(function (sum, file) { return sum + (file && file.size || 0); }, 0);
      if (total > 7 * 1024 * 1024) {
        message("Your files are over 7 MB combined. Please choose smaller photos or a smaller plan, then try again. Your other details are still here.", true);
        status.focus(); return;
      }
      var allowed = /\.(jpe?g|png|webp|heic|heif|pdf)$/i;
      if (files.some(function (file) { return file && file.size && !allowed.test(file.name); })) {
        message("Please choose JPG, PNG, WebP or HEIC photos, or a PDF plan.", true); status.focus(); return;
      }
      pending = true;
      submit.disabled = true;
      var original = submit.innerHTML;
      submit.textContent = "Sending…";
      form.setAttribute("aria-busy", "true");
      message("Sending your quote request. Please keep this page open.", false);
      // Capture values before disabling inputs so FormData retains all fields.
      var enabled = Array.from(form.elements).filter(function (field) { return !field.disabled; });
      enabled.forEach(function (field) { field.disabled = true; });
      var controller = window.AbortController ? new AbortController() : null;
      var timeout = controller ? setTimeout(function () { controller.abort(); }, 30000) : null;
      try {
        // The browser supplies multipart Content-Type and its boundary.
        var response = await fetch("/", { method: "POST", body: data, signal: controller ? controller.signal : undefined });
        if (!response.ok) throw new Error("Submission not accepted");
        sent = true;
        form.hidden = true;
        message("Thank you. Your quote request has been submitted. Our team will review your details and contact you to discuss the next step. For anything urgent, call 0412 467 840. This is an enquiry, not a confirmed booking.", false);
        document.dispatchEvent(new CustomEvent("rjl:quote-submitted", { detail: { form: "residential-quote" } }));
        status.focus();
      } catch (error) {
        message("We couldn’t confirm your submission. Your details and files are still here. Please try again, or call 0412 467 840 if it keeps happening.", true);
        status.focus();
      } finally {
        if (timeout) clearTimeout(timeout);
        pending = false;
        form.removeAttribute("aria-busy");
        enabled.forEach(function (field) { field.disabled = false; });
        submit.disabled = sent;
        submit.innerHTML = original;
      }
    });
  }

  // Native disclosure menus support Escape and close when focus moves away.
  document.querySelectorAll('.suburb-nav').forEach(function (menu) {
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
    });
    menu.addEventListener('focusout', function (e) {
      if (!menu.contains(e.relatedTarget)) menu.open = false;
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) menu.open = false;
    });
  });
  // Suburb landing-page links prefill the existing enquiry address field.
  if (form) {
    var suburb = new URLSearchParams(window.location.search).get('suburb');
    var coreSuburbs = ['Bundoora', 'Mill Park', 'Epping', 'South Morang', 'Greensborough', 'Strathmore', 'Essendon'];
    var addressField = form.querySelector('#enquiry-address');
    if (coreSuburbs.indexOf(suburb) !== -1 && addressField && !addressField.value) addressField.value = suburb;
  }

  // Verified gallery/service links may suggest a project; arbitrary query text
  // is never copied into the enquiry or sent to analytics.
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var selectedService = params.get("service");
    var serviceField = form.querySelector("#enquiry-service");
    if (serviceField && selectedService) {
      Array.from(serviceField.options).forEach(function (option, index) {
        if (option.text === selectedService) serviceField.selectedIndex = index;
      });
    }
    var projects = {
      "richmond-automated-gates": "Richmond shared-entry project from across the RJL Group",
      "ringwood-custom-entry": "Ringwood custom-entry project from across the RJL Group",
      "toorak-pedestrian-fencing": "Toorak pedestrian-fencing project from across the RJL Group",
      "sliding-driveway-gate": "Custom sliding driveway gate",
      "timber-boundary": "Timber boundary fencing",
      "black-pool-barrier": "Architectural pool barrier",
      "steel-entry": "Steel gate and entry package",
      "glass-pool-barrier": "Frameless glass pool fencing",
      "gate-automation": "Residential gate automation",
      "picket-frontage": "Traditional picket frontage",
      "slat-boundary": "Contemporary slat boundary",
      "curved-pool-barrier": "Curved timber pool barrier"
    };
    var project = params.get("project"), messageField = form.querySelector("#enquiry-message");
    if (Object.prototype.hasOwnProperty.call(projects, project) && messageField && !messageField.value) {
      messageField.value = "I am interested in the " + projects[project] + " shown on the RJL website. Please quote a design suited to my property.\n\n";
    }
  }

  // A staged address checkout can hand the confirmed property to this form.
  if (form) {
    var propertyField = form.querySelector('#enquiry-address');
    var property = null;
    try {
      property = JSON.parse(sessionStorage.getItem('rjl-property-address') || 'null');
      sessionStorage.removeItem('rjl-property-address');
    } catch (err) { /* Manual entry remains available when storage is blocked. */ }
    if (propertyField && property && typeof property.address === 'string' &&
        Number.isFinite(property.confirmedAt) && Date.now() - property.confirmedAt >= 0 &&
        Date.now() - property.confirmedAt < 60 * 60 * 1000) {
      propertyField.value = [typeof property.unit === 'string' ? property.unit.slice(0, 80) : '',
        property.address.slice(0, 300)].filter(Boolean).join(', ');
    } else if (propertyField && !propertyField.value) {
      var manualProperty = new URLSearchParams(window.location.search).get('address');
      if (manualProperty) propertyField.value = manualProperty.slice(0, 400);
    }
    // Clear the query-string fallback once it has prefilled the local form.
    if (new URLSearchParams(window.location.search).has('address')) {
      var cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('address');
      window.history.replaceState(window.history.state, '', cleaned.href);
    }
  }

  // ---- 3. Design handed over from the 3D fence designer (/fence-designer) ----
  // The designer stores a plain-text summary in sessionStorage and comes here.
  // Prefill the project details once, then clear it. No data leaves the device.
  if (form) {
    try {
      var handed = JSON.parse(sessionStorage.getItem("rjl-design-quote") || "null");
      if (handed && handed.text) {
        var ta = form.querySelector("#enquiry-message"), sel = form.querySelector("#enquiry-service");
        if (ta) ta.value = handed.text.slice(0, 3900) + "\n\n";
        if (sel && handed.service) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === handed.service) sel.selectedIndex = i; }
        var note = document.createElement("p");
        note.className = "form-note";
        note.innerHTML = '<strong>Your 3D design has been added below.</strong> Add your details and send. <a href="/fence-designer">Back to the designer</a>';
        form.insertBefore(note, form.firstChild);
        sessionStorage.removeItem("rjl-design-quote");
        document.dispatchEvent(new CustomEvent("rjl:design-quote-added", { detail: { tool: "fence-designer" } }));
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) { /* storage blocked: the form still works normally */ }
  }
})();
