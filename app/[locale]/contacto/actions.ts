"use server";

import { sendEmail } from "@/lib/resend";
import { createContactToken } from "@/lib/contact-token";
import { confirmContactEmailHtml } from "@/lib/email-templates";

export type ContactState = { ok: boolean; error?: string } | null;

/**
 * Paso 1 (estilo WeTransfer): en vez de mandarte el mensaje directo, le
 * manda a QUIEN ESCRIBIÓ un mail para que confirme que es su casilla de
 * verdad — recién cuando toca el link de ahí, el mensaje te llega a vos
 * (ver confirmContactMessage). Esto evita mensajes de mails inventados y
 * asegura que siempre tengas un mail real al que responder.
 *
 * Necesita un dominio propio verificado en Resend (no el sandbox) porque
 * el mail de confirmación va a un tercero, no a tu propia casilla.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const locale = String(formData.get("locale") ?? "es") === "en" ? "en" : "es";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: locale === "en" ? "Fill in every field." : "Completá todos los campos." };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error:
        locale === "en"
          ? "The form isn't set up yet. Email me directly instead."
          : "El formulario no está configurado todavía. Escribime directo por mail.",
    };
  }

  const token = await createContactToken({ name, email, message });
  // Sin SITE_URL configurada, el link quedaba relativo ("/es/contacto/...")
  // — funciona bien DENTRO del sitio, pero no sirve para nada en un mail
  // (no hay "página actual" desde la que resolverlo). Con dominio propio
  // ya andando, este fallback asegura que el link SIEMPRE sea completo.
  const siteUrl = (process.env.SITE_URL || "https://djezshadow.com").replace(/\/$/, "");
  const confirmUrl = `${siteUrl}/${locale}/contacto/confirmar?token=${encodeURIComponent(token)}`;

  const subject = locale === "en" ? "Confirm your message to DJEZSHADOW" : "Confirmá tu mensaje a DJEZSHADOW";
  const text =
    locale === "en"
      ? `Hey ${name},\n\nTap the link below to confirm it's really you and send your message to DJEZSHADOW:\n\n${confirmUrl}\n\nIf you didn't request this, just ignore this email.`
      : `Hola ${name},\n\nTocá el link de abajo para confirmar que sos vos y que tu mensaje le llegue a DJEZSHADOW:\n\n${confirmUrl}\n\nSi no pediste esto, ignorá este mail.`;

  const result = await sendEmail({
    to: email,
    subject,
    text,
    html: confirmContactEmailHtml({ name, confirmUrl, locale }),
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "No se pudo enviar el mail." };
  }

  return { ok: true };
}
