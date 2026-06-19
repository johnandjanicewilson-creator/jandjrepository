"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-sage-light p-8 text-center">
        <p className="font-display text-2xl font-semibold text-sage">
          Thank you for reaching out!
        </p>
        <p className="mt-2 text-muted">
          We&apos;ll get back to you soon. In the meantime, explore our latest
          stories on the blog.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="w-full resize-y rounded-lg border border-border px-3 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark sm:w-auto"
      >
        Send message
      </button>
    </form>
  );
}
