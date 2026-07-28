"use server";

export type ContactState = { ok: boolean; error?: string } | null;

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

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO;

  if (!apiKey || !to) {
    console.error("Falta RESEND_API_KEY o CONTACT_EMAIL_TO en .env");
    return { ok: false, error: "El formulario no está configurado todavía. Escribime directo por mail." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DJEZSHADOW Portfolio <onboarding@resend.dev>",
        to,
        reply_to: email,
        subject: `Nuevo contacto de ${name}`,
        text: `De: ${name} <${email}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", body);
      return { ok: false, error: "No se pudo enviar el mensaje. Probá de nuevo en un rato." };
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No se pudo enviar el mensaje. Probá de nuevo en un rato." };
  }
}
