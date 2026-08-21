import { getSiteSettings } from "@/lib/site-settings";
import { updateLoadingAnimation } from "./actions";
import { LoadingAnimationForm } from "@/components/admin/loading-animation-form";

export const dynamic = "force-dynamic";

export default async function AdminLoadingPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Animación de carga</h1>
      <p className="mb-8 font-mono text-xs text-[var(--ink-muted)]">
        Se muestra sola cada vez que alguien navega a una página nueva y el sitio tarda en traer
        los datos (Vercel free a veces tarda un toque).
      </p>

      <LoadingAnimationForm
        action={updateLoadingAnimation}
        currentUrl={settings.loadingAnimationUrl}
        initial={{
          position: settings.loadingAnimationPosition,
          positionMobile: settings.loadingAnimationPositionMobile,
          size: settings.loadingAnimationSize,
          sizeMobile: settings.loadingAnimationSizeMobile,
        }}
      />
    </div>
  );
}
