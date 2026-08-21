import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/page-hero";
import { JsonLd } from "@/components/site/json-ld";
import { GALLERY } from "@/lib/gallery";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/gallery")({
  head: () =>
    pageHead({
      title: "Residential Fencing Gallery Melbourne | RJL Fencing & Gates",
      description:
        "See RJL residential fencing, custom steel gates, Colorbond, pool fencing and automation across Melbourne. Real jobs from the Bundoora workshop.",
      path: "/gallery",
    }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />
      <PageHero
        eyebrow="Selected work"
        title="Frontages, gates and pool barriers from the RJL workshop."
        intro="A mix of recent residential installs and the architectural steel the same family has been building since 1990."
        image="/images/residential-frontage.png"
        secondaryLabel={`Call ${SITE.phone}`}
        secondaryHref={`tel:${SITE.phoneTel}`}
      />
      <section className="section section-white">
        <div className="gallery-grid">
          {GALLERY.map((item) => (
            <figure key={item.src}>
              <img src={item.src} alt={item.alt} />
              <figcaption>
                {item.tag} · {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
