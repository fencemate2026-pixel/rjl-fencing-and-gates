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

## Residential content and location pages (October 2026)
- Canonical suburb pages: `/locations/fencing-mill-park`, `/locations/fencing-epping`, `/locations/fencing-south-morang`, and `/locations/fencing-greensborough`.
- Prior `/fencing-*` URLs and the shorter `/locations/<suburb>` variants redirect permanently to those pages in `netlify.toml`. Bundoora retains `/fencing-bundoora`.
- The shared Service suburbs menu links to canonical pages. Each suburb quote link prefills the existing enquiry address field; the email workflow is unchanged.
- `/llms.txt` contains the service summary and canonical links. Review figures are explicitly dated 7 October 2026, with a link to the live Google profile.
- Business JSON-LD keeps the legal identity and user-supplied Thomastown headquarters; it does not invent an address or Google-sourced self-review AggregateRating. FAQ JSON-LD mirrors the visible accordion answers.
- Pool installation, council registration, formal barrier certification and licensed electrical bonding remain distinct responsibilities. South Morang uses VIC 3752.
- FAQPage markup is retained for machine-readable content; Google retired FAQ rich results in May 2026. `llms.txt` is a reference file, not a Google ranking control.

## Address checkout for staging
- `staging/address-checkout.html` is a self-contained, responsive iframe document built with Google's current Places Autocomplete widget. It is outside the published `site/` folder until its browser API key and map ID are configured.
- The supplied Google-hosted iframe has no address/message integration bridge. Its title, button and US default map cannot be changed from this site's parent document. Use the controlled staging document or update the original solution at its source.
- Deployment and same-origin embed instructions are in the HTML. Enable Maps JavaScript API, Places API (New) and Geocoding API; restrict the browser key to the intended staging/production hosts. Configure the checkout CSP for Maps without removing existing protections; the parent needs `frame-src 'self'` for this same-origin iframe. Move inline code to external files or use server nonces when the staging host has a strict policy.
- Headquarters backup: Unit 1 / 12 Merchant Avenue, Thomastown VIC 3074. It is a map anchor, never an automatically selected customer property. A user confirms their own address before continuing to `/contact-us`; `site.js` consumes and clears the temporary handoff.
- The existing enquiry email workflow completes the quote request. Places/map lookup does not claim postal validation, property ownership, or a secured booking. When Maps is unavailable, manual address entry and a Google map preview remain usable.

## Residential photo visualiser (/photo-visualiser)
- Adapted from the commercial site's existing interface and photo placement/removal/export controls, using the shared RJL 3D model engine.
- Residential catalogue: Colorbond, timber paling, picket, horizontal/vertical aluminium slat, aluminium blades, steel battens, aluminium pool barriers, frameless glass, and steel picket/tubular. Pedestrian, single/double swing, track sliding and cantilever gates are available where suitable; pool barriers use pedestrian gates.
- The 3D designer stays in the main header alongside Photo visualiser. Service Suburbs and Google reviews are in the global footer, with the five-suburb text link row retained.
- Object removal downloads the existing MI-GAN model and ONNX Runtime WASM binaries only on demand, through three fixed same-origin Netlify rewrites to RJL Commercial. These three binary assets depend on that static host. Local fallback removal and Undo remain available if AI cannot run. Licences and worker/runtime JavaScript are included locally.
- WebAssembly permission is limited to the AI worker response. The page policy admits blob images to decode local uploads; it does not allow inline or evaluated JavaScript.
- The photo quote form uses Netlify Forms and includes the concept and edited site photo. Enable Forms detection and configure residential enquiry notifications in the Netlify project before live release. Verify a test submission in staging; client-side success alone is not an email-delivery check.
- To regenerate just shared designer assets without overwriting page wrappers: `python3 tools/build_fence_designer.py --assets-only`. Preserve asset version hashes when regenerating.
