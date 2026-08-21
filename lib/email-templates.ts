/**
 * Mail de confirmación (item pendiente del PDF: "diseño Noir + botón
 * liquid glass"). Todo CSS inline a propósito: Gmail/Outlook/Apple Mail
 * ignoran <style> en el <head> en muchos casos, así que lo seguro es
 * estilo inline en cada tag. Por la misma razón, `backdrop-filter` (el
 * blur real del efecto Liquid Glass del sitio) no se puede usar acá —
 * ningún cliente de mail lo soporta todavía. El botón lo aproxima con
 * un degradé sutil + borde claro + sombra, que es la técnica estándar
 * para simular vidrio esmerilado en HTML de email.
 */
export function confirmContactEmailHtml(opts: { name: string; confirmUrl: string; locale: "es" | "en" }) {
  const t =
    opts.locale === "en"
      ? {
          preheader: "Confirm your message to continue.",
          greeting: `Hey ${opts.name},`,
          body: "Tap the button below to confirm it's really you — once confirmed, your message goes straight to DJEZSHADOW.",
          button: "Confirm my message",
          fallback: "Or paste this link into your browser:",
          ignore: "Didn't request this? You can safely ignore this email.",
        }
      : {
          preheader: "Confirmá tu mensaje para continuar.",
          greeting: `Hola ${opts.name},`,
          body: "Tocá el botón de abajo para confirmar que sos vos — una vez confirmado, tu mensaje le llega directo a DJEZSHADOW.",
          button: "Confirmar mi mensaje",
          fallback: "O pegá este link en tu navegador:",
          ignore: "¿No pediste esto? Podés ignorar este mail sin problema.",
        };

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DJEZSHADOW</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0a0a0a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${t.preheader}</div>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#0a0a0a; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:480px; background-color:#111111; border:1px solid #262626; border-radius:20px; overflow:hidden;">
            <tr>
              <td style="padding:40px 36px 8px 36px; text-align:center;">
                <span style="display:inline-block; font-family:Georgia,'Times New Roman',serif; font-size:13px; letter-spacing:0.25em; color:#b9873f; text-transform:uppercase;">DJEZSHADOW</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 0 36px; text-align:center;">
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#f5f5f5; font-weight:600;">${t.greeting}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 32px 36px; text-align:center;">
                <p style="margin:0; font-size:15px; line-height:1.6; color:#a3a3a3;">${t.body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 32px 36px; text-align:center;">
                <!-- Botón "liquid glass": degradé claro sobre fondo oscuro +
                     borde semitransparente + sombra suave, la aproximación
                     más cercana a vidrio esmerilado que soportan los
                     clientes de mail (sin backdrop-filter real). -->
                <a href="${opts.confirmUrl}" target="_blank" style="display:inline-block; padding:14px 32px; border-radius:999px; text-decoration:none; font-size:15px; font-weight:600; color:#0a0a0a; background-color:#f5f5f5; background-image:linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(230,230,230,0.85) 100%); border:1px solid rgba(255,255,255,0.6); box-shadow:0 8px 24px rgba(0,0,0,0.35);">
                  ${t.button}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 32px 36px; text-align:center;">
                <p style="margin:0 0 6px 0; font-size:12px; color:#737373;">${t.fallback}</p>
                <a href="${opts.confirmUrl}" target="_blank" style="font-size:12px; color:#b9873f; word-break:break-all;">${opts.confirmUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px 36px; border-top:1px solid #262626; text-align:center;">
                <p style="margin:0; font-size:12px; color:#525252;">${t.ignore}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
