"use server";

import { createContactToken, verifyContactToken } from "@/lib/contact-token";
import { sendEmail } from "@/lib/resend";
import { getSiteSettings } from "@/lib/site-settings";

export type ContactState = { ok: boolean; error?: string } | null;

/**
 * Doble confirmación: en vez de mandar el mensaje directo, le mandamos un
 * mail de confirmación a QUIEN ESCRIBIÓ (a su propia casilla). Recién
 * cuando confirma ese mail (clickeando el botón), se le avisa al admin.
 * Esto evita spam y confirma que el email cargado es real.
 *
 * OJO: esto requiere tener un dominio verificado en Resend, porque el mail
 * de confirmación va dirigido a un desconocido (no a tu propia casilla de
 * Resend) — en modo sandbox, Resend no deja mandar a terceros.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!name || !email || !message) {
    return { ok: false, error: "Completá todos los campos." };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "El formulario no está configurado todavía. Escribime directo a ezche3819@gmail.com o por Instagram." };
  }

  const token = await createContactToken({ name, email, message });
  const baseUrl = process.env.SITE_URL || "";
  const confirmUrl = `${baseUrl}/${locale}/contacto/confirmar?token=${encodeURIComponent(token)}`;

  const isEs = locale === "es";

  const result = await sendEmail({
    to: email,
    subject: isEs ? "Confirmá tu mensaje — DJEZSHADOW" : "Confirm your message — DJEZSHADOW",
    text: [
      isEs ? `Hola ${name},` : `Hi ${name},`,
      "",
      isEs
        ? "Recibimos un mensaje con este email para DJEZSHADOW. Para confirmar que sos vos y que se envíe, entrá acá:"
        : "We received a message with this email for DJEZSHADOW. To confirm it's you and send it, click here:",
      confirmUrl,
      "",
      isEs
        ? "Si vos no escribiste esto, ignorá este mail — no hace falta que hagas nada, no se va a enviar nada a nadie."
        : "If you didn't write this, just ignore this email — nothing will be sent, no action needed.",
    ].join("\n"),
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "No se pudo enviar el mail de confirmación." };
  }

  return { ok: true };
}

export type ConfirmResult = { ok: boolean; error?: string; name?: string };

export async function confirmContactMessage(token: string): Promise<ConfirmResult> {
  const payload = await verifyContactToken(token);
  if (!payload) {
    return { ok: false, error: "Este link ya venció o no es válido. Escribí el formulario de nuevo." };
  }

  let to = process.env.CONTACT_EMAIL_TO || "";
  try {
    const settings = await getSiteSettings();
    if (settings.contactEmail) to = settings.contactEmail;
  } catch {
    // seguimos con el .env si la DB no está disponible
  }

  if (!to) {
    return { ok: false, error: "El destinatario de contacto no está configurado." };
  }

  const result = await sendEmail({
    to,
    subject: `Nuevo contacto confirmado de ${payload.name}`,
    text: `De: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    replyTo: payload.email,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, name: payload.name };
}
