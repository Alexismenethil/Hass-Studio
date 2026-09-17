"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./icon";
import { Sun } from "./cinema";
import { contactSchema, copy, whatsappLink, type Locale } from "@/lib/content";

type State = "idle" | "sending" | "sent" | "error";
type Values = { name: string; email: string; service: string; message: string; website: string };

/** A short form: name, email, service and a few words. */
export function ContactForm({
  locale,
  services,
  email,
  whatsapp,
}: {
  locale: Locale;
  services: string[];
  email: string;
  whatsapp: string;
}) {
  const t = copy[locale];
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<State>("idle");
  const [missing, setMissing] = useState<string[]>([]);
  const [values, setValues] = useState<Values>({ name: "", email: "", service: "", message: "", website: "" });
  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setMissing((list) => list.filter((k) => k !== key));
  };
  const draft = () =>
    [
      (locale === "es" ? "Hola, soy " : "Hi, I'm ") + (values.name || "…") + ".",
      values.service && t.yourService + ": " + values.service,
      values.message,
    ]
      .filter(Boolean)
      .join("\n");

  async function submit() {
    const message = { ...values, phone: "", locale, startedAt: startedAt.current };
    const checked = contactSchema.safeParse(message);
    if (!checked.success) {
      setMissing(checked.error.issues.map((issue) => String(issue.path[0])));
      return;
    }
    setMissing([]);
    setState("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div className="contact-card contact-sent" role="status">
        <div className="contact-sent-sky" aria-hidden="true">
          <span className="contact-sent-glow" />
          <span className="contact-sent-disc" />
          <Sun className="contact-sent-sun" />
        </div>
        <span className="eyebrow">{t.sentTitle}</span>
        <h2>
          {t.sentThanks}, <em>{values.name.split(" ")[0]}.</em>
        </h2>
        <p>
          {t.sentText} <b>{values.email}</b>
        </p>
        <button
          type="button"
          className="contact-again"
          onClick={() => {
            startedAt.current = Date.now();
            setValues((v) => ({ ...v, message: "", service: "" }));
            setState("idle");
          }}
        >
          {t.again}
        </button>
      </div>
    );

  const invalid = (key: string) => (missing.includes(key) ? " is-missing" : "");

  return (
    <form
      className={"contact-card" + (state === "sending" ? " is-sending" : "")}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <header className="contact-card-head">
        <h2>{t.formTitle}</h2>
        <span>
          <i /> {t.replyTime}
        </span>
      </header>

      <label className={"contact-field" + invalid("name")}>
        <span>{t.yourName}</span>
        <input
          name="name"
          autoComplete="name"
          maxLength={80}
          value={values.name}
          aria-invalid={missing.includes("name") || undefined}
          onChange={(e) => set("name", e.target.value)}
        />
      </label>
      <label className={"contact-field" + invalid("email")}>
        <span>{t.yourEmail}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={160}
          value={values.email}
          aria-invalid={missing.includes("email") || undefined}
          onChange={(e) => set("email", e.target.value)}
        />
      </label>
      <label className="contact-field is-select">
        <span>{t.yourService}</span>
        <select
          name="service"
          value={values.service}
          className={values.service ? "" : "is-empty"}
          onChange={(e) => set("service", e.target.value)}
        >
          <option value="">{t.chooseService}</option>
          {[...services, t.other].map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>
      <label className={"contact-field" + invalid("message")}>
        <span>{t.yourMessage}</span>
        <textarea
          name="message"
          rows={4}
          maxLength={3000}
          placeholder={t.messageHint}
          value={values.message}
          aria-invalid={missing.includes("message") || undefined}
          onChange={(e) => set("message", e.target.value)}
        />
      </label>

      {/* People never see this field; automated senders fill it in. */}
      <input
        className="contact-trap"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.website}
        onChange={(e) => set("website", e.target.value)}
      />

      {missing.length > 0 && (
        <p className="contact-note" role="alert">
          {t.checkFields}
        </p>
      )}
      {state === "error" && (
        <p className="contact-note" role="alert">
          {email || whatsapp ? t.formError : t.formRetry}{" "}
          {email && <a href={"mailto:" + email + "?body=" + encodeURIComponent(draft())}>{email}</a>}
          {email && whatsapp && " · "}
          {whatsapp && (
            <a href={whatsappLink(whatsapp, draft())} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
        </p>
      )}

      <button type="submit" className="contact-send" disabled={state === "sending"}>
        <span>{state === "sending" ? t.sending : t.send}</span>
        <Arrow diagonal />
      </button>
      {whatsapp && (
        <a className="contact-alt" href={whatsappLink(whatsapp, draft())} target="_blank" rel="noopener noreferrer">
          {t.orWhatsapp} <Arrow diagonal />
        </a>
      )}
    </form>
  );
}

/** The studio's time in Peru, shown once the page is in the browser. */
export function LocalTime({ locale, label }: { locale: Locale; label: string }) {
  const [now, setNow] = useState("");
  useEffect(() => {
    const format = new Intl.DateTimeFormat(locale === "es" ? "es-PE" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    });
    const tick = () => setNow(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 20000);
    return () => window.clearInterval(timer);
  }, [locale]);
  return (
    <span className="contact-time">
      {label} · Perú <b>{now || "—"}</b>
    </span>
  );
}
