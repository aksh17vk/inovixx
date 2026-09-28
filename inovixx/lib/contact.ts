// Where an enquiry goes.
//
// Today an enquiry opens in the visitor's own mail client, addressed to
// CONTACT_EMAIL with the subject and body already written — no server, no
// database, nothing to keep running. Setting CONTACT_ENDPOINT takes over from
// it whenever there is somewhere to POST to. Both are plain strings on
// purpose: a static export has no server to read an environment variable at
// request time.
//
//   CONTACT_ENDPOINT  any URL that takes a JSON POST (a form service, a
//                     serverless function, an API route on another host)
//   CONTACT_EMAIL     an address; the enquiry opens in the visitor's mail
//                     client with the subject and body already written
//
// The form goes live as soon as either is set; nothing else has to change.
export const CONTACT_ENDPOINT = "";
export const CONTACT_EMAIL = "inovixx17@gmail.com";

export type Enquiry = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export function contactIsLive(): boolean {
  return Boolean(CONTACT_ENDPOINT || CONTACT_EMAIL);
}

export type FieldErrors = Partial<Record<keyof Enquiry, string>>;

// Deliberately forgiving: it is a contact form, not a passport check. It
// catches the honest slips (an empty field, a missing @) and lets everything
// else through rather than arguing with real addresses.
export function validate(enquiry: Enquiry): FieldErrors {
  const errors: FieldErrors = {};
  if (!enquiry.name.trim()) errors.name = "Please add your name.";
  const email = enquiry.email.trim();
  if (!email) errors.email = "Please add an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That address looks incomplete.";
  if (enquiry.message.trim().length < 10) errors.message = "A sentence or two, so we know what it is about.";
  return errors;
}

/** How the enquiry left: posted to an endpoint, or handed to a mail client. */
export type SendResult = "posted" | "mail";

export async function sendEnquiry(enquiry: Enquiry): Promise<SendResult> {
  if (CONTACT_ENDPOINT) {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enquiry),
    });
    if (!response.ok) throw new Error(`Contact endpoint answered ${response.status}`);
    return "posted";
  }

  if (CONTACT_EMAIL) {
    const subject = `Enquiry from ${enquiry.name}${enquiry.company ? ` (${enquiry.company})` : ""}`;
    const body = `${enquiry.message}\n\n— ${enquiry.name}\n${enquiry.email}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return "mail";
  }

  // The submit button is disabled in this state, so this is a guard, not a path.
  throw new Error("No contact destination is configured (see lib/contact.ts)");
}
