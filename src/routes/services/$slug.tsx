import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { QuoteForm } from "@/components/site/quote-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";
import { getService, SERVICES } from "@/lib/services";
import { FAQS } from "@/lib/faqs";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const service = loaderData?.service;
    if (!service) return {};
    return pageHead({
      title: service.title,
      description: service.description,
      path: `/services/${service.slug}`,
      keywords: service.keywords,
    });
  },
  component: ServicePage,
});

function ServicePage() {
  const { service } = Route.useLoaderData();
  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.nav, path: `/services/${service.slug}` },
        ])}
      />
      <JsonLd data={serviceJsonLd(service.nav, service.description, `/services/${service.slug}`)} />
      <JsonLd data={faqJsonLd(FAQS.slice(0, 4))} />
      <PageHero
        eyebrow={service.eyebrow}
        title={`${service.h1} ${service.em}`}
        intro={service.excerpt}
        image={service.image}
        secondaryLabel={`Call ${SITE.phone}`}
        secondaryHref={`tel:${SITE.phoneTel}`}
      />
      <section className="section section-white">
        <div className="awards">
          <div>
            <img src={service.image} alt={service.imageAlt} />
            <ul>
              {service.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="prose">
            {service.sections.map((section) => (
              <article key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.copy}</p>
                {section.points ? (
                  <ul>
                    {section.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-paper">
        <h2>Related services</h2>
        <div className="cards">
          {others.map((s) => (
            <article className="card" key={s.slug}>
              <h3>{s.nav}</h3>
              <p>{s.excerpt}</p>
              <Link className="card-link" to={`/services/${s.slug}` as "/services/$slug"}>
                Explore
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-white">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Quote this service
          </p>
          <h2>Free site assessment within 100 km of Bundoora.</h2>
        </div>
        <QuoteForm />
      </section>
    </>
  );
}
