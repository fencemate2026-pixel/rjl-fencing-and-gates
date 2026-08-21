import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { QuoteForm } from "@/components/site/quote-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";
import { getSuburb, nearbySuburbs } from "@/lib/suburbs";
import { SERVICES } from "@/lib/services";
import { FAQS } from "@/lib/faqs";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/service-areas/$suburb")({
  loader: ({ params }) => {
    const suburb = getSuburb(params.suburb);
    if (!suburb) throw notFound();
    return { suburb, nearby: nearbySuburbs(suburb, 8) };
  },
  head: ({ loaderData }) => {
    const suburb = loaderData?.suburb;
    if (!suburb) return {};
    return pageHead({
      title: `Fencing ${suburb.name} ${suburb.postcode} | Gates, Colorbond, Pool Fencing | RJL`,
      description: `Residential fencing and automatic gates in ${suburb.name} ${suburb.postcode}. Timber, Colorbond, custom steel, pool fencing and retaining walls. Free quotes from Bundoora. Call 0412 467 840.`,
      path: `/service-areas/${suburb.slug}`,
      keywords: `fencing ${suburb.name}, Colorbond ${suburb.name}, automatic gates ${suburb.name}, pool fencing ${suburb.name}, ${suburb.council}`,
    });
  },
  component: SuburbPage,
});

function SuburbPage() {
  const { suburb, nearby } = Route.useLoaderData();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Service areas", path: "/service-areas" },
          { name: suburb.name, path: `/service-areas/${suburb.slug}` },
        ])}
      />
      <JsonLd
        data={serviceJsonLd(
          `Residential fencing in ${suburb.name}`,
          `Timber, Colorbond, custom steel gates, pool fencing and retaining walls in ${suburb.name} ${suburb.postcode}.`,
          `/service-areas/${suburb.slug}`,
        )}
      />
      <JsonLd data={faqJsonLd(FAQS.slice(0, 5))} />
      <PageHero
        eyebrow={`${suburb.name} ${suburb.postcode} · ${suburb.council}`}
        title={`Residential fencing and gates in ${suburb.name}.`}
        intro={suburb.angle}
        image="/images/residential-frontage.png"
        secondaryLabel={`Call ${SITE.phone}`}
        secondaryHref={`tel:${SITE.phoneTel}`}
      />
      <section className="section section-white">
        <div className="prose">
          <h2>Fencing services in {suburb.name}</h2>
          <p>
            RJL Fencing Pty Ltd quotes and installs from Bundoora, {suburb.km === 0 ? "right here in our home suburb" : `about ${suburb.km} km from ${suburb.name}`}.
            We handle neighbour notice under the Fences Act, council character rules and pool compliance so you are not left translating Victorian regs.
          </p>
          <p>
            Typical {suburb.name} jobs include paling replacement, Colorbond colour-matched to the roof, custom steel frontages, AS 1926.1 pool barriers and CAME or Beninca driveway automation.
          </p>
        </div>
        <div className="cards" style={{ marginTop: 32 }}>
          {SERVICES.map((s) => (
            <article className="card" key={s.slug}>
              <h3>
                {s.nav} in {suburb.name}
              </h3>
              <p>{s.excerpt}</p>
              <Link className="card-link" to={`/services/${s.slug}` as "/services/$slug"}>
                {s.nav}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-paper">
        <h2>Nearby suburbs we also serve</h2>
        <div className="suburb-cloud">
          {nearby.map((n) => (
            <Link
              key={n.slug}
              className="suburb-chip"
              to={`/service-areas/${n.slug}` as "/service-areas/$suburb"}
            >
              {n.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="section section-white">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            {suburb.name} quote
          </p>
          <h2>Request a free site assessment in {suburb.name}.</h2>
        </div>
        <QuoteForm />
      </section>
    </>
  );
}
