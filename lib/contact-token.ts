import { SignJWT, jwtVerify } from "jose";

const alg = "HS256";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Falta ADMIN_JWT_SECRET en .env");
  return new TextEncoder().encode(secret);
}

export type ContactPayload = { name: string; email: string; message: string };

export async function createContactToken(payload: ContactPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getSecret());
}

export async function verifyContactToken(token: string): Promise<ContactPayload | null> {
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
