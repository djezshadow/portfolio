export type ParsedVideo = { provider: "youtube" | "vimeo"; videoId: string };

/**
 * Acepta cualquier formato común de link de YouTube o Vimeo y devuelve
 * el provider + id que necesitamos guardar. Si no reconoce el link,
 * devuelve null (y el caller decide si avisar al usuario).
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { provider: "youtube", videoId: id };
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return { provider: "youtube", videoId: v };
      // /embed/ID o /shorts/ID
      const match = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return { provider: "youtube", videoId: match[2] };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = u.pathname.match(/(\d+)/);
      if (match) return { provider: "vimeo", videoId: match[1] };
    }
  } catch {
    // no era una URL válida — probamos si ya es un ID pelado de 11 caracteres (típico de YouTube)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return { provider: "youtube", videoId: url };
    }
  }

  return null;
}

/** Miniatura estática de YouTube (gratis, sin API key). Vimeo no tiene un
 * equivalente sin llamar a su oEmbed, así que devolvemos null para ese caso. */
export function getVideoThumbnail(provider: "youtube" | "vimeo", videoId: string): string | null {
  if (provider === "youtube") return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return null;
}
