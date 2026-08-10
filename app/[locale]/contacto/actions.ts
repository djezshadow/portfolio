"use server";

import { sendEmail } from "@/lib/resend";
import { getSiteSettings } from "@/lib/site-settings";

export type ContactState = { ok: boolean; error?: string } | null;

/**
 * Manda el mensaje DIRECTO a tu casilla (CONTACT_EMAIL_TO / lo que hayas
 * puesto en Configuración), con "responder a" apuntando a quien escribió.
 *
 * Antes había un paso de doble confirmación (le mandaba un mail a la
 * persona que escribió el formulario, pidiéndole que lo confirme). Eso
 * requiere tener un dominio propio verificado en Resend — mientras no lo
 * tengas, Resend en modo sandbox SOLO deja mandar mails a la casilla con la
 * que te registraste, nunca a un tercero. Por eso siempre fallaba con
 * "No se pudo enviar el mail". Mandando directo a tu propia casilla, anda
 * sin necesitar dominio verificado.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Completá todos los campos." };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "El formulario no está configurado todavía. Escribime directo por mail." };
  }

  let to = process.env.CONTACT_EMAIL_TO || "";
  try {
    const settings = await getSiteSettings();
    if (settings.contactEmail) to = settings.contactEmail;
  } catch {
    // seguimos con el .env si la DB no está disponible
  }

  if (!to) {
    return { ok: false, error: "Falta configurar a dónde llegan los mensajes (CONTACT_EMAIL_TO)." };
  }

  const result = await sendEmail({
    to,
    subject: `Nuevo contacto de ${name} — DJEZSHADOW`,
    text: `De: ${name} <${email}>\n\n${message}`,
    replyTo: email,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "No se pudo enviar el mail." };
  }

  return { ok: true };
}
