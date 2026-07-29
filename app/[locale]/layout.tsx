import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { SetHtmlLang } from "@/components/set-html-lang";
import { CustomCursor } from "@/components/custom-cursor";
import { FloatingNav } from "@/components/floating-nav";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";
  return (
    <div className="hide-native-cursor pt-14">
      <SetHtmlLang locale={locale} />
      <CustomCursor />
      {children}
      <FloatingNav locale={locale} />
    </div>
  );
}
