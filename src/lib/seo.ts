import { SITE } from "./site";
import { SERVICES } from "./services";
import { SUBURBS } from "./suburbs";

export function pageHead(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
}) {
  const url = `${SITE.origin}${opts.path === "/" ? "/" : opts.path}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      {
        name: "keywords",
        content:
          opts.keywords ??
          "residential fencing Bundoora, Colorbond fencing Melbourne, automatic gates Bundoora, pool fencing AS 1926, steel gates Melbourne, retaining walls Bundoora",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "author", content: SITE.legalName },
      { name: "geo.region", content: "AU-VIC" },
      { name: "geo.placename", content: "Bundoora" },
      { name: "geo.position", content: `${SITE.geo.latitude};${SITE.geo.longitude}` },
      { name: "ICBM", content: `${SITE.geo.latitude}, ${SITE.geo.longitude}` },
      { name: "theme-color", content: "#0b0d0f" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
        "@id": `${SITE.origin}/#business`,
        name: SITE.legalName,
        alternateName: [SITE.name, "RJL Fencing", "RJL Fencing and Gates"],
        url: `${SITE.origin}/`,
        logo: `${SITE.origin}/logos/rjl-wordmark.svg`,
        image: `${SITE.origin}/images/residential-frontage.png`,
        telephone: SITE.phoneTel,
        email: SITE.email,
        foundingDate: String(SITE.founded),
        priceRange: "$$",
        currenciesAccepted: "AUD",
        paymentAccepted: "Cash, EFT, Card",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.suburb,
          addressRegion: SITE.address.region,
          postalCode: SITE.address.postcode,
          addressCountry: SITE.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        hasMap: SITE.mapLink,
        sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.commercial.url],
        areaServed: [
          {
            "@type": "GeoCircle",
            name: `Primary ${SITE.radiusKm} km service radius from Bundoora`,
            geoMidpoint: {
              "@type": "GeoCoordinates",
              latitude: SITE.geo.latitude,
              longitude: SITE.geo.longitude,
            },
            geoRadius: SITE.radiusKm * 1000,
          },
          { "@type": "AdministrativeArea", name: "Victoria, Australia" },
          { "@type": "City", name: "Melbourne" },
          ...SUBURBS.slice(0, 24).map((s) => ({ "@type": "City", name: s.name })),
        ],
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "07:00",
            closes: "17:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Saturday",
            opens: "08:00",
            closes: "13:00",
          },
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: SITE.phoneTel,
            email: SITE.email,
            contactType: "sales",
            areaServed: "AU",
            availableLanguage: "English",
          },
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Residential fencing and gate services",
          itemListElement: SERVICES.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.nav,
              url: `${SITE.origin}/services/${s.slug}`,
              areaServed: `Within ${SITE.radiusKm} km of Bundoora, Victoria`,
            },
          })),
        },
        description: SITE.description,
        slogan: SITE.tagline,
        vatID: SITE.abn,
        award: [
          "Australian Fencing Awards Hall of Fame — Chris Alebakis",
          "Australian Fencing Awards Winner 2023",
          "Australian FENCING Awards 2025 Finalist — Security/Safety Fencing",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        url: `${SITE.origin}/`,
        name: SITE.name,
        publisher: { "@id": `${SITE.origin}/#business` },
        inLanguage: "en-AU",
      },
    ],
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.origin}${item.path}`,
    })),
  };
}

export function serviceJsonLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE.origin}${path}`,
    provider: { "@id": `${SITE.origin}/#business` },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: SITE.geo.latitude,
        longitude: SITE.geo.longitude,
      },
      geoRadius: SITE.radiusKm * 1000,
    },
    brand: SITE.name,
  };
}
