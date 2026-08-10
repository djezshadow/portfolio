import { getSiteSettings } from "@/lib/site-settings";
import { FullscreenLoading } from "@/components/loading-animation";

export default async function Loading() {
  let settings = {
    loadingAnimationUrl: null as string | null,
    loadingAnimationPosition: "center",
    loadingAnimationPositionMobile: "center",
    loadingAnimationSize: 120,
    loadingAnimationSizeMobile: 90,
  };
  try {
    settings = await getSiteSettings();
  } catch {
    // sin DB, usamos el spinner default igual
  }

  return (
    <FullscreenLoading
      customUrl={settings.loadingAnimationUrl}
      position={settings.loadingAnimationPosition}
      positionMobile={settings.loadingAnimationPositionMobile}
      size={settings.loadingAnimationSize}
      sizeMobile={settings.loadingAnimationSizeMobile}
    />
  );
}
