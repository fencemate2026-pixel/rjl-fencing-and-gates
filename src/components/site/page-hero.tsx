import { Link } from "@tanstack/react-router";
import { ArrowIcon } from "./icons";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  primaryLabel = "Request a free quote",
  primaryHref = "/contact",
  secondaryLabel,
  secondaryHref,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section
      className="page-hero"
      style={image ? ({ "--hero-image": `url("${image}")` } as React.CSSProperties) : undefined}
    >
      <p className="eyebrow">
        <span />
        {eyebrow}
      </p>
      <h1>{title}</h1>
      <p className="hero-copy" style={{ marginTop: 0 }}>
        {intro}
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" to={primaryHref}>
          {primaryLabel}
          <ArrowIcon />
        </Link>
        {secondaryLabel && secondaryHref ? (
          <a className="button button-quiet" href={secondaryHref}>
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
