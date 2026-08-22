/**
 * Templates de mail — paleta NOIR real del sitio (papel fotográfico /
 * copia en plata, acento bronce), no la oscura (esa es Neón). Colores
 * copiados 1:1 de :root en app/globals.css:
 *   --bg: #e9e4dc | --bg-elevated: #f2eee7 | --ink: #17140f
 *   --ink-muted: #4a453c | --accent: #b9873f | --accent-strong: #8f6329
 *
 * Todo CSS inline a propósito: Gmail/Outlook/Apple Mail ignoran <style>
 * en el <head> en muchos casos. `backdrop-filter` (el blur real del
 * Liquid Glass del sitio) no lo soporta ningún cliente de mail — el
 * botón lo aproxima con un degradé sutil + borde + sombra, la técnica
 * estándar para simular vidrio esmerilado en HTML de email.
 *
 * Pedido: "botón de verificar mail en vez de mostrar el link completo y
 * feo" — el link real sigue estando en el HTML (algunos filtros de spam
 * lo esperan, y es el respaldo si el botón no se ve en algún cliente
 * viejo), pero ya no se imprime la URL cruda: es un link de texto corto
 * y prolijo, no "https://djezshadow.com/es/contacto/confirmar?token=...".
 */

const COLORS = {
  bg: "#e9e4dc",
  bgElevated: "#f2eee7",
  ink: "#17140f",
  inkMuted: "#4a453c",
  accent: "#b9873f",
  accentStrong: "#8f6329",
  border: "rgba(23, 20, 15, 0.12)",
};

function emailShell(opts: { locale: "es" | "en"; preheader: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="${opts.locale}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DJEZSHADOW</title>
  </head>
  <body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${opts.preheader}</div>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:${COLORS.bg}; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:480px; background-color:${COLORS.bgElevated}; border:1px solid ${COLORS.border}; border-radius:20px; overflow:hidden;">
            <tr>
              <td style="padding:36px 36px 8px 36px; text-align:center;">
                <span style="display:inline-block; font-family:Georgia,'Times New Roman',serif; font-size:13px; letter-spacing:0.25em; color:${COLORS.accent}; text-transform:uppercase;">DJEZSHADOW</span>
              </td>
            </tr>
            ${opts.body}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function confirmContactEmailHtml(opts: { name: string; confirmUrl: string; locale: "es" | "en" }) {
  const t =
    opts.locale === "en"
      ? {
          preheader: "Confirm your message to continue.",
          greeting: `Hey ${opts.name},`,
          body: "Tap the button below to confirm it's really you — once confirmed, your message goes straight to DJEZSHADOW.",
          button: "Confirm my message",
          fallback: "Button not working?",
          fallbackLink: "Confirm here",
          ignore: "Didn't request this? You can safely ignore this email.",
        }
      : {
          preheader: "Confirmá tu mensaje para continuar.",
          greeting: `Hola ${opts.name},`,
          body: "Tocá el botón de abajo para confirmar que sos vos — una vez confirmado, tu mensaje le llega directo a DJEZSHADOW.",
          button: "Confirmar mi mensaje",
          fallback: "¿El botón no funciona?",
          fallbackLink: "Confirmar acá",
          ignore: "¿No pediste esto? Podés ignorar este mail sin problema.",
        };

  const body = `
            <tr>
              <td style="padding:16px 36px 0 36px; text-align:center;">
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:${COLORS.ink}; font-weight:600;">${t.greeting}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 32px 36px; text-align:center;">
                <p style="margin:0; font-size:15px; line-height:1.6; color:${COLORS.inkMuted};">${t.body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px 36px; text-align:center;">
                <a href="${opts.confirmUrl}" target="_blank" style="display:inline-block; padding:14px 32px; border-radius:999px; text-decoration:none; font-size:15px; font-weight:600; color:#fff; background-color:${COLORS.accent}; background-image:linear-gradient(180deg, ${COLORS.accent} 0%, ${COLORS.accentStrong} 100%); border:1px solid rgba(255,255,255,0.35); box-shadow:0 8px 20px rgba(143,99,41,0.35);">
                  ${t.button}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px 36px; text-align:center;">
                <p style="margin:0; font-size:12px; color:${COLORS.inkMuted};">
                  ${t.fallback} <a href="${opts.confirmUrl}" target="_blank" style="color:${COLORS.accentStrong}; text-decoration:underline;">${t.fallbackLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px 36px; border-top:1px solid ${COLORS.border}; text-align:center;">
                <p style="margin:0; font-size:12px; color:${COLORS.inkMuted}; opacity:0.75;">${t.ignore}</p>
              </td>
            </tr>`;

  return emailShell({ locale: opts.locale, preheader: t.preheader, body });
}

export function newContactNotificationHtml(opts: {
  name: string;
  email: string;
  message: string;
  locale: "es" | "en";
}) {
  const t =
    opts.locale === "en"
      ? { preheader: "New confirmed message.", title: "New message", from: "From", reply: "Reply directly to this email to answer." }
      : { preheader: "Nuevo mensaje confirmado.", title: "Nuevo mensaje", from: "De", reply: "Respondé directo a este mail para contestar." };

  const safeMessage = opts.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const body = `
            <tr>
              <td style="padding:16px 36px 4px 36px; text-align:center;">
                <h1 style="margin:0; font-size:20px; color:${COLORS.ink}; font-weight:600;">${t.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 20px 36px; text-align:center;">
                <p style="margin:0; font-size:13px; color:${COLORS.inkMuted};">${t.from}: <strong style="color:${COLORS.ink};">${opts.name}</strong> &lt;${opts.email}&gt;</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px 36px;">
                <div style="background-color:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:14px; padding:18px; font-size:14px; line-height:1.6; color:${COLORS.ink};">
                  ${safeMessage}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 32px 36px; text-align:center;">
                <p style="margin:0; font-size:12px; color:${COLORS.inkMuted}; opacity:0.75;">${t.reply}</p>
              </td>
            </tr>`;

  return emailShell({ locale: opts.locale, preheader: t.preheader, body });
}
