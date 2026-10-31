# RJL service finder

`/find-a-service` uses a curated service catalog and deterministic, local keyword ranking. The homepage links to it before the service content (the residential 3D promotion stays first). All service links are present in the HTML when JavaScript is unavailable.

The matcher normalises common wording, favours specific phrases and distinctive terms, supports one-character spelling mistakes in longer words, ignores explicitly excluded product types and prioritises urgent faults involving gates, fences or access equipment. Unknown searches lead to the full directory and contact option. Results are suggestions; they do not establish hardware suitability or confirm a booking.

Search text stays in page memory. There is no search URL, browser storage, new third-party library or server request. Existing GA4 receives only service catalog IDs, site ID and result counts. Service and quote links use curated destinations; quote prefills accept existing form options only and preserve design handovers and other fields.

Edit `site/assets/service-catalog.js` when adding or retiring a service, update the static directory and CollectionPage ItemList in `site/find-a-service.html`, and refresh the affected asset version hashes. Maintain the same matcher in the two RJL repositories. No new APIs, credentials or paid services are required.

Validation: `node --test tests/service-matching.test.mjs`. Browser checks should cover a specific service, spelling variation, unknown search, urgent fault, keyboard use, mobile layout, no JavaScript and the quote prefill without posting a form. This feature does not control Google’s ranking algorithm or guarantee search rankings.
