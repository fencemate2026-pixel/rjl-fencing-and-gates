import { useState } from "react";
import type { FormEvent } from "react";
import { SERVICES } from "@/lib/services";

const ENQUIRY_EMAIL = "info@rjlfencing.com.au";
const ENQUIRY_SUBJECT = "Online Enquiry";

function prepareEmail(data: FormData) {
  const value = (name: string) => String(data.get(name) || "").trim();
  const body = [
    "Hello RJL Fencing and Gates,",
    "",
    "I would like to enquire about the following project.",
    "",
    `Full name: ${value("name")}`,
    `Phone: ${value("phone")}`,
    `Email: ${value("email")}`,
    `Suburb: ${value("suburb")}`,
    `Service: ${value("service")}`,
    "",
    "Project notes:",
    value("message"),
  ].join("\r\n");
  const subject = encodeURIComponent(ENQUIRY_SUBJECT);
  const encodedBody = encodeURIComponent(body);
  return {
    mailto: `mailto:${ENQUIRY_EMAIL}?subject=${subject}&body=${encodedBody}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${ENQUIRY_EMAIL}&su=${subject}&body=${encodedBody}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${ENQUIRY_EMAIL}&subject=${subject}&body=${encodedBody}`,
  };
}

export function QuoteForm() {
  const [draft, setDraft] = useState<ReturnType<typeof prepareEmail> | null>(null);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (!String(data.get("name") || "").trim() || !String(data.get("phone") || "").trim()) {
      setError("Please add your name and phone number so we can call you back.");
      return;
    }
    const email = prepareEmail(data);
    setError("");
    setDraft(email);
    window.location.href = email.mailto;
  }

  return (
    <form className="form-grid" onSubmit={onSubmit} onChange={() => setDraft(null)}>
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
        <textarea name="message" placeholder="Tell us the boundary length, gate width and any other project details." />
      </label>
      {error ? (
        <p className="full" role="alert">
          {error}
        </p>
      ) : null}
      <div className="full">
        <button className="button button-primary" type="submit">
          Open email enquiry
        </button>
        <p className="muted">
          Opens your email app with your details addressed to {ENQUIRY_EMAIL}.
          Review your enquiry and press Send in your email app. You can attach photos there.
        </p>
      </div>
      {draft ? (
        <div className="full card" role="status">
          <h3>Your email is ready to send</h3>
          <p>
            If your email app did not open, choose an option below.
            Your enquiry has not been sent by this website.
          </p>
          <p>
            <a href={draft.mailto}>Open email app</a>
            {" · "}
            <a href={draft.gmail} target="_blank" rel="noopener noreferrer">Open Gmail</a>
            {" · "}
            <a href={draft.outlook} target="_blank" rel="noopener noreferrer">Open Outlook / Hotmail</a>
          </p>
        </div>
      ) : null}
    </form>
  );
}
