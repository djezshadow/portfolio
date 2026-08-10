const positionClasses: Record<string, string> = {
  center: "items-center justify-center",
  "top-left": "items-start justify-start p-6",
  "top-right": "items-start justify-end p-6",
  "bottom-left": "items-end justify-start p-6",
  "bottom-right": "items-end justify-end p-6",
};

/**
 * Spinner default con onda de timecode (coherente con la estética del
 * sitio) — se usa mientras no hay una animación custom subida.
 */
function DefaultSpinner({ size }: { size: number }) {
  return (
    <div className="flex flex-col items-center gap-3" style={{ width: size }}>
      <div
        className="rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent)]"
        style={{ width: size * 0.45, height: size * 0.45, animation: "djez-loading-spin 0.9s linear infinite" }}
      />
      <span className="font-mono text-[10px] tracking-widest text-[var(--ink-muted)]">CARGANDO…</span>
      <style>{`
        @keyframes djez-loading-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Pantalla completa de carga (Next.js la muestra sola vía loading.tsx
 * mientras la página siguiente todavía está pidiendo datos — pensado
 * para Vercel free, que a veces tarda). Desktop y mobile tienen su
 * propia posición/tamaño, cada uno visible solo en su breakpoint.
 * Si no hay `customUrl` (gif/webp subido en /admin/configuracion), usa
 * el spinner default de la marca.
 */
export function FullscreenLoading({
  customUrl,
  position = "center",
  positionMobile = "center",
  size = 120,
  sizeMobile = 90,
}: {
  customUrl?: string | null;
  position?: string;
  positionMobile?: string;
  size?: number;
  sizeMobile?: number;
}) {
  return (
    <>
      <div className={`fixed inset-0 z-[300] hidden bg-[var(--bg)] sm:flex ${positionClasses[position] ?? positionClasses.center}`}>
        {customUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customUrl} alt="" style={{ width: size, height: size }} className="object-contain" />
        ) : (
          <DefaultSpinner size={size} />
        )}
      </div>
      <div className={`fixed inset-0 z-[300] flex bg-[var(--bg)] sm:hidden ${positionClasses[positionMobile] ?? positionClasses.center}`}>
        {customUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customUrl} alt="" style={{ width: sizeMobile, height: sizeMobile }} className="object-contain" />
        ) : (
          <DefaultSpinner size={sizeMobile} />
        )}
      </div>
    </>
  );
}
