"use client";

import { useRef, useState, type FormEvent } from "react";
import { MagneticButton, Arrow } from "@/components/ui/MagneticButton";
import {
  contactIsLive,
  sendEnquiry,
  validate,
  type Enquiry,
  type FieldErrors,
  type SendResult,
} from "@/lib/contact";

const EMPTY: Enquiry = { name: "", email: "", company: "", message: "" };

export function ContactForm({ onSent }: { onSent?: () => void }) {
  const [values, setValues] = useState<Enquiry>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [how, setHow] = useState<SendResult | null>(null);
  // Bots fill in every field they find; people never see this one.
  const trap = useRef<HTMLInputElement>(null);
  const live = contactIsLive();

  const set = (field: keyof Enquiry) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    // Clear a complaint as soon as they start answering it, not on the next submit.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (trap.current?.value) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Take them to the first thing that needs fixing. Read it off the
      // result, not the DOM: the error attributes are a render away.
      const first = (Object.keys(values) as (keyof Enquiry)[]).find((k) => found[k]);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    setState("sending");
    try {
      setHow(await sendEnquiry(values));
      setState("sent");
      setValues(EMPTY);
      onSent?.();
    } catch {
      setState("failed");
    }
  };

  const field = (name: keyof Enquiry, label: string) => ({
    id: `contact-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
    className: "field",
    "aria-label": label,
  });

  // Sent: the fields have nothing left to say, so the panel becomes the
  // answer — a ring closing around a tick that draws itself.
  if (state === "sent") {
    return (
      <div className="sent" role="status">
        <svg className="sent-mark" viewBox="0 0 64 64" aria-hidden="true">
          <circle className="sent-ring" cx="32" cy="32" r="29" />
          <path className="sent-tick" d="M20 33.5 L28.5 42 L45 24" />
        </svg>
        <p className="sent-title font-display text-2xl font-medium tracking-tight text-fg">
          {how === "mail" ? "Ready to send" : "Message sent"}
        </p>
        <p className="sent-note max-w-sm text-sm text-fg-muted">
          {how === "mail"
            ? "Your email app is opening with the message written — press send there and it reaches us."
            : "Thank you — we’ll be in touch."}
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      {/* Bait for bots. Off-screen rather than display:none, which some fill anyway. */}
      <input
        ref={trap}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-fg-muted">
          Name
          <input {...field("name", "Name")} type="text" autoComplete="name" placeholder="Your name" />
          {errors.name && (
            <span id="contact-name-error" className="field-error">
              {errors.name}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm text-fg-muted">
          Email
          <input {...field("email", "Email")} type="email" autoComplete="email" placeholder="you@company.com" />
          {errors.email && (
            <span id="contact-email-error" className="field-error">
              {errors.email}
            </span>
          )}
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm text-fg-muted">
        Company <span className="text-fg-faint">(optional)</span>
        <input {...field("company", "Company")} type="text" autoComplete="organization" placeholder="Where you work" />
      </label>

      <label className="mt-5 flex flex-col gap-2 text-sm text-fg-muted">
        What can we help with?
        <textarea
          {...field("message", "What can we help with?")}
          rows={5}
          placeholder="What you are trying to build, and where it is stuck."
        />
        {errors.message && (
          <span id="contact-message-error" className="field-error">
            {errors.message}
          </span>
        )}
      </label>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <MagneticButton type="submit" size="lg" disabled={!live || state === "sending"}>
          {state === "sending" ? "Sending…" : "Send enquiry"}
          <Arrow />
        </MagneticButton>

        {/* Say what is true: a mail client opening is not the same as a message
            delivered, and the visitor still has to press send over there. */}
        {!live && (
          <p className="text-sm text-fg-faint">
            Not connected yet — an inbox goes in <code className="text-fg-muted">lib/contact.ts</code>.
          </p>
        )}
        {state === "failed" && (
          <p role="alert" className="text-sm text-pink">
            That didn’t send. Please try again in a moment.
          </p>
        )}
      </div>
    </form>
  );
}
