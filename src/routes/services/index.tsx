import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";
import { SERVICES } from "@/lib/services";

export const Route = createFileRoute("/services/")({
  head: () =>
    pageHead({
      title: "Residential Fencing Services Bundoora | Timber, Steel, Gates, Pool | RJL",
      description:
        "Timber, Colorbond, custom steel, automatic gates, pool fencing, palisade, retaining walls and boom gates. Free quotes within 100 km of Bundoora. Call 0412 467 840.",
      path: "/services",
    }),
  component: ServicesIndex,
});

function ServicesIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageHero
        eyebrow="Residential capability"
        title="Every layer of the home boundary, one team."
        intro="From paling and Colorbond to custom steel, pool compliance and automation — quoted on site, fabricated in Melbourne, installed by our own crew."
        image="/images/residential-frontage.png"
      />
      <section className="section section-white">
        <div className="cards">
          {SERVICES.map((service) => (
            <article className="card" key={service.slug}>
              <img src={service.image} alt={service.imageAlt} style={{ height: 140, objectFit: "cover" }} />
              <h3>{service.nav}</h3>
              <p>{service.excerpt}</p>
              <Link className="card-link" to={`/services/${service.slug}` as "/services/$slug"}>
                Read more
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
