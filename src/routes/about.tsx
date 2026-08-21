import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { SITE, STATS, AWARDS } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About RJL Fencing Melbourne | Trusted Since 1990 | Hall of Fame",
      description:
        "RJL Fencing Pty Ltd was established by Chris Alebakis in 1990. Family-led with Jarrod, Hall of Fame inductee, 10-year steel warranty, serving 100 km from Bundoora.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHero
        eyebrow="Family-led · Melbourne owned"
        title="Melbourne’s trusted residential fencing experts since 1990."
        intro="What started as a small local business has become a name homeowners and major organisations both recognise — still run by Chris and Jarrod Alebakis."
        image="/images/chris-alebakis-industry-legend.jpg"
        secondaryLabel={`Call ${SITE.phone}`}
        secondaryHref={`tel:${SITE.phoneTel}`}
      />
      <section className="section section-white">
        <div className="prose">
          <p>
            Since its establishment by Chris in 1990, RJL Fencing has grown into one of Melbourne’s
            most reputable fencing companies. Today the residential company — {SITE.legalName} — is
            led by Chris and his son Jarrod, with commercial, automation and supporting trades
            aligned under the wider RJL group.
          </p>
          <p>
            We have built a reputation for reliability, quality craftsmanship and service that has
            earned the trust of organisations including Telstra Australia, the Department of Housing
            and Victoria Police. Those same standards apply to a paling fence in Mill Park or a
            laser-cut gate in Kew.
          </p>
          <p>
            In recognition of outstanding contribution to the profession, RJL won at the Australian
            Fencing Awards on a first-time entry. Chris has since been inducted into the Australian
            Fencing Awards Hall of Fame, and the company was a 2025 finalist in Security/Safety
            Fencing.
          </p>
          <p>
            Our product range includes custom steel gates and panels, timber and Colorbond
            boundaries, AS 1926.1 pool fencing, concrete sleeper retaining walls, and CAME / Beninca
            automation. We offer a 10-year warranty on custom steel gates and panels.
          </p>
          <p>
            Commercial and enterprise perimeter work is delivered by{" "}
            <a href={SITE.commercial.url}>{SITE.commercial.name}</a>. This site is the residential
            side of the group — homes, townhouses, small strata and the streets within 100 km of
            Bundoora.
          </p>
        </div>
      </section>
      <section className="stats">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>
      <section className="section section-paper">
        <div className="award-list">
          {AWARDS.map((award) => (
            <article key={award.title}>
              <small>{award.year}</small>
              <h3>{award.title}</h3>
              <p className="muted">{award.copy}</p>
            </article>
          ))}
        </div>
        <p style={{ marginTop: 32 }}>
          <Link className="button button-dark" to="/contact">
            Talk to the residential team
          </Link>
        </p>
      </section>
    </>
  );
}
