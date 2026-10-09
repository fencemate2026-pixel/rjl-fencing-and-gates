# rjlfencingandgates.com.au

Plain static site (HTML + one CSS file + one small script). No build step.

- `site/` - the website. Each page is `site/<page-name>.html`.
- `site/assets/site.js` - mobile menu and email enquiry form.
- `site/assets/ga.js` - Google Analytics (G-N0LPMXRT3D) and lead events: phone_click, email_click, quote_form_submit, chat_open, google_reviews_click.
- `site/assets/chat.js` - "Ask RJL" assistant (fixed, source-linked answers; no AI, nothing sent anywhere).
- `tools/build_site.py` - converted the original ChatGPT-built site to this
  static version and applied the Oct 2026 changes (service area limited to
  Melbourne's north and north-east; Google reviews featured site-wide).
- `tools/verify.py` - browser test: every page loads with no errors, form and
  mobile menu work. Run `python3 tools/serve.py site` then `python3 tools/verify.py`.
- `tools/audit-log.txt` - every automated edit, per page.

Hosting: Netlify project `rjlfencingandgates`, publish directory `site`.

## 3D fence designer (/fence-designer)
- Master file: `tools/designer/rjl-fence-gate-designer.html` (the full internal RJL tool with materials and quote).
- Build the website copy: `python3 tools/build_fence_designer.py` (first run: `THREE_SRC=/path/to/node_modules/three` for three@0.128.0).
- Website mode hides materials, prices and rules. "Add to online quote" hands a plain-text design summary to `/contact-us`
  via sessionStorage (prefilled by `site/assets/site.js`). Nothing is sent to a server.
- `dist/commercial-fence-designer/` is a drop-in copy for rjlcommercialgroup.com (RJL Commercial logo, own email quote page).
