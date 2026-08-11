import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";

const icons: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 2h-3.2v13.6c0 1.5-1.2 2.7-2.7 2.7a2.7 2.7 0 0 1-2.7-2.7 2.7 2.7 0 0 1 2.7-2.7c.3 0 .6 0 .9.1V9.7c-.3 0-.6-.1-.9-.1a5.9 5.9 0 0 0-5.9 5.9A5.9 5.9 0 0 0 10.6 21a5.9 5.9 0 0 0 5.9-5.9V8.4a8 8 0 0 0 4.6 1.5V6.7a4.8 4.8 0 0 1-4.6-4.7Z" />
    </svg>
  ),
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7.5" y1="10" x2="7.5" y2="16.5" />
      <circle cx="7.5" cy="7" r="0.4" fill="currentColor" />
      <path d="M11.5 16.5V10M11.5 12.5c0-1.4 1-2.5 2.4-2.5s2.6 1.1 2.6 2.5v4" />
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  let settings = {
    aboutEnabled: false,
    footerInstagramUrl: null as string | null,
    footerTiktokUrl: null as string | null,
    footerLinkedinUrl: null as string | null,
    footerYoutubeUrl: null as string | null,
  };
  try {
    settings = await getSiteSettings();
  } catch {
    // sin DB, footer igual muestra Contacto
  }

  const socials = [
    { key: "instagram", url: settings.footerInstagramUrl },
    { key: "tiktok", url: settings.footerTiktokUrl },
    { key: "linkedin", url: settings.footerLinkedinUrl },
    { key: "youtube", url: settings.footerYoutubeUrl },
  ].filter((s) => s.url);

  return (
    <footer className="mt-24 border-t border-[var(--glass-border)] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4 font-mono text-xs text-[var(--ink-muted)]">
          {settings.aboutEnabled && (
            <Link href={`/${locale}/sobre-mi`} data-cursor="magnetic" className="hover:text-accent">
              {dict.nav.about}
            </Link>
          )}
          <Link href={`/${locale}/contacto`} data-cursor="magnetic" className="hover:text-accent">
            {dict.nav.contact}
          </Link>
        </div>

        {socials.length > 0 && (
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="magnetic"
                aria-label={s.key}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--ink-muted)] transition-colors hover:text-accent"
              >
                {icons[s.key]}
              </a>
            ))}
          </div>
        )}

        <p className="font-mono text-[10px] text-[var(--ink-muted)]">
          © {new Date().getFullYear()} DJEZSHADOW
        </p>
      </div>
    </footer>
  );
}
