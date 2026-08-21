import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowIcon } from "@/components/site/icons";
import { QuoteForm } from "@/components/site/quote-form";
import { JsonLd } from "@/components/site/json-ld";
import { GALLERY } from "@/lib/gallery";
import { pageHead } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import {
  AWARDS,
  CLIENTS,
  PROCESS,
  REVIEWS,
  SITE,
  STATS,
  TRUST_ITEMS,
} from "@/lib/site";
import { SUBURBS } from "@/lib/suburbs";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title:
        "Residential Fencing & Gates Bundoora | Automatic Gates, Colorbond, Pool Fencing | RJL",
      description:
        "Family-owned residential fencing within 100 km of Bundoora. Timber, Colorbond, custom steel gates, pool fencing, retaining walls and CAME automation. 10-year warranty. Call 0412 467 840.",
      path: "/",
      keywords:
        "residential fencing Bundoora, Colorbond fencing Melbourne, automatic gates Bundoora, steel fencing northern suburbs, pool fencing AS 1926, retaining walls Bundoora, RJL Fencing",
    }),
  component: Home,
});

function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Residential fencing and gates in Bundoora",
          url: `${SITE.origin}/`,
          about: { "@id": `${SITE.origin}/#business` },
        }}
      />
      <section
        className="hero"
        aria-labelledby="hero-heading"
        style={{ "--hero-image": 'url("/images/residential-frontage.png")' } as React.CSSProperties}
      >
        <div
          className="hero-media"
          role="img"
          aria-label="Contemporary Melbourne home with a dark slat fence and automated sliding gate"
        />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">
            <span />
            Residential fencing & gates · Bundoora
          </p>
          <h1 id="hero-heading">
            One local family for <em>fences, gates and automation.</em>
          </h1>
          <p className="hero-copy">
            RJL designs, fabricates and installs residential fencing, custom steel gates, pool
            barriers and retaining walls for homes within 100 km of Bundoora — with a 10-year
            warranty on custom steel.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/contact">
              Request a free quote
              <ArrowIcon />
            </Link>
            <a className="button button-quiet" href={`tel:${SITE.phoneTel}`}>
              <span className="rapid-status" style={{ display: "inline-block", marginRight: 8 }} />
              Call {SITE.phone}
            </a>
          </div>
        </div>
        <div className="hero-proof">
          <div>
            <strong>1990</strong>
            <span>Family-led since</span>
          </div>
          <div>
            <strong>100 km</strong>
            <span>From Bundoora</span>
          </div>
          <div>
            <strong>10 yr</strong>
            <span>Steel warranty</span>
          </div>
        </div>
      </section>

      <section className="trust" aria-label="RJL assurances">
        <p>Trusted protection, built in Melbourne</p>
        <div className="trust-items">
          {TRUST_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="stats" aria-label="Company figures">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section section-white">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Complete residential capability
          </p>
          <h2>
            Every layer of the boundary, <em>one accountable team.</em>
          </h2>
          <p className="muted">
            Serving homeowners in Bundoora and surrounding suburbs within 100 km — not a call
            centre, a workshop that still turns up on site.
          </p>
        </div>
        <div className="cards">
          {SERVICES.map((service) => (
            <article className="card" key={service.slug}>
              <h3>{service.nav}</h3>
              <p>{service.excerpt}</p>
              <Link className="card-link" to={`/services/${service.slug}` as "/services/$slug"}>
                Explore {service.nav}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-paper">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Selected work
          </p>
          <h2>
            Real frontages. <em>Melbourne-made steel.</em>
          </h2>
        </div>
        <div className="work-grid">
          {GALLERY.slice(0, 5).map((item, i) => (
            <Link
              key={item.src}
              to="/gallery"
              className="work-card"
              style={{ gridColumn: i === 0 ? "span 1" : undefined, minHeight: i === 0 ? 420 : 280 }}
            >
              <img src={item.src} alt={item.alt} />
              <div className="work-card-inner">
                <span className="eyebrow" style={{ color: "#ffb09e" }}>
                  {item.tag}
                </span>
                <strong>{item.caption}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section-white">
        <div className="awards">
          <div>
            <img
              src="/images/chris-alebakis-industry-legend.jpg"
              alt="Chris Alebakis, Australian Fencing Awards Hall of Fame inductee"
            />
          </div>
          <div>
            <p className="eyebrow dark">
              <span />
              Australian Fencing Awards
            </p>
            <h2>
              Chris Alebakis — <em>Industry Legend.</em>
            </h2>
            <p className="muted">
              Owner of RJL Fencing Pty Ltd, with more than 35 years in the trade. Inducted into the
              Australian Fencing Awards Hall of Fame, 2023 winner, 2025 Security/Safety Fencing
              finalist. The residential business is led with his son Jarrod, alongside{" "}
              <a href={SITE.commercial.url}>RJL Commercial Group</a>.
            </p>
            <div className="award-list">
              {AWARDS.map((award) => (
                <article key={award.title}>
                  <small>{award.year}</small>
                  <h3>{award.title}</h3>
                  <p className="muted">{award.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            How we work
          </p>
          <h2>
            A clear path from the kerb <em>to a finished gate.</em>
          </h2>
        </div>
        <div className="process">
          {PROCESS.map((step) => (
            <article key={step.step}>
              <b>{step.step}</b>
              <h3>{step.title}</h3>
              <p className="muted">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-white">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Service area
          </p>
          <h2>
            Residential coverage within <em>100 km of Bundoora.</em>
          </h2>
          <p className="muted">
            From our Bundoora base we install across Greater Melbourne and surrounding towns. Outer
            jobs to Geelong, Mornington and Wallan are assessed by project.
          </p>
        </div>
        <div className="suburb-cloud">
          {SUBURBS.slice(0, 36).map((suburb) => (
            <Link
              key={suburb.slug}
              className="suburb-chip"
              to={`/service-areas/${suburb.slug}` as "/service-areas/$suburb"}
            >
              {suburb.name}
            </Link>
          ))}
          <Link className="suburb-chip" to="/service-areas">
            All suburbs →
          </Link>
        </div>
      </section>

      <section className="section section-paper">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Google review · 5.0
          </p>
          <h2>
            Trusted on homes <em>and by major organisations.</em>
          </h2>
          <p className="muted">The same family that fences Telstra and Victoria Police still fences Bundoora backyards.</p>
        </div>
        <div className="reviews">
          {REVIEWS.map((review) => (
            <article className="review" key={review.name + review.meta}>
              <p>“{review.quote}”</p>
              <strong>{review.name}</strong>
              <span className="muted">{review.meta}</span>
            </article>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 28, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
          Also trusted by {CLIENTS.join(" · ")}
        </p>
      </section>

      <section className="section section-white" id="quote">
        <div className="section-head">
          <p className="eyebrow dark">
            <span />
            Free site assessment
          </p>
          <h2>
            Need a quote for your <em>fencing project?</em>
          </h2>
          <p className="muted">
            Call {SITE.phone} or send the form. We serve Bundoora and all surrounding suburbs
            within 100 km.
          </p>
        </div>
        <QuoteForm />
      </section>
    </>
  );
}
