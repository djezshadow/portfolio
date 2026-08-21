export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Falta RESEND_API_KEY en las variables de entorno." };
  }

  // Con dominio propio verificado en Resend, mandá desde ahí (ej:
  // "DJEZSHADOW <hola@djezshadow.com>") — configurable por env var así no
  // hace falta tocar código cuando cambies de dominio o de casilla.
  // Sin verificar un dominio, Resend solo deja mandar desde su dominio de
  // pruebas (onboarding@resend.dev) y ÚNICAMENTE a la casilla con la que
  // te registraste — por eso ese es el respaldo si no configuraste esto.
  const from = process.env.RESEND_FROM_EMAIL || "DJEZSHADOW Portfolio <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        reply_to: opts.replyTo,
        subject: opts.subject,
        text: opts.text,
        // Opcional: si no se manda, Resend usa el text plano de arriba.
        // Se manda SIEMPRE junto con `text` (nunca solo html) — así el
        // mail funciona igual en clientes que no rendericen HTML.
        ...(opts.html ? { html: opts.html } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", body);
      return { ok: false, error: "No se pudo enviar el mail." };
    }
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No se pudo enviar el mail." };
  }
}
