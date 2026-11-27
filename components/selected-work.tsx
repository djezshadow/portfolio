import Link from "next/link";
import { ReelTrigger } from "./reel-trigger";
import type { ParsedVideo } from "@/lib/video-url";

export type WorkCard = { id: string; title: string; role: string | null; poster: string | null; video: boolean };

export function SelectedWork({ work, locale, reel }: { work: WorkCard[]; locale: string; reel: ParsedVideo | null }) {
  if (!work.length && !reel) return null;
  const en = locale === "en";
  const [lead, ...supporting] = work;
  const poster = lead?.poster ?? (reel?.provider === "youtube" ? `https://img.youtube.com/vi/${reel.videoId}/hqdefault.jpg` : null);
  return (
    <section aria-labelledby="selected-work" className="pb-16 pt-5 sm:pb-24 sm:pt-9">
      <div className="mb-5 flex items-baseline justify-between gap-5 border-b border-[var(--glass-border)] pb-4">
        <h2 id="selected-work" className="font-display text-3xl sm:text-5xl">{en ? "Selected work" : "Trabajos seleccionados"}</h2>
        {work.length > 0 && <a href="#categorias" className="shrink-0 text-sm text-accent hover:underline">{en ? "Categories" : "Categorías"}</a>}
      </div>
      <div className={`grid gap-3 ${supporting.length ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]" : ""}`}>
        <article className="group relative isolate flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white sm:min-h-[30rem] sm:p-8">
          {poster && <img src={poster} alt="" fetchPriority="high" draggable={false}
            className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]" />}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/30 to-black/5" />
          {lead && <>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-white/85">{lead.role || (lead.video ? "Film" : en ? "Photography" : "Fotografía")}</p>
            <h3 className="max-w-lg break-words font-display text-4xl leading-tight sm:text-6xl">{lead.title}</h3>
          </>}
          {!lead && <h3 className="font-display text-4xl leading-tight sm:text-6xl">{en ? "Showreel" : "Reel"}</h3>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {reel && <ReelTrigger video={reel} en={en} />}
            {lead && <Link href={`/${locale}/proyecto/${lead.id}`} className="inline-flex min-h-11 items-center rounded-full border border-white/55 bg-black/35 px-5 hover:bg-black/70">{en ? "View project" : "Ver trabajo"}</Link>}
          </div>
        </article>
        {!!supporting.length && <div className={`grid gap-3 ${supporting.length > 1 ? "sm:grid-cols-2 lg:grid-cols-1" : ""}`}>
          {supporting.map((project) => <WorkTile key={project.id} work={project} locale={locale} />)}
        </div>}
      </div>
    </section>
  );
}

export function WorkTile({ work, locale }: { work: WorkCard; locale: string }) {
  const en = locale === "en";
  return <Link href={`/${locale}/proyecto/${work.id}`}
    className="group relative isolate flex min-h-48 flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white focus-visible:outline-2 focus-visible:outline-offset-4">
    {work.poster && <img src={work.poster} alt="" loading="lazy" draggable={false}
      className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />}
    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
    <span className="mb-1 font-mono text-xs uppercase tracking-wider text-white/85">{work.video ? "Film" : en ? "Photography" : "Fotografía"}</span>
    <h3 className="break-words font-display text-2xl">{work.title}</h3>
    {work.role && <p className="mt-1 text-sm text-white/85">{work.role}</p>}
  </Link>;
}
