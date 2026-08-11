import Link from "next/link";
import { confirmContactMessage } from "./actions";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";

function normalizeLocale(raw: string): Locale {
  return raw === "en" ? "en" : "es";
}

export const dynamic = "force-dynamic";

export default async function ConfirmContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const { token } = await searchParams;

  const result = token
    ? await confirmContactMessage(token)
    : { ok: false, error: locale === "en" ? "Missing link." : "Falta el link." };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {result.ok ? (
        <>
          <h1 className="font-display text-3xl">
            {locale === "en" ? "Message sent ✓" : "Mensaje enviado ✓"}
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">
            {locale === "en"
              ? "Thanks for confirming — your message is on its way to DJEZSHADOW."
              : "Gracias por confirmar — tu mensaje ya le llegó a DJEZSHADOW."}
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl">
            {locale === "en" ? "Something went wrong" : "Algo salió mal"}
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">{result.error}</p>
        </>
      )}
      <Link
        href={`/${locale}/contacto`}
        data-cursor="magnetic"
        className="mt-8 inline-block rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)]"
      >
        {dict.nav.contact}
      </Link>
    </div>
  );
}
