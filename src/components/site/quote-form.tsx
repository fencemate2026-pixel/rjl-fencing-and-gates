import { useState } from "react";
import { SERVICES } from "@/lib/services";
import { SITE } from "@/lib/site";

const STORAGE_KEY = "rjl-residential-quotes";

export function QuoteForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!String(data.name || "").trim() || !String(data.phone || "").trim()) {
      setError("Please add your name and phone number so we can call you back.");
      return;
    }
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as unknown[];
    existing.unshift({ ...data, at: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 25)));
    setError("");
    setSent(true);
    form.reset();
  }

  if (sent) {
    return (
      <div className="card" role="status">
        <p className="eyebrow dark">
          <span />
          Quote received
        </p>
        <h3>We’ll call you within one business day.</h3>
        <p>
          If it is urgent, call{" "}
          <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a> now.
        </p>
        <button className="button button-dark" type="button" onClick={() => setSent(false)}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Full name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" autoComplete="tel" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label>
        Suburb
        <input name="suburb" autoComplete="address-level2" placeholder="Bundoora" />
      </label>
      <label className="full">
        Service
        <select name="service" defaultValue="Steel fencing & gates">
          {SERVICES.map((s) => (
            <option key={s.slug}>{s.nav}</option>
          ))}
          <option>Not sure — site assessment</option>
        </select>
      </label>
      <label className="full">
        Project notes
        <textarea name="message" placeholder="Boundary length, gate width, photos welcome in the follow-up call." />
      </label>
      {error ? (
        <p className="full" role="alert">
          {error}
        </p>
      ) : null}
      <div className="full">
        <button className="button button-primary" type="submit">
          Request a free quote
        </button>
      </div>
    </form>
  );
}
