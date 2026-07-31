import Link from "next/link";
import { confirmContactMessage } from "../actions";
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
    : { ok: false, error: locale === "en" ? "Missing token." : "Falta el token." };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {result.ok ? (
        <>
          <h1 className="font-display text-3xl">
            {locale === "en" ? `Thanks, ${result.name}!` : `¡Gracias, ${result.name}!`}
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">{dict.contact.success}</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl">
            {locale === "en" ? "Something went wrong" : "Algo no salió bien"}
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">{result.error}</p>
        </>
      )}

      <Link
        href={`/${locale}`}
        data-cursor="magnetic"
        className="glass mt-8 rounded-full px-5 py-2 font-mono text-xs"
      >
        Home
      </Link>
    </div>
  );
}
