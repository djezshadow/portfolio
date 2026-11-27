"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "./theme-provider";
import { SecretSpecsModal } from "./secret-specs-modal";

const LONG_PRESS_MS = 700;

export function SiteLogo({
  locale,
  noirLogoUrl,
  neonLogoUrl,
  size = 24,
  plain = false,
}: {
  locale: string;
  noirLogoUrl: string | null;
  neonLogoUrl: string | null;
  /// Alto en píxeles del logo (o del texto wordmark, escalado a juego).
  size?: number;
  /// true = sin caja/padding propio (para cuando va incrustado en la
  /// portada o en el logo de mobile, que ya no lleva cajita de vidrio).
  plain?: boolean;
}) {
  const { theme } = useTheme();
  const logoUrl = theme === "neon" ? neonLogoUrl : noirLogoUrl;

  // Pedido: "modal manteniendo el logo" — mantener presionado (no un
  // clic normal) abre la ficha secreta en vez de navegar a la home. Un
  // toque corto sigue navegando como siempre.
  const [secretOpen, setSecretOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  function startPress(event: React.PointerEvent<HTMLAnchorElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    cancelPress();
    longPressFired.current = false;
    origin.current = { x: event.clientX, y: event.clientY };
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setSecretOpen(true);
    }, LONG_PRESS_MS);
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    origin.current = null;
  }
  function handleClick(e: React.MouseEvent) {
    if (longPressFired.current && e.detail !== 0) {
      e.preventDefault();
      longPressFired.current = false;
    }
  }

  return (
    <>
      <Link
        href={`/${locale}`}
        data-cursor="magnetic"
        onPointerDown={startPress}
        onPointerMove={(event) => {
          const point = origin.current;
          if (point && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 12) cancelPress();
        }}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onClick={handleClick}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        style={{ WebkitTouchCallout: "none", userSelect: "none", WebkitUserSelect: "none" }}
        className={
          plain
            ? "inline-flex shrink-0 items-center transition-opacity hover:opacity-80"
            : "flex shrink-0 items-center rounded-full px-3 py-2 transition-colors hover:text-accent"
        }
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="DJEZSHADOW"
            width={size * 4}
            height={size}
            style={{ height: size, width: "auto" }}
            draggable={false}
            className="pointer-events-none object-contain"
          />
        ) : (
          <span className="pointer-events-none font-display tracking-tight" style={{ fontSize: Math.round(size * 0.55) }}>
            DJEZSHADOW
          </span>
        )}
      </Link>
      <SecretSpecsModal open={secretOpen} onClose={() => setSecretOpen(false)} locale={locale} />
    </>
  );
}
