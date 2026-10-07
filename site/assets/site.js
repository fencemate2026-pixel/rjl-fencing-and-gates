/*
 * site.js - replaces the two interactive pieces of the former React runtime.
 *  1. Mobile navigation toggle (Escape closes; body class mirrors original).
 *  2. Email enquiry form: builds a pre-filled email (mailto + Gmail/Outlook
 *     fallbacks), identical wording to the original form. No data leaves the
 *     visitor's device; nothing is stored.
 */
(function () {
  "use strict";
  var EMAIL = "info@rjlfencing.com.au";

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
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  // ---- 2. Email enquiry form ------------------------------------------
  var form = document.querySelector(".email-enquiry form");
  if (form) {
    var status = document.createElement("div");
    form.appendChild(status);
    form.addEventListener("input", function () { status.className = ""; status.innerHTML = ""; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var g = function (k) { return String(d.get(k) || "").trim(); };
      if (!g("name") || !g("message")) {
        status.className = "form-status is-error";
        status.setAttribute("role", "alert");
        status.textContent = "Please enter your name and project details.";
        return;
      }
      var body = ["Hello RJL Fencing and Gates,", "", "I would like to enquire about the following project.", "",
        "Full name: " + g("name"), "Phone: " + g("phone"), "Email: " + g("email"),
        "Suburb / site address: " + g("address"), "Service: " + g("service"), "", "Project details:", g("message")].join("\r\n");
      var subj = "Online%20Enquiry", b = encodeURIComponent(body);
      var mailto = "mailto:" + EMAIL + "?subject=" + subj + "&body=" + b;
      var gmail = "https://mail.google.com/mail/?view=cm&fs=1&to=" + EMAIL + "&su=" + subj + "&body=" + b;
      var outlook = "https://outlook.live.com/mail/0/deeplink/compose?to=" + EMAIL + "&subject=" + subj + "&body=" + b;
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.innerHTML = "<strong>Your enquiry is ready to send.</strong><p>If your email app did not open, choose an option below. Press Send in your email app to submit your enquiry.</p>" +
        '<p><a href="' + mailto + '">Open email app</a> · <a href="' + gmail + '" target="_blank" rel="noopener noreferrer">Gmail</a> · ' +
        '<a href="' + outlook + '" target="_blank" rel="noopener noreferrer">Outlook / Hotmail</a></p>';
      // Tell ga.js a valid enquiry was produced (no personal details passed).
      document.dispatchEvent(new CustomEvent("rjl:enquiry-ready", { detail: { service: g("service") } }));
      window.location.href = mailto;
    });
  }
})();
