import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteChrome } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/site/json-ld";
import { localBusinessJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import appCss from "../styles.css?url";

const APP_NAME = SITE.name;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0b0d0f" },
      { name: "description", content: SITE.description },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootDocument,
});

function NotFound() {
  return (
    <section className="section section-white">
      <p className="eyebrow dark">
        <span />
        404
      </p>
      <h1>That page is not on this site.</h1>
      <p className="muted">Try services, your suburb, or request a quote.</p>
      <p>
        <Link className="button button-dark" to="/">
          Back to home
        </Link>
      </p>
    </section>
  );
}

function RootDocument() {
  return (
    <html lang="en-AU" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <JsonLd data={localBusinessJsonLd()} />
          <SiteChrome>
            <Outlet />
          </SiteChrome>
        </AuthProvider>
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}
