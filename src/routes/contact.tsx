import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { QuoteForm } from "@/components/site/quote-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      title: "Contact RJL Fencing Bundoora | Free Quotes & Site Assessments",
      description:
        "Get a free fencing quote in Bundoora. Call 0412 467 840, email info@rjlfencing.com.au or request a site assessment. Mon–Fri 7am–5pm, Saturday 8am–1pm.",
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Free quotes · No obligation"
        title="Tell us about the boundary. We’ll come and measure it."
        intro="Site assessments across 100 km of Bundoora. We reply within 24 hours — or call if the gate is already off the track."
        image="/images/hero-daytime.webp"
        secondaryLabel={`Call ${SITE.phone}`}
        secondaryHref={`tel:${SITE.phoneTel}`}
      />
      <section className="section section-white">
        <div className="awards">
          <div>
            <h2>Workshop & office</h2>
            <p>
              <a href={SITE.mapLink}>{SITE.address.full}</a>
            </p>
            <p>
              <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
              <br />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
            <ul className="muted">
              {SITE.hours.map((row) => (
                <li key={row.days}>
                  {row.days}: {row.hours}
                </li>
              ))}
            </ul>
            <p className="muted">ABN {SITE.abn} · We’ll never share your information.</p>
            <iframe
              className="map-frame"
              title="Map of RJL Fencing in Bundoora"
              src={SITE.mapEmbed}
              loading="lazy"
            />
          </div>
          <QuoteForm />
        </div>
      </section>
    </>
  );
}
