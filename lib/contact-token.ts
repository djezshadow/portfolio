import { SignJWT, jwtVerify } from "jose";

const alg = "HS256";

function getSecret() {
  // Reusa el mismo secreto de las sesiones de admin — acá no protege una
  // cuenta, solo evita que alguien arme un link de confirmación con datos
  // inventados (nombre/mail/mensaje falsos).
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Falta ADMIN_JWT_SECRET en .env");
  return new TextEncoder().encode(secret);
}

export type PendingContactMessage = {
  name: string;
  email: string;
  message: string;
};

/**
 * Token que viaja en el link de confirmación del mail (estilo
 * WeTransfer: "confirmá que sos vos antes de que el mensaje llegue").
 * Expira en 24hs — no tiene sentido confirmar un mensaje de hace una
 * semana.
 */
export async function createContactToken(data: PendingContactMessage): Promise<string> {
  return new SignJWT(data)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyContactToken(token: string): Promise<PendingContactMessage | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.name === "string" &&
      typeof payload.email === "string" &&
      typeof payload.message === "string"
    ) {
      return { name: payload.name, email: payload.email, message: payload.message };
    }
    return null;
  } catch {
    return null;
  }
}
