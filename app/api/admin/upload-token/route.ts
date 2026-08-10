import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const store = await cookies();
        const token = store.get(SESSION_COOKIE_NAME)?.value;
        const valid = token ? await verifySessionToken(token) : false;
        if (!valid) throw new Error("No autorizado");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          addRandomSuffix: true,
          maximumSizeInBytes: 30 * 1024 * 1024, // 30MB por foto, de sobra para cámara/celular
        };
      },
      onUploadCompleted: async () => {
        // No hace falta hacer nada acá: el proyecto recién se asocia
        // cuando el admin le da "Guardar cambios".
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    );
  }
}
