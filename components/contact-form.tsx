"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/app/[locale]/contacto/actions";

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const instagramHandle = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "djezshadow";

type Dict = {
  contact: {
    name: string;
    email: string;
    message: string;
    send: string;
    sending: string;
    whatsapp: string;
    instagram: string;
    success: string;
    confirmNotice: string;
  };
};

export function ContactForm({ dict, locale }: { dict: Dict; locale: string }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    null
  );

  return (
    <div className="space-y-8">
      <p className="rounded-xl bg-black/5 px-4 py-3 text-xs text-[var(--ink-muted)]">
        {dict.contact.confirmNotice}
      </p>
      <form action={formAction} className="glass space-y-4 rounded-2xl p-6">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">{dict.contact.name}</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">{dict.contact.email}</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">{dict.contact.message}</label>
          <textarea
            name="message"
            rows={4}
            required
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        {state?.error && <p className="text-sm text-[var(--accent-contrast)]">{state.error}</p>}
        {state?.ok && <p className="text-sm text-accent">{dict.contact.success}</p>}

        <button
          type="submit"
          disabled={pending}
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)] disabled:opacity-50"
        >
          {pending ? dict.contact.sending : dict.contact.send}
        </button>
      </form>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="magnetic"
          className="glass block rounded-2xl px-6 py-4 text-center font-mono text-sm"
        >
          {dict.contact.whatsapp}
        </a>
      )}

      <a
        href={`https://instagram.com/${instagramHandle}`}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="magnetic"
        className="glass block rounded-2xl px-6 py-4 text-center font-mono text-sm"
      >
        {dict.contact.instagram}
      </a>
    </div>
  );
}
