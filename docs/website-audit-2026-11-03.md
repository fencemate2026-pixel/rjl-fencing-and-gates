# RJL website audit and traffic work

Prepared 3 November 2026. Applies to RJL Commercial Group and RJL Fencing and Gates; retain each site's separate audience, identity, services and enquiry address.

## Sources and method

- Current GitHub production source: Commercial began at `401c43e2b5b6a3169d074bea00df40e8d9220b1b`; Residential at `f3c99c3816934f80406862275d1c00853fc6166b`. The urgent commercial VBA correction was committed as `87f3fc354dc094d274cbf9567ebac9a53d6bb25a` and independently observed on the live page.
- Live GET crawl of every original sitemap URL: 115 Commercial pages and 39 Residential pages. A second residential root-URL variant was fetched to compare its canonical destination. All returned HTTP 200. Unknown test routes on both domains returned 404; both non-www hosts redirected to their official www address.
- Current HTML, scripts, functions, deployment configuration, internal routes, metadata and structured data were inspected. The full published HTML is available as static source. Commercial's source mirror checks omitted binary assets against the verified GitHub tree; CI checks the actual complete checkout.
- Desktop browser checks of both homepages and the commercial compliance page. Relevant browser errors were distinguished from the browser extension's own metadata error.
- Owner confirmation: RJL is not VBA registered. References to regulator guidance do not mean RJL holds registration.
- Primary documentation: [Google Search Essentials](https://developers.google.com/search/docs/essentials), [crawlable internal links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [Netlify Forms](https://docs.netlify.com/manage/forms/setup/), [Netlify Blobs conditional writes](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), and [MDN WebXR session requests](https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession).

## What the audit found

| Finding | Evidence | Work applied |
|---|---|---|
| Incorrect VBA registration claim | Two cards on the commercial compliance page | Removed both; the urgent correction was verified live. No further matching claim remained in either site's current HTML after the correction; the Residential HTML contained none. The public bollard brochure's searchable text was also checked and contained no matching registration claim. |
| Designer entry uses a JavaScript-only fragment | `#design` is intentional application state, but has no static target when scripts are unavailable | Use `#rjl-designer` as the fallback and preserve `data-open-designer` so the normal button still opens the full editor. |
| AR startup can lose the visitor's activating tap | Published launcher awaited dependency loading before requesting an immersive session; the residential regression test failed | Prepare dependencies first and ask for a fresh Open AR tap. Port the cleanup/retry fixes to Commercial and test each published bundle. |
| AR retry can reuse a rejected preparation promise | Outer loader retained an exporter-preparation failure | Clear the cached promise on failure; verify a subsequent attempt can prepare again. |
| Stale commercial mobile stylesheet reference | The version in 117 page references matched none of the current file's MD5/SHA-1/SHA-256 prefixes | Refresh the version without redesigning the stylesheet. |
| Commercial production Netlify alias serves a duplicate copy | `https://rjlcommercial.netlify.app/` returned 200 without redirecting | Add explicit redirects for that production alias and its main-branch alias to the official domain, preserving deploy-preview hosts. |
| Photo-finish counters can lose concurrent increments | The old code read separate counters and then overwrote each with an increment | Reserve both allowances in one version-checked ledger. Preserve existing counts, keep the allowances unchanged, refund failed visitor attempts idempotently and fail closed on storage conflicts. |
| Residential titles can better identify the actual market | Several main service titles omitted Melbourne; the homepage description carried an undated review-count claim | Use descriptive service-and-Melbourne titles and a service-area description without an unverified current review total. Preserve historical, explicitly dated review snapshots. |

The original sitemap pages had one H1 each, distinct titles and descriptions, self-canonical URLs, valid JSON-LD, no accidental noindex directive, image alternative text, no orphan sitemap pages and no unresolved public asset paths in the inspected references. Every original sitemap page was reachable within two links from the homepage. These are checks of the site's discoverability, not proof of Google/Bing indexing, rankings or traffic.

## Work aimed at relevant traffic

Two distinct evergreen guides were published after their Netlify previews passed, using existing page designs and clearly labelled reference imagery:

- Commercial: **Commercial gate maintenance checklist for Melbourne facilities** — `/blog/commercial-gate-maintenance-checklist-melbourne`. Based on current RJL service scope and [WorkSafe Victoria's motorised sliding-gate maintenance guidance](https://www.worksafe.vic.gov.au/news/2024-12/company-fined-350000-after-fatal-gate-crush). It separates facility-manager observations from technical repair/testing and directs readers to the existing free report.
- Residential: **What affects the cost of fencing and gates in Melbourne?** — `/blogs/fencing-costs-melbourne-quote-checklist`. Explains quote inputs and scope comparisons without invented dollar rates. Links to the existing quote form and [Victorian BPC landscaping, fence and practitioner guidance](https://www.bpc.vic.gov.au/home-owners/home-renovation-and-building-essentials/landscaping).

Each guide has a research-assisted organisational byline, source links, real publication dates, canonical metadata and BlogPosting data. It is linked from the existing blog listing, homepage and relevant service pages, and included in the RSS feed and sitemap. The commercial recognition story and the residential 3D promotion are retained. No near-duplicate suburb pages or purchased links were added.

Next, inspect the new URLs and sitemap in authorised Search Console/Bing Webmaster accounts. IndexNow notification is an acknowledgement, not an indexing or ranking guarantee. The existing weekly article tasks should follow the updated editorial policy, business-claim rules, README and source checks.

## Traffic priorities after publication

| Priority | Action | Measurement |
|---|---|---|
| 1 | Establish reliable GA4 and Search Console access for both properties. Compare each with its own previous period; separate branded/non-branded searches, channels, landing pages and actual service areas. | Search clicks/impressions, landing-page sessions and accepted enquiries by service. |
| 2 | Use observed search queries and pages already gaining impressions to choose the next content improvement. Connect practical guides, actual project evidence and the relevant service page. | Query/page clicks and qualified enquiries; no invented keyword-volume estimate. |
| 3 | Keep one useful Australian article per site, with distinct commercial/homeowner topics and verified primary sources. | Indexed articles, relevant search clicks, service-page visits and enquiries. |
| 4 | Publish authorised project updates through verified social and Business Profile accounts, linking to the appropriate service or project page with bounded public campaign labels. | Referral sessions, calls and qualified enquiries, rather than impressions alone. |
| 5 | Check the actual Google Business Profile categories, service areas, website destination and contact consistency when account access is available. | Profile website clicks/calls and enquiry quality. |
| 6 | Evaluate paid search only with a separately agreed budget, geography, conversion definition and verified destination. | Cost per qualified enquiry and won-job contribution; no campaign was created or changed in this audit. |

Content and technical work can improve the opportunity to be discovered, but this audit cannot promise a ranking or visitor increase. Real query and conversion data must guide the next optimisation cycle.

## Verification and limits

- Source checks cover the revised complete HTML documents, sitemap links, metadata, JSON-LD, local assets, cache versions, anchors, registration wording and page discoverability. Current counts are 119 complete Commercial HTML documents / 116 sitemap URLs and 42 Residential HTML documents / 40 sitemap URLs.
- Automated tests cover service matching, prefills, accepted/rejected/offline form behaviour, analytics data minimisation, lead deduplication, the configured sales-bridge retry path, AR preparation/cleanup and concurrent photo-finish quotas. The source checker and tests are included in Git with a website-quality workflow.
- No live customer enquiry was submitted and no email/SMS was sent. A successful mocked submission test does not prove inbox receipt, spam classification, host form configuration or CRM reception.
- No paid photo-finish request or physical AR-camera session was run. Server quota tests simulate concurrency and storage conflicts; an AR-capable device is still needed to test physical placement.
- Mobile source/layout rules were reviewed, but the available browser was checked at its desktop viewport. No fresh mobile-device benchmark is claimed.
- Google's PageSpeed API returned HTTP 429 for both mobile measurement attempts. No new Lighthouse/PageSpeed score or field Core Web Vitals result is claimed.
- Metricool returned a recently connected Commercial brand and insufficient reporting rows for a trustworthy historical baseline. No Residential website analytics connection or usable Search Console report was retrieved. Returned zeros were not treated as evidence of no visitors. Windsor.ai was discoverable but was reported uninstalled in this session, despite the earlier connection discussion.
- Existing ISO 9001, manufacturer certification, approved-contractor and insurance-limit claims require owner-held evidence; their appearance in current marketing copy is not independent verification. These were flagged, not certified by this audit. Project-specific Victorian permit/practitioner requirements must be confirmed for the work before contracting.

## Publishing record

Both articles and the source fixes were merged after passing their intended Netlify deployment previews and website-quality checks. The live URLs, homepage links, RSS feeds, XML sitemaps, designer launch attributes, current photo-tool script versions and compiled photo-finish GET responses were independently verified. The commercial production Netlify alias now redirects to the official domain.

| Site | Merged pull request | Published code commit | Live guide |
|---|---|---|---|
| Commercial | [PR](https://github.com/fencemate2026-pixel/website/pull/46) | `ee5f279ee5c75d42fcf68fa3074fcfb708671a61` | [Open guide](https://www.rjlcommercialgroup.com/blog/commercial-gate-maintenance-checklist-melbourne) |
| Residential | [PR](https://github.com/fencemate2026-pixel/rjl-fencing-and-gates/pull/27) | `0501994acb1f350e5cc545cdec54d475d75d75cf` | [Open guide](https://www.rjlfencingandgates.com.au/blogs/fencing-costs-melbourne-quote-checklist) |

Commercial: 36 automated tests passed. Residential: 35 automated tests passed. Both complete source checkouts passed the GitHub website-quality workflow. Browser preview tests confirmed that both Start designing buttons enter the full editor; `#design` remains the application's intentional editor state, with a valid static anchor fallback.

IndexNow returned HTTP 202 for 10 changed Commercial URLs and 11 changed Residential URLs after the live verification files and pages were confirmed. This acknowledges submission; it does not establish crawling, indexing, ranking or traffic growth.

The two existing weekly article tasks were updated with the owner's no-VBA-claim, actual-source, Git/README/documentation and verification requirements. Their schedules were preserved.

### Separate account/integration checks still open

The Residential repository's Vercel deployment check reports an account deployment block, and its Cloudflare Workers build check reports failure. The current website deployment and the checks described above were verified through Netlify. The causes of those separate integration failures were not repaired or assumed to be code defects. The optional Cursor PR automation also reported a trial usage limit and did not start; the website-quality checks and Netlify previews did pass. These are recorded for account/configuration cleanup, without changing permissions, plans or providers.

Analytics/Search Console access, owner-held evidence for existing certification/approval/insurance claims, live enquiry receipt and physical AR-device testing remain the limitations described above. No visitor, revenue or ranking increase is claimed.
