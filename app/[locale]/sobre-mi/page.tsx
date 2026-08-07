import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";
import { loc, locOrNull } from "@/lib/i18n/content";
import { type Locale } from "@/lib/i18n/dictionaries";
import { markdownToHtml } from "@/lib/markdown";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function AboutMePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";

  const settings = await getSiteSettings();
  if (!settings.aboutEnabled) notFound();

  const title = loc(settings.aboutTitle || (locale === "en" ? "About me" : "Sobre mí"), settings.aboutTitleEn, locale);
  const content = locOrNull(settings.aboutContent, settings.aboutContentEn, locale) ?? "";
  const html = markdownToHtml(content);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {settings.aboutCustomCss && (
        // CSS propio del admin (item #21) — pensado para cuando esto se
        // venda como plantilla y cada cliente quiera su propio toque.
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: settings.aboutCustomCss }} />
      )}

      <Reveal>
        <h1 className="text-center font-display text-4xl sm:text-5xl">{title}</h1>
      </Reveal>

      {settings.aboutImageUrl && (
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-10 aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl">
            <Image src={settings.aboutImageUrl} alt={title} fill className="object-cover" />
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        {/* eslint-disable-next-line react/no-danger */}
        <div className="about-content mt-10" dangerouslySetInnerHTML={{ __html: html }} />
      </Reveal>

      {!content && (
        <p className="mt-8 text-center font-mono text-sm text-[var(--ink-muted)]">
          {locale === "en" ? "Nothing here yet." : "Todavía no hay contenido cargado."}
        </p>
      )}
    </div>
  );
}
