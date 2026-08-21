import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";
import { REGIONS, SUBURBS, EXTRA_SUBURBS } from "@/lib/suburbs";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/service-areas/")({
  head: () =>
    pageHead({
      title: "Fencing Service Areas | 100 km of Bundoora | RJL Fencing Melbourne",
      description:
        "RJL Fencing installs timber, Colorbond, steel gates, pool fencing and retaining walls across Greater Melbourne within 100 km of Bundoora. Find your suburb.",
      path: "/service-areas",
      keywords:
        "fencing Bundoora, fencing Mill Park, fencing Epping, fencing Preston, fencing Greensborough, fencing Melbourne northern suburbs",
    }),
  component: AreasIndex,
});

function AreasIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Service areas", path: "/service-areas" },
        ])}
      />
      <PageHero
        eyebrow={`Within ${SITE.radiusKm} km of Bundoora`}
        title="Residential coverage across Greater Melbourne."
        intro="We quote and install from our Bundoora base. Outer jobs to Geelong, Mornington and Wallan are assessed by project."
        image="/images/hero-daytime.webp"
      />
      <section className="section section-white">
        {REGIONS.map((region) => {
          const list = SUBURBS.filter((s) => s.region === region);
          if (!list.length) return null;
          return (
            <div key={region} style={{ marginBottom: 36 }}>
              <h2>{region}</h2>
              <div className="suburb-cloud">
                {list.map((suburb) => (
                  <Link
                    key={suburb.slug}
                    className="suburb-chip"
                    to={`/service-areas/${suburb.slug}` as "/service-areas/$suburb"}
                  >
                    {suburb.name} {suburb.postcode}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        <div>
          <h2>Also within the 100 km radius</h2>
          <p className="muted">
            We quote these suburbs from Bundoora as well. Call if yours is not listed as a dedicated page — coverage is the radius, not a postcode list.
          </p>
          <div className="suburb-cloud">
            {EXTRA_SUBURBS.map((name) => (
              <span className="suburb-chip" key={name}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
