import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { SetHtmlLang } from "@/components/set-html-lang";
import { FloatingNav } from "@/components/floating-nav";
import { Footer } from "@/components/footer";
import { RandomExifCapsule } from "@/components/random-exif-capsule";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";

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
    <div className="djez-content-offset flex min-h-screen flex-col">
      <SetHtmlLang locale={locale} />
      <div className="flex-1">{children}</div>
      <Footer locale={locale} />
      <FloatingNav locale={locale} />
      <RandomExifCapsule />
      <KonamiEasterEgg locale={locale} />
    </div>
  );
}
