# Enquiry measurement

Website enquiries include a random client lead ID (when Web Crypto is available), plus first-touch source, medium, campaign, entry route and referring host. Only those bounded marketing fields are stored in tab-local session storage for up to twelve hours; no names, email, phone, form text, photos or URL queries are stored there. They are submitted only with the enquiry and are not copied into analytics events. The host submission ID remains authoritative when JavaScript or storage is unavailable.

GA4 loads only on the production domains. Page/referrer queries are removed. Names, addresses, messages and files are excluded from event metadata. `form_start` identifies the lead form; `generate_lead` follows a successful host response and is deduplicated per form/page. Visualiser submissions use the same `form_name` parameter. A successful HTTP acknowledgement is not an inbox-delivery or qualified-sale check.

Commercial forms are selected by stable form names, retain native POST fallback, preserve data on failure, limit attachments to7MB combined and prevent repeated sends. Netlify’s form attributes are not used as browser selectors.

Verify actual GA4 reception and key-event settings in the analytics account, and reconcile accepted enquiries against the host submission records. Existing email recipients and notifications remain in place. Lead-to-quote and contribution reporting is provided by the maintenance app’s sales module when its server bridge is configured.
