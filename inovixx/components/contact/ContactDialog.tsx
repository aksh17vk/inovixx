"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContactForm } from "./ContactForm";

// The enquiry form, as a dialog over the page.
//
// Every "Start a Conversation" / "Let's Talk" / "Contact" control on the site
// is already an anchor to #contact, so rather than rewriting each of them this
// listens for those clicks and opens instead. Anything that still points at
// #contact — a new button, a link in copy — joins in for free.
//
// A real <dialog> does the heavy lifting: showModal() traps focus, makes the
// rest of the page inert, closes on Escape and gives the backdrop its own
// pseudo-element. Focus returns to whatever opened it.
const OPENERS = 'a[href="#contact"], a[href="/#contact"]';

// Long enough to read as a movement, short enough that nobody waits for it.
const EXIT_MS = 260;
// After a successful send, the confirmation holds for a beat before the dialog
// bows out on its own.
const AFTER_SEND_MS = 2600;

export function ContactDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const cursorHost = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  };

  // Closing runs an animation first, so the panel leaves the way it arrived.
  const requestClose = useCallback(() => {
    setPhase((current) => (current === "open" ? "closing" : current));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Leave new-tab / new-window clicks to the browser.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target.closest(OPENERS) : null;
      if (!target) return;
      e.preventDefault();
      clearTimers();
      setPhase("open");
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;

    if (phase === "open") {
      if (!el.open) el.showModal();
      // A modal dialog does not stop the page behind it from scrolling.
      root.classList.add("is-dialog-open");
      // The dialog is in the browser's top layer, which sits above every
      // z-index on the page — including the custom cursor. Without this the
      // cursor is painted underneath it while `cursor: none` still applies,
      // so there is no pointer at all over the form. It goes into a host node
      // React always renders and never fills: dropped straight into the
      // dialog it would be a stray child, and React's own removals then throw.
      const cursor = document.querySelector(".mf-cursor");
      if (cursor && cursorHost.current) cursorHost.current.appendChild(cursor);
      return;
    }

    if (phase === "closing") {
      const t = window.setTimeout(() => setPhase("closed"), EXIT_MS);
      timers.current.push(t);
      return;
    }

    // closed
    if (el.open) el.close();
    root.classList.remove("is-dialog-open");
  }, [phase]);

  // The cursor goes back to the page when the dialog is not holding it —
  // including on unmount, where the library expects to find it in <body>.
  useEffect(() => {
    if (phase === "open") return;
    const cursor = document.querySelector(".mf-cursor");
    if (cursor && cursor.parentElement !== document.body) document.body.appendChild(cursor);
  }, [phase]);

  useEffect(
    () => () => {
      const cursor = document.querySelector(".mf-cursor");
      if (cursor && cursor.parentElement !== document.body) document.body.appendChild(cursor);
      document.documentElement.classList.remove("is-dialog-open");
    },
    []
  );

  const onSent = useCallback(() => {
    const t = window.setTimeout(requestClose, AFTER_SEND_MS);
    timers.current.push(t);
  }, [requestClose]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      data-phase={phase}
      // Escape fires `cancel`; take it over so the exit animation plays.
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={() => setPhase("closed")}
      // A click on the backdrop lands on the dialog itself, never on the panel.
      onClick={(e) => {
        if (e.target === ref.current) requestClose();
      }}
      aria-labelledby="contact-title"
    >
      {/* Home for the custom cursor while the dialog holds the top layer.
          Always mounted, never given children by React. */}
      <div ref={cursorHost} aria-hidden="true" />
      {/* Mounted only while it is on screen, so every visit starts on a
          blank form rather than on the last send's confirmation. */}
      {phase !== "closed" && (
      <div className="dialog-panel" data-lenis-prevent>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono-label text-[11px] text-violet-soft">CONTACT</p>
            <h2 id="contact-title" className="display-lg mt-3 font-display font-medium text-fg">
              Tell us what
              <br />
              <span className="text-gradient">you&rsquo;re building.</span>
            </h2>
          </div>
          <button type="button" onClick={requestClose} aria-label="Close" className="dialog-close">
            <span aria-hidden="true" className="dialog-close-x" />
          </button>
        </div>

        <p className="mt-4 max-w-md text-sm text-fg-muted">
          A problem worth solving, a product to build, or a technology worth exploring — a sentence
          or two is enough to start.
        </p>

        <div className="mt-8">
          <ContactForm onSent={onSent} />
        </div>
      </div>
      )}
    </dialog>
  );
}
