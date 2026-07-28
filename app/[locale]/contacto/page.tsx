import { ContactForm } from "@/components/contact-form";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";

function normalizeLocale(raw: string): Locale {
  return raw === "en" ? "en" : "es";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(normalizeLocale(rawLocale));
  return { title: dict.contact.title };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl">{dict.contact.title}</h1>
      <p className="mt-2 mb-8 text-[var(--ink-muted)]">{dict.contact.subtitle}</p>
      <ContactForm dict={dict} />
    </div>
  );
}
