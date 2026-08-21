import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { JsonLd } from "@/components/site/json-ld";
import { FAQS } from "@/lib/faqs";
import { breadcrumbJsonLd, faqJsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead({
      title: "Fencing FAQ Bundoora | Quotes, Warranty, Permits | RJL Fencing",
      description:
        "Answers on quotes, 10-year warranty, pool compliance, automation, permits and how far RJL Fencing travels from Bundoora. Call 0412 467 840.",
      path: "/faq",
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHero
        eyebrow="Questions homeowners actually ask"
        title="Straight answers before we come to measure."
        intro="If the answer is not here, call. We would rather talk through the Fences Act, a pool latch height or a motor size than leave you guessing."
      />
      <section className="section section-white faq">
        {FAQS.map((item) => (
          <details key={item.q} open>
            <summary>{item.q}</summary>
            <p className="muted">{item.a}</p>
          </details>
        ))}
        <p style={{ marginTop: 32 }}>
          <Link className="button button-dark" to="/contact">
            Still need a quote?
          </Link>
        </p>
      </section>
    </>
  );
}
