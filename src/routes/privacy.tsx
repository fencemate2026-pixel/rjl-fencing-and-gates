import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { pageHead } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy | RJL Fencing Pty Ltd",
      description: "How RJL Fencing Pty Ltd collects and uses enquiry details for residential fencing quotes in Victoria.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="RJL Fencing Pty Ltd"
        title="Privacy policy"
        intro="We collect only what we need to quote and complete your fencing work."
      />
      <section className="section section-white">
        <div className="prose">
          <p>
            Enquiries submitted through this website are stored so we can return your call. We do not sell
            contact details. Information may be shared with the wider RJL group only when a job is better
            delivered by {SITE.commercial.name}.
          </p>
          <p>
            Hosting and analytics providers may process technical data such as IP address and pages viewed.
            You can request access or deletion by emailing {SITE.email}.
          </p>
          <p>
            This policy applies to {SITE.legalName}, ABN {SITE.abn}, {SITE.address.full}.
          </p>
        </div>
      </section>
    </>
  );
}
