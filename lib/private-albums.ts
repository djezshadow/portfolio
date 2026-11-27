import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : false;
}

function albumKey() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Falta ADMIN_JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export async function grantAlbum(id: string, accessVersion: string) {
  const token = await new SignJWT({ accessVersion }).setProtectedHeader({ alg: "HS256" })
    .setAudience("private-album").setSubject(id).setExpirationTime("8h").sign(albumKey());
  (await cookies()).set(`djz_album_${id}`, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 28800,
  });
  return token;
}

export async function canViewAlbum(id: string, accessVersion: string, viewerToken?: string) {
  if (await isAdmin()) return true;
  const token = viewerToken ?? (await cookies()).get(`djz_album_${id}`)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, albumKey(), {
      algorithms: ["HS256"], audience: "private-album", subject: id,
    });
    return payload.accessVersion === accessVersion;
  } catch {
    return false;
  }
}
