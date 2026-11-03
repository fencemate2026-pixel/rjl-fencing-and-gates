# Google and Bing discovery

Blogs are static HTML linked from navigation, homepage and the article listing. tools/build_blog_feed.py rebuilds RSS from real published article metadata. New posts must update listing, RSS and XML sitemap with correct canonical URLs and dates. Index pages include CollectionPage/ItemList data for actual articles; official social profiles are linked without invented identities.

Google can discover the sitemap and RSS through robots.txt and feed autodiscovery. Discovery does not guarantee indexing or ranking. Do not use the retired Google sitemap ping endpoint or the limited Google Indexing API for ordinary blogs.

After changed pages and the root verification file are live, tools/notify_indexnow.py can notify Bing and other participating engines of changed canonical URLs. It verifies the key file and accepts only this host's public canonical URLs. HTTP200/202 is notification acknowledgement, not proof of crawling, indexing or ranking. Never submit previews, customer data or campaign query URLs.

Actual queries, search performance, indexing reports and account verification still require authorised Search Console and Bing Webmaster connections. No account submission or ranking uplift is claimed without evidence.
