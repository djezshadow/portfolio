import { defaultLocale } from "@/lib/i18n/dictionaries";

/**
 * Fallback por si alguna ruta llega a 404 SIN pasar por el prefijo de
 * idioma (caso raro, dado el middleware, pero Next.js exige que exista
 * algo acá igual). Sin el ThemeProvider/fuentes del layout de
 * [locale], así que se mantiene bien simple.
 */
export default function RootNotFound() {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#e9e4dc", color: "#17140f", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 1.5rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#b9873f", marginBottom: "1rem", fontFamily: "monospace" }}>
            404
          </span>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Página no encontrada / Page not found</h1>
          <a
            href={`/${defaultLocale}`}
            style={{
              display: "inline-block",
              borderRadius: 999,
              border: "1px solid rgba(23,20,15,0.15)",
              padding: "0.6rem 1.5rem",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Volver al inicio / Back home
          </a>
        </div>
      </body>
    </html>
  );
}
