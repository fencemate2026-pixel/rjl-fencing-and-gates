import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { NAV, SITE } from "@/lib/site";
import { ArrowIcon } from "@/components/site/icons";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-fg">
      <a className="visually-hidden" href="#main">
        Skip to content
      </a>
      <div className="header-top-stack">
        <a className="emergency-promise" href={`tel:${SITE.phoneTel}`}>
          <span className="rapid-status" aria-hidden="true" />
          RJL Residential — fencing, gates and automation across 100 km of Bundoora
          <ArrowIcon />
        </a>
        <div className="header-assurance-strip" aria-label="RJL service assurances">
          <span>Melbourne fabrication & installation</span>
          <span>Within 100 km of Bundoora</span>
          <Link to="/about">Licensed, insured, Hall of Fame</Link>
          <a href={`tel:${SITE.phoneTel}`}>Call {SITE.phone}</a>
        </div>
      </div>

      <header className="site-header">
        <Link className="brand" to="/" aria-label="RJL Fencing and Gates home">
          <img
            className="brand-logo-image"
            src="/logos/rjl-wordmark.svg"
            alt="RJL Fencing and Gates"
            width="520"
            height="140"
          />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV.map((item) =>
            "children" in item && item.children ? (
              <div className="nav-dropdown" key={item.href}>
                <Link to={item.href}>{item.label}</Link>
                <div className="nav-panel">
                  {item.children.map((child) => (
                    <Link to={child.href} key={child.href}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link to={item.href} key={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <Link className="header-cta" to="/contact">
          Request a free quote
        </Link>

        <button
          className="mobile-toggle"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {open ? (
        <nav className="mobile-menu" style={{ display: "block" }} aria-label="Mobile navigation">
          {NAV.flatMap((item) => [
            <Link key={item.href} to={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>,
            ...("children" in item && item.children
              ? item.children.map((child) => (
                  <Link key={child.href} to={child.href} onClick={() => setOpen(false)}>
                    {child.label}
                  </Link>
                ))
              : []),
          ])}
          <Link to="/contact" onClick={() => setOpen(false)}>
            Request a free quote
          </Link>
        </nav>
      ) : null}

      <main id="main">{children}</main>

      <footer>
        <div>
          <Link className="brand footer-brand" to="/" aria-label="RJL Fencing and Gates home">
            <img src="/logos/rjl-wordmark.svg" alt="" width="520" height="140" />
          </Link>
          <p>
            The residential arm of the RJL group — timber, Colorbond, custom steel, pool fencing,
            retaining walls and automatic gates within 100 km of Bundoora.
          </p>
          <a className="footer-address" href={SITE.mapLink} target="_blank" rel="noreferrer">
            {SITE.address.full}
          </a>
          <p>
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
            <br />
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
        <div className="footer-map">
          <iframe
            className="map-frame"
            title={`Map showing ${SITE.name} in Bundoora`}
            src={SITE.mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="footer-links">
          <Link to="/services">Services</Link>
          <Link to="/service-areas">Service areas</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <a href={SITE.commercial.url} rel="noreferrer">
            RJL Commercial Group
          </a>
          <a href={SITE.social.instagram} rel="noreferrer">
            Instagram
          </a>
          <a href={SITE.social.facebook} rel="noreferrer">
            Facebook
          </a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {SITE.legalName}
          </span>
          <span>ABN {SITE.abn}</span>
          <span>Fully licensed & insured · 10-year steel warranty</span>
        </div>
      </footer>

      <Link className="sticky-quote" to="/contact">
        Request a quote
        <ArrowIcon />
      </Link>
    </div>
  );
}
