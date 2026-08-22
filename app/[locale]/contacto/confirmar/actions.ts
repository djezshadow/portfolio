"use server";

import { sendEmail } from "@/lib/resend";
import { getSiteSettings } from "@/lib/site-settings";
import { verifyContactToken } from "@/lib/contact-token";
import { newContactNotificationHtml } from "@/lib/email-templates";

export type ConfirmState = { ok: boolean; error?: string };

export async function confirmContactMessage(token: string): Promise<ConfirmState> {
  const data = await verifyContactToken(token);
  if (!data) {
    return { ok: false, error: "Este link ya venció o no es válido. Volvé a escribirme desde el formulario." };
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
    subject: `Nuevo contacto de ${data.name} — DJEZSHADOW (confirmado)`,
    text: `De: ${data.name} <${data.email}>\n(mail confirmado por la persona que escribió)\n\n${data.message}`,
    // El aviso te llega siempre en español (es tu propia bandeja, no la
    // de quien escribió) — no depende del idioma en el que la otra
    // persona vio el sitio.
    html: newContactNotificationHtml({ name: data.name, email: data.email, message: data.message, locale: "es" }),
    replyTo: data.email,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "No se pudo enviar el mail." };
  }
  return { ok: true };
}
